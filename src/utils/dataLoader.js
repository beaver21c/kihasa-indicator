// 정적 JSON 로더 + 메모리 캐싱 (안내서 §4.3)
// GitHub Pages 대응: import.meta.env.BASE_URL 로 base 경로 자동 처리

const BASE = import.meta.env.BASE_URL; // 예: '/kihasa-indicator/'

let _regionCache = null;
let _customCache = null;
let _regionPromise = null;
let _customPromise = null;

async function fetchJson(file) {
  const url = `${BASE}data/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`데이터 로드 실패: ${url} (HTTP ${res.status})`);
  return res.json();
}

// 지역중심 리포트 데이터 (welfare_region.json, 사전 계산된 stats 포함)
export async function loadRegion() {
  if (_regionCache) return _regionCache;
  if (!_regionPromise) {
    _regionPromise = fetchJson('welfare_region.json').then((d) => {
      _regionCache = d;
      return d;
    });
  }
  return _regionPromise;
}

// 지역맞춤 리포트 데이터 (welfare_custom.json, 254개 원시값)
export async function loadCustom() {
  if (_customCache) return _customCache;
  if (!_customPromise) {
    _customPromise = fetchJson('welfare_custom.json').then((d) => {
      _customCache = d;
      return d;
    });
  }
  return _customPromise;
}
