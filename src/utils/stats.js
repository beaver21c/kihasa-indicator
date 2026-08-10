// 통계 계산 유틸 (rcssp_index utils.py의 JavaScript 포팅, 안내서 §5.1)

// 기본 통계: Min, Max, Avg, Q1, Q3, N
export function calcStats(values) {
  const vals = (values || [])
    .filter((v) => v !== null && v !== undefined && !isNaN(v))
    .map(Number)
    .sort((a, b) => a - b);
  if (vals.length === 0) return null;
  const n = vals.length;
  const avg = vals.reduce((a, b) => a + b, 0) / n;
  const percentile = (p) => {
    if (n === 1) return vals[0];
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return vals[lo] + (vals[hi] - vals[lo]) * (idx - lo);
  };
  return {
    min: vals[0],
    max: vals[n - 1],
    avg,
    q1: percentile(0.25),
    q3: percentile(0.75),
    n,
  };
}

// 비교기준(광역 / 유형 / 전국)에 해당하는 시군구 코드 목록
// 조건을 만족하지 않으면 null (예: 유형 비교인데 대상 시군구 유형 정보 없음)
export function getGroupCodes(areas, cmpMode, curSido, curSgg) {
  if (cmpMode === 'sido') {
    return Object.entries(areas)
      .filter(([, a]) => a.sido === curSido)
      .map(([c]) => c);
  }
  if (cmpMode === 'national') return Object.keys(areas);
  if (cmpMode === 'type' && curSgg) {
    const myType = areas[curSgg]?.type7;
    if (!myType) return null;
    return Object.entries(areas)
      .filter(([, a]) => a.type7 === myType)
      .map(([c]) => c);
  }
  return null;
}

// 비교기준별 통계 (광역 / 유형 / 전국)
// rawData: { 지자체코드(5자리): 값 } 형태의 평탄화 맵
export function getCmpStats(rawData, areas, cmpMode, curSido, curSgg) {
  if (!rawData) return null;
  const codes = getGroupCodes(areas, cmpMode, curSido, curSgg);
  if (!codes) return null;
  const vals = codes.map((c) => rawData[c]).filter((v) => v != null && !isNaN(v));
  return calcStats(vals);
}

// 원자료에는 연도 키는 있으나 내용이 비어 있는 블록({})이 섞여 있다.
// 선택 연도에 값이 없으면 그 이전의 가장 최근 유효 연도를 돌려준다(없으면 null).
export function pickYearBlock(indicator, year) {
  const by = indicator?.data_by_year || {};
  const filled = (y) => by[y] && Object.keys(by[y]).length > 0;
  if (filled(year)) return year;
  const prev = Object.keys(by)
    .filter((y) => y <= year && filled(y))
    .sort();
  return prev.length ? prev[prev.length - 1] : null;
}

// 지표에 유효 데이터가 있는 연도 목록
export function filledYears(indicator) {
  const by = indicator?.data_by_year || {};
  return Object.keys(by)
    .filter((y) => Object.keys(by[y]).length > 0)
    .sort();
}

// 지역중심: 한 지표/한 연도의 시군구 값을 모든 시도에서 평탄화
// data_by_year[year] = { 시도: { stats, sigungu: {코드:값} } }
export function flattenSigungu(yearBlock) {
  const flat = {};
  if (!yearBlock) return flat;
  for (const sido of Object.keys(yearBlock)) {
    const sg = yearBlock[sido]?.sigungu || {};
    for (const [code, val] of Object.entries(sg)) flat[code] = val;
  }
  return flat;
}

// 지역맞춤: custom 데이터는 5자리(시군구)+2자리(시도) 혼재. 일부 지표는 시도 단위만 존재.
// 선택 시군구(curSgg, 5자리)의 대표값: 시군구값 우선, 없으면 시도 집계(앞 2자리) 사용
export function getCustomTarget(rawByCode, curSgg) {
  if (!rawByCode || !curSgg) return null;
  if (rawByCode[curSgg] != null) return rawByCode[curSgg];
  const sidoCode = String(curSgg).slice(0, 2);
  if (rawByCode[sidoCode] != null) return rawByCode[sidoCode];
  return null;
}

// 지역맞춤: 비교통계. 시군구값이 있으면 시군구 기준, 없으면 시도 집계 기준으로 폴백
export function getCustomStats(rawByCode, areas, cmpMode, curSido, curSgg) {
  if (!rawByCode) return null;
  // 시군구 레벨(5자리) 데이터 보유 여부
  const hasSigungu = Object.keys(rawByCode).some((k) => k.length === 5);
  if (hasSigungu) {
    return getCmpStats(rawByCode, areas, cmpMode, curSido, curSgg);
  }
  // 시도 단위만 존재 → 전국 시도 집계 분포로 비교 (유형/광역 구분 불가)
  const sidoVals = Object.entries(rawByCode)
    .filter(([k]) => k.length === 2)
    .map(([, v]) => v);
  return calcStats(sidoVals);
}
