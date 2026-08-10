// 이용자 정의 지표(신규지표) 산식 계산 유틸
//   값(지역, 연도) = ( Σ 분자 항목 ) ÷ ( 분모 항목 ) × 계수
//   분모를 비우면 합산값 자체가 지표가 된다.
import { fmt } from './format';

// 단위조정 계수 선택지
export const FACTORS = [
  [1, '×1 (그대로)'],
  [100, '×100 (백분율 등)'],
  [1000, '×1,000 (천 명당 등)'],
  [10000, '×1만'],
  [100000, '×10만 (10만 명당 등)'],
];

export const emptyDef = () => ({ num: [], den: '', factor: 1, name: '' });

const yearsOf = (ind) => (ind?.years || []).map(String);

// 선택 항목들의 공통 가용 연도(교집합)
export function commonYears(indByKey, keys) {
  const list = keys.map((k) => indByKey[k]).filter(Boolean);
  if (!list.length) return [];
  let acc = new Set(yearsOf(list[0]));
  for (const ind of list.slice(1)) {
    const s = new Set(yearsOf(ind));
    acc = new Set([...acc].filter((y) => s.has(y)));
  }
  return [...acc].sort();
}

// 정의에 사용된 모든 항목 키
export const defKeys = (def) => [...def.num, ...(def.den ? [def.den] : [])];

/**
 * 산식 계산 → { byYear: { 연도: { 코드: 값 } }, years, stats }
 * data: welfare_custom.json (indicators/data/areas)
 */
export function computeDef(data, def) {
  const indByKey = Object.fromEntries(data.indicators.map((i) => [i.key, i]));
  const keys = defKeys(def);
  const years = commonYears(indByKey, keys);
  const codes = Object.keys(data.areas);
  const byYear = {};
  const counts = {}; // 연도별 유효/결측/분모0 집계

  for (const y of years) {
    const out = {};
    let ok = 0;
    let missing = 0;
    let zeroDen = 0;
    for (const code of codes) {
      let sum = 0;
      let bad = false;
      for (const k of def.num) {
        const v = data.data[k]?.[y]?.[code];
        if (v == null || Number.isNaN(Number(v))) {
          bad = true;
          break;
        }
        sum += Number(v);
      }
      if (bad) {
        missing++;
        continue;
      }
      let val = sum;
      if (def.den) {
        const d = data.data[def.den]?.[y]?.[code];
        if (d == null || Number.isNaN(Number(d))) {
          missing++;
          continue;
        }
        if (Number(d) === 0) {
          zeroDen++;
          continue;
        }
        val = sum / Number(d);
      }
      out[code] = val * (def.factor || 1);
      ok++;
    }
    byYear[y] = out;
    counts[y] = { ok, missing, zeroDen };
  }

  return { years, byYear, counts };
}

// 값이 실제로 산출된 가장 최근 연도 (없으면 null)
export function latestYearWithData(result) {
  if (!result?.years?.length) return null;
  for (let i = result.years.length - 1; i >= 0; i--) {
    const y = result.years[i];
    if (Object.keys(result.byYear[y] || {}).length) return y;
  }
  return null;
}

// 최신(산출 가능) 연도 기준 요약 (평균·중앙값·범위)
export function summarize(result) {
  const y = latestYearWithData(result) || result.years[result.years.length - 1];
  if (!y) return null;
  const vals = Object.values(result.byYear[y] || {}).filter((v) => Number.isFinite(v));
  if (!vals.length) return { year: y, n: 0, ...result.counts[y] };
  const sorted = [...vals].sort((a, b) => a - b);
  const n = sorted.length;
  const avg = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  return {
    year: y,
    n,
    avg,
    median,
    min: sorted[0],
    max: sorted[n - 1],
    ...result.counts[y],
  };
}

// 산식 문자열 (산출물에 자동 삽입)
export function formulaText(indByKey, def) {
  const nm = (k) => indByKey[k]?.name || k;
  const numPart = def.num.length ? def.num.map(nm).join(' + ') : '(분자 없음)';
  const body = def.den ? `(${numPart}) ÷ (${nm(def.den)})` : numPart;
  const f = def.factor && def.factor !== 1 ? ` × ${def.factor.toLocaleString('ko-KR')}` : '';
  return `${body}${f}`;
}

// 표시 자릿수 경고 — 소수점 포함 10자 초과 시 계수 조정 권장
export function digitWarning(summary) {
  if (!summary || !summary.n) return null;
  const sample = fmt(summary.median);
  if (sample.replace('-', '').length <= 10) return null;
  const abs = Math.abs(summary.median);
  let suggest = 1;
  if (abs > 0 && abs < 0.001) suggest = 100000;
  else if (abs < 0.01) suggest = 10000;
  else if (abs < 0.1) suggest = 1000;
  else if (abs < 1) suggest = 100;
  else suggest = 1; // 값이 너무 크면 계수를 낮출 것
  return {
    sample,
    suggest,
    message:
      abs < 1
        ? `표시값이 너무 작다(예: ${sample}). 단위조정 계수를 ×${suggest.toLocaleString('ko-KR')} 이상으로 올리는 것을 권장.`
        : `표시값 자릿수가 길다(예: ${sample}). 단위조정 계수를 낮추는 것을 권장.`,
  };
}

/* ── URL 공유 (값이 아닌 산식만 담으므로 데이터 갱신 시 자동 최신화) ── */

export function defToParams(def) {
  const p = new URLSearchParams();
  if (def.num.length) p.set('num', def.num.join('~'));
  if (def.den) p.set('den', def.den);
  if (def.factor && def.factor !== 1) p.set('f', String(def.factor));
  if (def.name) p.set('name', def.name);
  return p;
}

export function paramsToDef(params) {
  const num = (params.get('num') || '').split('~').filter(Boolean);
  const den = params.get('den') || '';
  const factor = Number(params.get('f') || 1) || 1;
  const name = params.get('name') || '';
  return { num, den, factor, name };
}
