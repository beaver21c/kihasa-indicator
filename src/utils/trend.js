// 연도별 추이 시계열 빌더 (지역중심 19개 지표 / data_by_year 기반)
// 기존 stats.js 유틸을 연도별로 반복 호출하여 시계열을 구성한다 (신규 데이터 빌드 불필요).
import { flattenSigungu, getCmpStats } from './stats';

const num = (v) => (v == null || isNaN(v) ? null : Number(v));

// indicator: {name, unit, data_by_year}
// opts: { years:[..], mode:'single'|'multi', regionCodes:[..], areas, cmpMode, cmpSido, cmpSgg }
// 반환: { years, regionSeries:[{code,name,values}], band:{avg,q1,q3}|null, nationalAvg:[..]|null }
export function buildIndicatorTrend(indicator, opts) {
  const { years, mode, regionCodes, areas, cmpMode, cmpSido, cmpSgg } = opts;
  const flatByYear = {};
  for (const y of years) flatByYear[y] = flattenSigungu(indicator.data_by_year?.[y]);

  const regionSeries = regionCodes.map((code) => ({
    code,
    name: areas[code]?.sigungu || code,
    values: years.map((y) => num(flatByYear[y][code])),
  }));

  let band = null;
  let nationalAvg = null;

  if (mode === 'single' && cmpSgg) {
    // 비교집단(광역/유형/전국)의 연도별 평균·사분위 → 추이 음영밴드
    const avg = [], q1 = [], q3 = [];
    for (const y of years) {
      const st = getCmpStats(flatByYear[y], areas, cmpMode, cmpSido, cmpSgg);
      avg.push(st?.avg ?? null);
      q1.push(st?.q1 ?? null);
      q3.push(st?.q3 ?? null);
    }
    band = { avg, q1, q3 };
  } else if (mode === 'multi') {
    // 복수 지역 비교 시 전국 평균을 점선 기준선으로(선택 표시)
    nationalAvg = years.map((y) => getCmpStats(flatByYear[y], areas, 'national')?.avg ?? null);
  }

  return { years, regionSeries, band, nationalAvg };
}

// 추이 페이지에서 사용할 가용 연도: 모든 지표 공통 연도 중 2018년 이상
export function trendYears(indicators) {
  if (!indicators?.length) return [];
  const sets = indicators.map((i) => new Set((i.years || []).map(String)));
  const common = [...sets[0]].filter((y) => sets.every((s) => s.has(y)) && Number(y) >= 2018);
  return common.sort();
}
