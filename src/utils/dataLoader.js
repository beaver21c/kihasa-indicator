// 정적 JSON 로더 + 메모리 캐싱.
// - 경로는 항상 base 상대 경로('data/...')로 넘긴다. GitHub Pages 하위경로는
//   import.meta.env.BASE_URL 로 자동 처리된다.
// - 폐쇄망 단일 HTML 빌드(scripts/embed-data.mjs)에서는 동일한 상대 경로 키로
//   window.__EMBEDDED_DATA__ 에 데이터가 인라인되므로 fetch 없이 즉시 반환된다.

const BASE = import.meta.env.BASE_URL; // 예: '/kihasa-indicator/' 또는 './'

const _cache = new Map(); // relPath -> Promise<json>

// relPath 예: 'data/welfare_region.json', 'data/map/emd/11.topojson'
export function fetchData(relPath) {
  const embedded = typeof window !== 'undefined' && window.__EMBEDDED_DATA__;
  if (embedded && embedded[relPath]) return Promise.resolve(embedded[relPath]);
  const url = `${BASE}${relPath}`;
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`데이터 로드 실패: ${relPath} (HTTP ${res.status})`);
    return res.json();
  });
}

// 동일 경로 중복 요청 방지용 캐시 래퍼
export function loadJson(relPath) {
  if (!_cache.has(relPath)) {
    const p = fetchData(relPath).catch((e) => {
      _cache.delete(relPath); // 실패는 캐싱하지 않아 재시도 가능
      throw e;
    });
    _cache.set(relPath, p);
  }
  return _cache.get(relPath);
}

// 지역중심 리포트 데이터 (19개 핵심 지표, 사전 계산 stats 포함)
export const loadRegion = () => loadJson('data/welfare_region.json');

// 지역맞춤·지표 만들기 데이터 (254개 전체 지표 원시값)
export const loadCustom = () => loadJson('data/welfare_custom.json');

// 지표 단계구분도용 시·군·구 경계 (229개, 지표 지역코드 체계)
export const loadSigunguGeo = () => loadJson('data/sigungu.json');
