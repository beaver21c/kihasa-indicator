// 통합 대시보드 기능 점검 스크립트 (headless Chromium)
//
// 데이터 갱신·기능 추가 후 전 화면이 실제로 동작하는지 한 번에 확인한다.
// 저장소 의존성이 아니라 선택 도구다. 실행 전 playwright를 따로 설치할 것.
//
//   npm run build
//   # dist/ 를 정적 서버로 띄우고(하위경로 /kihasa-indicator/ 유지, SPA 폴백 필요)
//   npm i -D playwright && npx playwright install chromium
//   SMOKE_BASE=http://127.0.0.1:8199/kihasa-indicator/ node tools/smoke-check.mjs
//
// 외부 폰트·OSM 타일이 차단된 환경에서는 '배경지도(OSM)' 항목만 실패로 표시된다(정상).
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:8199/kihasa-indicator/';
// 브라우저 실행 파일 경로 (미지정 시 playwright 기본 설치본 사용)
const EXEC = process.env.SMOKE_CHROME || undefined;

const results = [];
function log(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const browser = await chromium.launch({ ...(EXEC ? { executablePath: EXEC } : {}), args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

// 로컬(앱) 유래 오류만 수집. 외부 폰트·OSM 타일 실패는 오프라인 환경 정상.
let errors = [];
const LOCAL = 'http://127.0.0.1:8199';
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const src = m.location?.().url || '';
  const t = m.text();
  // 외부(폰트·OSM 타일) 리소스 실패는 오프라인 점검 환경에서 정상
  if (src && !src.startsWith(LOCAL)) return;
  if (/fonts\.googleapis|fonts\.gstatic|tile\.openstreetmap|basemaps|ERR_(TUNNEL|CONNECTION|NAME|INTERNET|BLOCKED|PROXY)/i.test(t)) return;
  errors.push('console: ' + t);
});
page.on('response', (r) => {
  if (r.url().startsWith(LOCAL) && r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
});
page.on('requestfailed', (r) => {
  if (r.url().startsWith(LOCAL)) errors.push('reqfail: ' + r.url() + ' ' + r.failure()?.errorText);
});

const E = (n = 3) => errors.slice(0, n).join(' | ');

// 플롯 수가 안정될 때까지 대기
async function settledPlots(timeout = 40000) {
  const t0 = Date.now();
  let last = -1;
  let stable = 0;
  while (Date.now() - t0 < timeout) {
    const n = await page.locator('.js-plotly-plot').count();
    if (n === last && n > 0) {
      if (++stable >= 3) return n;
    } else {
      stable = 0;
      last = n;
    }
    await page.waitForTimeout(500);
  }
  return last;
}

async function goto(path, waitSel, label) {
  errors = [];
  await page.goto(BASE + path, { waitUntil: 'load' });
  try {
    await page.waitForSelector(waitSel, { timeout: 45000 });
    await page.waitForTimeout(500);
    log(label, errors.length === 0, E());
    return true;
  } catch {
    log(label, false, 'selector timeout: ' + waitSel + ' / ' + E());
    return false;
  }
}

/* ---------- 1. 홈 ---------- */
await goto('', 'text=통합 안내', '홈 진입');
log('홈 기능 카드 6종', (await page.locator('a:has-text("바로가기 →")').count()) === 6);

/* ---------- 2. 지역중심 리포트 ---------- */
if (await goto('region', '.js-plotly-plot', '지역중심 리포트 진입')) {
  const rowsN = await page.locator('div.grid.grid-cols-12').count();
  const plots = await settledPlots();
  // 19개 지표 행이 모두 나오고, 원자료가 전 연도 결측인 1개(인구십만명당 자살사망률)만 '데이터 없음'
  const nodata = await page.locator('text=데이터 없음').count();
  log('지역중심 지표 19행 렌더', rowsN === 19, `행 ${rowsN} · 차트 ${plots} · 데이터없음 ${nodata}`);
  log('결측 연도 자동 대체(연도 배지)', (await page.locator('text=/\\d{4}년 값/').count()) > 0);
  errors = [];
  await page.getByRole('button', { name: /^인구\s/ }).first().click();
  await page.waitForTimeout(800);
  const after = await page.locator('.js-plotly-plot').count();
  log('영역 그룹 접기', after === plots - 3, `${plots} → ${after}`);
  await page.getByRole('button', { name: /^인구\s/ }).first().click();
  await page.waitForTimeout(800);
  errors = [];
  await page.getByRole('radio', { name: '전국 비교' }).check();
  await page.waitForTimeout(2000);
  log('비교기준 전국 전환', errors.length === 0, E());
  errors = [];
  await page.locator('select').nth(2).selectOption('2019');
  await page.waitForTimeout(2500);
  log('연도 전환(2019)', errors.length === 0, E());
}

/* ---------- 3. 지역맞춤 리포트 ---------- */
if (await goto('custom', 'text=지역맞춤 리포트 설정', '지역맞춤 진입')) {
  errors = [];
  const boxes = page.locator('input[type=checkbox]');
  for (let i = 0; i < 3; i++) await boxes.nth(i).check();
  const plots = await settledPlots();
  log('지표 3개 선택 → 박스플롯', plots === 3, `${plots}개 / ${E()}`);
  errors = [];
  await page.locator('input[placeholder*="어린이집"]').fill('노인');
  await page.waitForTimeout(1000);
  log('지표명 검색 필터', errors.length === 0, E());
}

/* ---------- 4. 연도별 추이 ---------- */
if (await goto('trend', '.js-plotly-plot', '연도별 추이 진입')) {
  const plots = await settledPlots();
  log('추이 카드 19종', plots === 19, `${plots}개`);
  errors = [];
  await page.getByRole('checkbox', { name: '그래프 값 표시' }).check();
  await page.waitForTimeout(2500);
  const texts = await page.locator('.js-plotly-plot .scatterlayer text').count();
  log('그래프 값 표시', texts > 0 && errors.length === 0, `값 라벨 ${texts}개 / ${E()}`);
  errors = [];
  await page.locator('[aria-label="글자 크게"]').first().click();
  await page.waitForTimeout(1500);
  log('값 글자 크기 조절', errors.length === 0, E());
  errors = [];
  await page.getByRole('button', { name: '막대' }).first().click();
  await page.waitForTimeout(2500);
  log('막대 전환', errors.length === 0, E());
  errors = [];
  await page.getByRole('button', { name: '복수 지역 직접 비교' }).click();
  await page.waitForTimeout(2500);
  log('복수 지역 모드 전환', errors.length === 0, E());
  errors = [];
  await page.getByRole('button', { name: '단일 지역 vs 비교집단' }).click();
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("확대 ↗")').first().click();
  await page.waitForSelector('text=겹쳐보기(보조축)', { timeout: 15000 });
  await page.waitForTimeout(1500);
  log('확대 모달', errors.length === 0, E());
  errors = [];
  const modalSel = page.locator('select').last();
  await modalSel.selectOption({ index: 2 });
  await page.waitForTimeout(2500);
  log('보조축 겹쳐보기', errors.length === 0, E());
}

/* ---------- 5. 지표 지도 ---------- */
if (await goto('indicator-map', '.js-plotly-plot', '지표 단계구분도 진입')) {
  await page.waitForTimeout(2500);
  const paths = await page.locator('.js-plotly-plot .choroplethlayer path, .js-plotly-plot g.trace path').count();
  log('단계구분도 폴리곤 렌더', paths > 10, `${paths}개 path`);
  log('계급 범례', (await page.locator('text=/데이터 없음|~/').count()) > 0);
  log('순위 표기', (await page.locator('text=/전국 \\d+위/').count()) > 0);

  errors = [];
  await page.locator('button:has-text("🎨 색상 · 계급")').click();
  await page.waitForTimeout(400);
  await page.locator('select').filter({ hasText: '네이비(기본)' }).selectOption('rdbu');
  await page.waitForTimeout(1500);
  await page.locator('select').filter({ hasText: '자연분류' }).selectOption('quantile');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: '7', exact: true }).click();
  await page.waitForTimeout(1800);
  await page.getByRole('checkbox', { name: '색 방향 반전' }).check();
  await page.waitForTimeout(1500);
  await page.locator('select').filter({ hasText: '전국 기준' }).selectOption('group');
  await page.waitForTimeout(1800);
  log('색상·분류·계급·반전·계급기준', errors.length === 0, E());

  errors = [];
  await page.locator('button:has-text("🗺 범위 · 배경 · 라벨")').click();
  await page.waitForTimeout(400);
  await page.locator('select').filter({ hasText: '나의 시·도' }).selectOption('nation');
  await page.waitForTimeout(4000);
  log('표시 범위 전국', errors.length === 0, E());
  errors = [];
  await page.locator('select').filter({ hasText: '지역명+값' }).selectOption('value');
  await page.waitForTimeout(2000);
  await page.locator('[aria-label="글자 작게"]').first().click();
  await page.waitForTimeout(1500);
  log('라벨 종류·글자 크기', errors.length === 0, E());
  errors = [];
  await page.locator('select').filter({ hasText: '도형만' }).selectOption('osm');
  await page.waitForTimeout(4000);
  // 이 점검 환경은 외부 타일 서버가 차단되어 있다. 앱 자체 오류(로컬 리소스)만 실패로 본다.
  const localErr = errors.filter((e) => !/Failed to fetch|Mapbox error|mapbox/i.test(e));
  log('배경지도(OSM) 전환(외부 타일 차단 환경)', localErr.length === 0, localErr.slice(0, 2).join(' | ') || '외부 타일 미도달만 관측');
  errors = [];
  await page.locator('select').filter({ hasText: '배경 지도' }).selectOption('none');
  await page.waitForTimeout(2500);
  // 지표 변경
  await page.locator('input[placeholder="예: 노인, 어린이집, 자살"]').fill('자살');
  await page.waitForTimeout(800);
  const radios = page.locator('input[name="ind"]:not([disabled])');
  if (await radios.count()) {
    await radios.first().check();
    await page.waitForTimeout(3000);
  }
  log('지표 검색·전환', errors.length === 0, E());
  errors = [];
  const dl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
  await page.locator('button:has-text("지도 PNG 저장")').click();
  const d = await dl;
  log('지표 지도 PNG 저장', !!d, d ? await d.suggestedFilename() : 'download 없음 / ' + E());
}

