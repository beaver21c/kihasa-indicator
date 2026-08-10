// 지역사회보장 종합분석 플랫폼 - 공통 상수

// 상단 내비게이션
export const NAV_ITEMS = [
  { to: '/region', label: '지역중심', short: '지역' },
  { to: '/custom', label: '지역맞춤', short: '맞춤' },
  { to: '/trend', label: '연도별 추이', short: '추이' },
  { to: '/indicator-map', label: '지표 지도', short: '지표지도' },
  { to: '/builder', label: '지표 만들기', short: '만들기' },
  { to: '/map', label: 'GIS 지도분석', short: 'GIS' },
  { to: '/guide', label: '이용안내', short: '안내' },
];

// 7대 유형 라벨 (시군구 유형)
export const TYPE7_LABEL = {
  1: '광역도시형',
  2: '일반도시형',
  3: '대규모 제한도시형',
  4: '소규모 제한도시형',
  5: '도농복합형',
  6: '대규모 농촌형',
  7: '소규모 농촌형',
};

// 박스플롯 색상 토큰 (rcssp_index 동일)
export const COLORS = {
  target: '#c0392b', // 선택지역 (빨강)
  avg: '#1a4f8a', // 비교평균 (파랑)
  iqr: '#a8c5ff', // IQR 박스 (Q1~Q3)
  whisker: '#94a3b8', // 위스커 (Min~Max)
  caption: '#64748b', // 수치 캡션 (slate-500)
};

// 지역중심 리포트 카테고리 표시 순서
export const CAT_ORDER = ['인구', '총괄', '돌봄(아동)', '돌봄(성인)', '건강', '기타'];

// 비교 기준 옵션
export const CMP_OPTIONS = [
  ['sido', '광역(시·도) 내 비교'],
  ['type', '시·군·구 유형별 비교'],
  ['national', '전국 비교'],
];

// 브랜드 컬러 (헤더/배너)
export const BRAND = '#1a4f8a';

// 연도별 추이: 복수 지역 최대 선택 수
export const TREND_MAX_REGIONS = 5;

// 연도별 추이: 지역별 고정 색 팔레트 (최대 5색)
export const TREND_PALETTE = ['#1a4f8a', '#c0392b', '#27ae60', '#e67e22', '#8e44ad'];

// 연도별 추이: 비교 모드
export const TREND_MODES = [
  ['single', '단일 지역 vs 비교집단'],
  ['multi', '복수 지역 직접 비교'],
];

/* ─────────── 단계구분도(지표 지도 · 지표 만들기 공용) ─────────── */

// 색상 11종 — a=최저계급, b=최고계급, m=중간색(있으면 발산형)
export const MAP_PALETTES = {
  navy: { name: '네이비(기본)', a: [232, 240, 248], b: [0, 55, 107] },
  blue: { name: '블루', a: [227, 242, 253], b: [13, 71, 161] },
  teal: { name: '틸(청록)', a: [224, 244, 243], b: [0, 77, 84] },
  green: { name: '그린', a: [232, 245, 233], b: [27, 94, 32] },
  olive: { name: '올리브', a: [241, 246, 225], b: [85, 107, 17] },
  orange: { name: '오렌지', a: [255, 243, 224], b: [191, 74, 0] },
  red: { name: '레드', a: [253, 235, 238], b: [150, 12, 35] },
  purple: { name: '퍼플', a: [243, 232, 248], b: [74, 20, 110] },
  gray: { name: '그레이(흑백 인쇄)', a: [242, 242, 242], b: [38, 38, 38] },
  rdbu: { name: '발산: 파랑↔빨강', a: [33, 102, 172], m: [247, 247, 247], b: [178, 24, 43] },
  brbg: { name: '발산: 갈색↔청록', a: [140, 81, 10], m: [245, 245, 245], b: [1, 102, 94] },
};

// 분류 방식 3종
export const CLASS_METHODS = [
  ['jenks', '자연분류(Fisher–Jenks)'],
  ['quantile', '등분위'],
  ['equal', '등간격'],
];

// 라벨 4종
export const LABEL_OPTS = [
  ['both', '지역명+값'],
  ['name', '지역명'],
  ['value', '값'],
  ['none', '라벨 없음'],
];

// 지도 표시 범위 2종
export const VIEW_OPTS = [
  ['sido', '나의 시·도'],
  ['nation', '전국'],
];

// 배경 2종
export const BASE_OPTS = [
  ['none', '도형만'],
  ['osm', '배경 지도(OpenStreetMap)'],
];

// 계급 기준 2종
export const SCOPE_OPTS = [
  ['all', '전국 기준'],
  ['group', '비교집단 기준'],
];

// 데이터 없음 칸 색
export const MISSING_FILL = '#e6eaef';

// 라벨·값 글자 크기 조절 범위(pt)
export const FS_MIN = 4;
export const FS_MAX = 20;
export const FS_STEP = 0.5;
