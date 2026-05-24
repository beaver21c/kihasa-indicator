import BoxplotChart from './BoxplotChart';

// 숫자 포맷 (소수 자릿수 자동)
function fmt(v) {
  if (v == null || isNaN(v)) return '–';
  const abs = Math.abs(v);
  if (abs >= 1000) return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  if (abs >= 100) return v.toFixed(1);
  return v.toFixed(2);
}

// indicator: {name, unit, sheet/category}
// stats: 비교통계 {min,max,avg,q1,q3,n}, targetVal: 선택지역 값
export default function IndicatorRow({ indicator, stats, targetVal, areaLabel }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-slate-100">
      {/* 좌(3): 지표명 + 단위 + 영역 */}
      <div className="col-span-12 sm:col-span-3">
        <div className="font-semibold text-slate-800 text-sm leading-snug">{indicator.name}</div>
        <div className="text-xs text-slate-400 mt-0.5">
          단위: {indicator.unit || '–'}
          {areaLabel && <span className="ml-1 text-slate-300">· {areaLabel}</span>}
        </div>
      </div>

      {/* 중(2): 선택값(빨강) / 비교평균(파랑) */}
      <div className="col-span-12 sm:col-span-2 text-right">
        <div className="font-bold text-red-700 text-lg leading-none">{fmt(targetVal)}</div>
        <div className="text-slate-500 text-xs mt-1">
          평균 <span className="text-[#1a4f8a] font-medium">{fmt(stats?.avg)}</span>
        </div>
      </div>

      {/* 우(7): 박스플롯 + 분포 요약 */}
      <div className="col-span-12 sm:col-span-7">
        <BoxplotChart stats={stats} targetVal={targetVal} />
        {stats && (
          <div className="flex justify-between text-[11px] text-slate-400 px-1 -mt-1">
            <span>Min {fmt(stats.min)}</span>
            <span>Q1 {fmt(stats.q1)}</span>
            <span>평균 {fmt(stats.avg)}</span>
            <span>Q3 {fmt(stats.q3)}</span>
            <span>Max {fmt(stats.max)}</span>
            <span>N {stats.n}</span>
          </div>
        )}
      </div>
    </div>
  );
}