/* ---------- 6. 지표 만들기 ---------- */
if (await goto('builder', 'text=지표 만들기 설정', '지표 만들기 진입')) {
  errors = [];
  const bq = page.locator('input[placeholder="예: 노인, 인구, 시설"]');
  await bq.fill('노인');
  await page.waitForTimeout(800);
  await page.locator('button[title="분자로 추가"]').first().click();
  await page.waitForTimeout(2000);
  log('분자 배치 → 산식/요약', (await page.locator('text=공통 가용 연도').count()) > 0, E());
  errors = [];
  await bq.fill('인구');
  await page.waitForTimeout(800);
  await page.locator('button[title="분모로 지정"]').first().click();
  const plots = await settledPlots();
  log('분모 지정 → 추이+지도 산출', plots >= 2, `${plots}개 / ${E()}`);
  log('비공식 표기 삽입', (await page.locator('text=이용자 정의(비공식)').count()) > 0);
  errors = [];
  await page.locator('select[title="단위조정 계수"]').selectOption('1000');
  await page.waitForTimeout(2500);
  log('단위조정 계수 적용', errors.length === 0, E());
  errors = [];
  await page.getByRole('checkbox', { name: '그래프 값 표시' }).check();
  await page.waitForTimeout(2000);
  log('빌더 그래프 값 표시', errors.length === 0, E());
  errors = [];
  await page.locator('button:has-text("링크 복사")').click();
  await page.waitForTimeout(800);
  const url = page.url();
  log('산식 링크 공유(URL 반영)', url.includes('num='), decodeURIComponent(url).slice(0, 140));
  errors = [];
  await page.goto(url, { waitUntil: 'load' });
  const replot = await settledPlots();
  log('공유 URL 재진입 재현', replot >= 2, `${replot}개 / ${E()}`);
  await page.locator('button:has-text("자연어로 지표 만들기")').click();
  await page.waitForTimeout(400);
  log('자연어 패널(키 없이도 동작)', (await page.locator('text=Gemini API 키').count()) > 0);
}

