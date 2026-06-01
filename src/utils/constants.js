// 지역사회보장지표 대시보드 - 공통 상수 (안내서 §5.2)

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
  target: '#c0392b',  // 선택지역 (빨강)
  avg: '#1a4f8a',     // 비교평균 (파랑)
  iqr: '#a8c5ff',     // IQR 박스 (Q1~Q3)
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
