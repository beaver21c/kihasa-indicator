// 자연어 → 지표 산식 변환 (Gemini API, 이용자 본인 키)
//
// 설계 원칙
//  - AI는 산식 설계만 담당. 계산·검증·시각화는 전부 브라우저에서 로컬 수행.
//  - 외부로 나가는 것은 질의문과 지표 목록(공개 메타)뿐. 지표 "값"은 전송하지 않음.
//  - 키는 HTTP 헤더(x-goog-api-key)로만 전달 → 주소창·리퍼러·프록시 로그에 남지 않음.
//  - 키 저장은 기본 세션(탭 닫으면 삭제), 선택 시에만 브라우저 보관.

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const KEY_NAME = 'kihasa.gemini.key';

export function loadKey() {
  try {
    return sessionStorage.getItem(KEY_NAME) || localStorage.getItem(KEY_NAME) || '';
  } catch {
    return '';
  }
}

export function saveKey(key, persist) {
  try {
    sessionStorage.setItem(KEY_NAME, key);
    if (persist) localStorage.setItem(KEY_NAME, key);
    else localStorage.removeItem(KEY_NAME);
  } catch {
    /* 저장소 접근 불가 환경은 무시 (메모리 사용) */
  }
}

export function clearKey() {
  try {
    sessionStorage.removeItem(KEY_NAME);
    localStorage.removeItem(KEY_NAME);
  } catch {
    /* noop */
  }
}

// 무료 티어 한도가 높은 flash 계열 최신 안정판을 우선 사용
function rankModel(name) {
  const n = name.toLowerCase();
  if (n.includes('preview') || n.includes('exp')) return -1; // 실험판은 후순위
  if (n.includes('flash-lite')) return 80;
  if (n.includes('flash')) return 100;
  if (n.includes('pro')) return 40;
  return 10;
}

export async function listModels(key) {
  const res = await fetch(`${BASE}/models`, { headers: { 'x-goog-api-key': key } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`모델 목록 조회 실패 (HTTP ${res.status}) ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((n) => rankModel(n) > 0)
    .sort((a, b) => rankModel(b) - rankModel(a) || b.localeCompare(a));
}

const PROMPT = (question, catalog) => `당신은 대한민국 지역사회보장지표 분석 보조자다.
아래 "지표 목록"에 있는 항목만 사용해서, 사용자의 요구를 계산 가능한 산식으로 옮겨라.

산식 형태는 하나뿐이다:
  값 = ( 분자 항목들의 합 ) ÷ ( 분모 항목 1개 ) × 계수
분모가 필요 없으면 denominator 는 빈 문자열로 둔다.
계수(factor)는 1, 100, 1000, 10000, 100000 중 하나만 쓴다.

반드시 아래 JSON 형식만 출력한다(코드펜스·설명 금지):
{"name":"지표 가칭","numerator":["키1","키2"],"denominator":"키3","factor":1000,"desc":"한 문장 설명"}

키는 반드시 지표 목록의 "key" 값을 그대로 쓴다. 목록에 없는 키는 만들지 않는다.

[지표 목록]
${catalog}

[사용자 요구]
${question}`;

async function generate(key, model, prompt) {
  const res = await fetch(`${BASE}/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) throw new Error('빈 응답을 받았다.');
  return text;
}

function parseJson(text) {
  const t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('응답을 JSON으로 해석하지 못했다.');
  }
}

/**
 * 자연어 → 산식 정의
 * @param {string} key   Gemini API 키
 * @param {string} question 자연어 요구
 * @param {Array}  indicators welfare_custom.json 의 indicators (key/name/unit/sheet)
 * @returns {{def, model, warnings:string[], desc:string}}
 */
export async function askFormula(key, question, indicators) {
  if (!key) throw new Error('Gemini API 키가 필요하다.');
  const catalog = indicators
    .map((i) => `- key:${i.key} | ${i.name} | 단위:${i.unit || '-'} | 영역:${i.sheet}`)
    .join('\n');
  const prompt = PROMPT(question, catalog);

  let models = [];
  try {
    models = await listModels(key);
  } catch {
    models = []; // 목록 조회가 막혀도 알려진 기본 모델로 시도
  }
  if (!models.length) models = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

  let lastErr = null;
  for (const model of models.slice(0, 5)) {
    try {
      const text = await generate(key, model, prompt);
      const raw = parseJson(text);
      const valid = new Set(indicators.map((i) => i.key));
      const warnings = [];
      const num = (raw.numerator || []).filter((k) => {
        if (valid.has(k)) return true;
        warnings.push(`존재하지 않는 항목 제외: ${k}`);
        return false;
      });
      let den = raw.denominator || '';
      if (den && !valid.has(den)) {
        warnings.push(`존재하지 않는 분모 제외: ${den}`);
        den = '';
      }
      const allowed = [1, 100, 1000, 10000, 100000];
      const factor = allowed.includes(Number(raw.factor)) ? Number(raw.factor) : 1;
      if (!num.length) throw new Error('사용 가능한 분자 항목을 찾지 못했다. 질문을 더 구체적으로 적을 것.');
      return {
        def: { num, den, factor, name: raw.name || question.slice(0, 30) },
        model,
        warnings,
        desc: raw.desc || '',
      };
    } catch (e) {
      lastErr = e;
      // 한도 초과(429)·지원 중단(404)이면 다음 모델로 자동 전환
      if (e.status === 429 || e.status === 404) continue;
      throw e;
    }
  }
  throw lastErr || new Error('산식 생성에 실패했다.');
}
