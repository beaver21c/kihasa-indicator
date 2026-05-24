import Plot from '../utils/plot';
import { COLORS } from '../utils/constants';

// stats: {min,max,q1,q3,avg,n}, targetVal: 선택지역 값(없으면 미표시)
export default function BoxplotChart({ stats, targetVal }) {
  if (!stats) return <div className="text-slate-400 text-xs py-3">데이터 없음</div>;

  const { min, max, q1, q3, avg } = stats;
  const span = max - min;
  const pad = span * 0.08 || Math.abs(max) * 0.08 || 1;

  const data = [
    {
      x: [avg],
      y: [0],
      mode: 'markers',
      marker: { color: COLORS.avg, size: 13, line: { color: '#fff', width: 1.5 } },
      name: '비교평균',
      hovertemplate: `평균 %{x:.2f}<extra></extra>`,
    },
  ];
  if (targetVal != null && !isNaN(targetVal)) {
    data.push({
      x: [targetVal],
      y: [0],
      mode: 'markers',
      marker: { color: COLORS.target, size: 14, symbol: 'diamond', line: { color: '#fff', width: 1.5 } },
      name: '선택지역',
      hovertemplate: `선택지역 %{x:.2f}<extra></extra>`,
    });
  }

  const layout = {
    height: 78,
    margin: { l: 8, r: 8, t: 6, b: 22 },
    showlegend: false,
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    font: { family: 'Noto Sans KR, sans-serif', size: 10, color: COLORS.caption },
    xaxis: {
      range: [min - pad, max + pad],
      showgrid: false,
      zeroline: false,
      tickfont: { size: 10, color: COLORS.caption },
    },
    yaxis: { visible: false, range: [-1, 1], fixedrange: true },
    shapes: [
      // 위스커 (Min~Max)
      { type: 'line', x0: min, x1: max, y0: 0, y1: 0, line: { color: COLORS.whisker, width: 2 } },
      { type: 'line', x0: min, x1: min, y0: -0.18, y1: 0.18, line: { color: COLORS.whisker, width: 2 } },
      { type: 'line', x0: max, x1: max, y0: -0.18, y1: 0.18, line: { color: COLORS.whisker, width: 2 } },
      // IQR 박스 (Q1~Q3)
      { type: 'rect', x0: q1, x1: q3, y0: -0.28, y1: 0.28, fillcolor: COLORS.iqr, line: { width: 0 }, layer: 'below' },
    ],
  };

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: false, responsive: true, staticPlot: false }}
      style={{ width: '100%', height: '78px' }}
      useResizeHandler
    />
  );
}
