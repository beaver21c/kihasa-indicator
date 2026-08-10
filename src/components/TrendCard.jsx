import TrendChart from './TrendChart';

// 그리드 미니 추이 카드 (클릭 시 확대)
export default function TrendCard({
  indicator,
  trend,
  mode,
  chartType,
  showRefLine,
  showValues,
  valueFontSize,
  onExpand,
}) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="text-left bg-white rounded-md border border-slate-200 p-2.5 hover:border-[#1a4f8a] hover:shadow-sm transition group w-full"
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <span className="text-xs font-semibold text-slate-800 leading-snug group-hover:text-[#1a4f8a]">
          {indicator.name}
        </span>
        <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{indicator.unit || '–'}</span>
      </div>
      <TrendChart
        trend={trend}
        mode={mode}
        chartType={chartType}
        unit={indicator.unit}
        showRefLine={showRefLine}
        showValues={showValues}
        valueFontSize={valueFontSize}
        compact
      />
      <div className="text-[10px] text-slate-300 text-right -mt-1 group-hover:text-[#1a4f8a]">확대 ↗</div>
    </button>
  );
}