/* ---------- 7. GIS 지도분석 ---------- */
if (await goto('map', '.leaflet-container', 'GIS 지도분석 진입')) {
  errors = [];
  await page.waitForTimeout(4000);
  const paths = await page.locator('.leaflet-overlay-pane path').count();
  log('전국 시군구 폴리곤', paths > 200, `${paths}개 / ${E()}`);
  errors = [];
  await page.locator('button:has-text("① 보기 모드 · 지역")').click();
  await page.waitForTimeout(400);
  await page.getByRole('radio', { name: '시도 선택 → 읍면동' }).check();
  await page.waitForTimeout(600);
  await page.locator('aside select').first().selectOption('11');
  await page.waitForTimeout(5000);
  const emd = await page.locator('.leaflet-overlay-pane path').count();
  log('시도 → 읍면동(서울)', emd > 300, `${emd}개 / ${E()}`);
  errors = [];
  await page.locator('button:has-text("② 데이터 입력")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("직접 입력")').click();
  await page.waitForTimeout(1000);
  const inputs = page.locator('input[type=number]');
  const cnt = await inputs.count();
  for (let i = 0; i < Math.min(10, cnt); i++) await inputs.nth(i).fill(String(10 + i * 7));
  await page.waitForTimeout(2500);
  log('직접 입력 → 색상 반영', errors.length === 0 && cnt > 0, `입력칸 ${cnt}개 / ${E()}`);
  log('지도 범례', (await page.locator('text=범례').count()) > 0);
  errors = [];
  await page.locator('button:has-text("③ 색상 설정")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Viridis")').click();
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("자연단절(Jenks)")').click();
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("7")').last().click();
  await page.waitForTimeout(2000);
  log('팔레트·분류·단계 변경', errors.length === 0, E());
  errors = [];
  await page.locator('button:has-text("④ 기관 위치 표시")').click();
  await page.waitForTimeout(500);
  log('기관 위치 섹션', (await page.locator('text=좌표 직접').count()) > 0, E());
  errors = [];
  const tdl = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await page.locator('button:has-text("기관 위치 양식 다운로드")').click();
  const td = await tdl;
  log('기관 양식 xlsx 다운로드', !!td, td ? await td.suggestedFilename() : 'download 없음 / ' + E());
  errors = [];
  await page.locator('button:has-text("② 데이터 입력")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("엑셀 업로드")').click();
  await page.waitForTimeout(500);
  const edl = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await page.locator('button:has-text("엑셀 양식 다운로드")').click();
  const ed = await edl;
  log('데이터 양식 xlsx 다운로드', !!ed, ed ? await ed.suggestedFilename() : 'download 없음 / ' + E());
  errors = [];
  await page.locator('button:has-text("이용 가이드")').click();
  await page.waitForSelector('text=전체 이용 가이드', { timeout: 10000 });
  await page.locator('button:has-text("시작하기")').click();
  await page.waitForTimeout(500);
  log('이용 가이드 모달', errors.length === 0, E());
  errors = [];
  const pdl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
  await page.locator('button:has-text("⬇ PNG")').click();
  const pd = await pdl;
  log('GIS PNG 내보내기', !!pd, pd ? await pd.suggestedFilename() : 'download 없음 / ' + E());
  errors = [];
  page.once('dialog', (dg) => dg.accept());
  await page.locator('button:has-text("리셋")').click();
  await page.waitForTimeout(2500);
  log('전역 리셋', errors.length === 0, E());
  log('사용 단계 안내바', (await page.locator('text=보기 모드·지역').count()) > 0);
}

/* ---------- 8. 리포트 PNG ---------- */
errors = [];
await page.goto(BASE + 'region', { waitUntil: 'load' });
await settledPlots();
{
  const dl = page.waitForEvent('download', { timeout: 120000 }).catch(() => null);
  await page.locator('button:has-text("PNG 저장")').click();
  const d = await dl;
  log('지역중심 리포트 PNG 저장', !!d, d ? await d.suggestedFilename() : 'download 없음 / ' + E());
}

/* ---------- 9. 푸터 출처 상시 노출 ---------- */
log('푸터 경계데이터 출처 표기', (await page.locator('text=vuski/admdongkor').count()) > 0);
log('푸터 KIHASA 표기', (await page.locator('text=한국보건사회연구원').first().count()) > 0);

await browser.close();

const fail = results.filter((r) => !r.ok);
console.log(`\n=== 합계 ${results.length}건 · 성공 ${results.length - fail.length} · 실패 ${fail.length} ===`);
if (fail.length) {
  console.log('실패 목록:');
  fail.forEach((f) => console.log(' - ' + f.name + ' :: ' + f.detail));
}
process.exit(fail.length ? 1 : 0);
