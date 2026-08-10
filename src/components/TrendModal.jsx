import { useState } from 'react';
import TrendChart from './TrendChart';
import { COLORS, TREND_PALETTE } from '../utils/constants';

function fmt(v) {
  if (v == null || isNaN(v)) return '–';
  const abs = Math.abs(v);
  if (abs >= 1000) return v.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  if (abs >= 100) return v.toFixed(1);
  return v.toFixed(2);
}

// 확대 모달: 큰 차트 + 선/막대 토글 + 두 번째 지표 겹쳐보기(보조축) + 연도별 수치표
// props: indicator, indicators(전체), buildTrend(ind)=>trend, mode, defaultChartType, onClose
export default function TrendModal({
  indicator,
  indicators,
  buildTrend,
  mode,
  defaultChartType,
  showValues,
  valueFontSize,
  onClose,
}) {
  const [chartType, setChartType] = useState(defaultChartType);
  const [secName, setSecName] = useState('');
  const [secType, setSecType] = useState('bar');

  const trend = buildTrend(indicator);
  const secInd = indicators.find((i) => i.name === secName && i.name !== indicator.name);
  const secTrend = secInd ? buildTrend(secInd) : null;
  const secondary = secTrend ? { trend: secTrend, chartType: secType, unit: secInd.unit, name: secInd.name } : null;

  const regColor = (i) => (mode === 'single' ? COLORS.target : TREND_PALETTE[i % TREND_PALETTE.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between px-5 py-3 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <div className="text-base font-bold text-slate-800">{indicator.name}</div>
            <div className="text-xs text-slate-400">단위: {indicator.unit || '–'} · {indicator.category}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none" aria-label="닫기">×</button>
        </div>

        {/* 컨트롤 */}
        <div className="px-5 pt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">표시</span>
            {[['line', '꺾은선'], ['bar', '막대']].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setChartType(k)}
                className={`px-2.5 py-1 rounded-md border ${chartType === k ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]' : 'bg-white text-slate-600 border-slate-300'}`}
              >{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500">겹쳐보기(보조축)</span>
            <select
              value={secName}
              onChange={(e) => setSecName(e.target.value)}
              className="p-1 border border-slate-300 rounded-md bg-white max-w-[180px]"
            >
              <option value="">없음</option>
              {indicators.filter((i) => i.name !== indicator.name).map((i) => (
                <option key={i.name} value={i.name}>{i.name}</option>
              ))}
            </select>
            {secName && (
              <select
                value={secType}
                onChange={(e) => setSecType(e.target.value)}
                className="p-1 border border-slate-300 rounded-md bg-white"
              >
                <option value="bar">막대</option>
                <option value="line">꺾은선</option>
              </select>
            )}
          </div>
        </div>

        {/* 차트 */}
        <div className="px-3">
          <TrendChart
            trend={trend}
            mode={mode}
            chartType={chartType}
            unit={indicator.unit}
            secondary={secondary}
            showValues={showValues}
            valueFontSize={valueFontSize}
          />
        </div>

        {/* 연도별 수치표 */}
        <div className="px-5 pb-5">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left py-1.5 pr-2 font-semibold">연도</th>
                  {trend.regionSeries.map((s, i) => (
                    <th key={s.code} className="text-right py-1.5 px-2 font-semibold" style={{ color: regColor(i) }}>{s.name}</th>
                  ))}
                  {mode === 'single' && trend.band && (
                    <th className="text-right py-1.5 px-2 font-semibold" style={{ color: COLORS.avg }}>비교평균</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {trend.years.map((y, yi) => (
                  <tr key={y} className="border-b border-slate-50">
                    <td className="py-1.5 pr-2 text-slate-600">{y}년</td>
                    {trend.regionSeries.map((s) => (
                      <td key={s.code} className="text-right py-1.5 px-2 text-slate-700">{fmt(s.values[yi])}</td>
                    ))}
                    {mode === 'single' && trend.band && (
                      <td className="text-right py-1.5 px-2 text-[#1a4f8a]">{fmt(trend.band.avg[yi])}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
