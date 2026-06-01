import Plot from '../utils/plot';
import { COLORS, TREND_PALETTE } from '../utils/constants';

// 연도별 추이 차트 (선/막대 + Q1~Q3 음영밴드 + 이중 Y축 자동 스케일)
// props:
//  trend     : buildIndicatorTrend 결과 (주 지표)
//  mode      : 'single' | 'multi'
//  chartType : 'line' | 'bar'
//  unit      : 주 지표 단위
//  compact   : 미니 카드용(범례/축타이틀 축소)
//  showRefLine: 복수 모드 전국평균 점선 표시
//  secondary : { trend, chartType, unit, name } 이중축 겹쳐보기(모달)
export default function TrendChart({
  trend,
  mode,
  chartType = 'line',
  unit,
  compact = false,
  showRefLine = false,
  secondary = null,
}) {
  if (!trend) return null;
  const xs = trend.years.map(String);
  const traces = [];

  const mkSeries = (name, x, y, color, type, { dash, yaxis, opacity } = {}) => {
    if (type === 'bar') {
      return { type: 'bar', name, x, y, yaxis, opacity, marker: { color }, hovertemplate: '%{y:.2f}<extra>' + name + '</extra>' };
    }
    return {
      type: 'scatter', mode: 'lines+markers', name, x, y, yaxis,
      line: { color, width: dash ? 1.8 : 2.5, dash: dash || 'solid' },
      marker: { color, size: compact ? 4 : 7 },
      connectgaps: true,
      hovertemplate: '%{y:.2f}<extra>' + name + '</extra>',
    };
  };

  // 1) 단일 모드 밴드(가장 아래) : Q1 → Q3 음영
  if (mode === 'single' && trend.band) {
    const { q1, q3, avg } = trend.band;
    traces.push({ type: 'scatter', mode: 'lines', x: xs, y: q1, line: { width: 0 }, hoverinfo: 'skip', showlegend: false });
    traces.push({
      type: 'scatter', mode: 'lines', x: xs, y: q3, fill: 'tonexty',
      fillcolor: 'rgba(168,197,255,0.40)', line: { width: 0 }, hoverinfo: 'skip',
      name: 'Q1~Q3', showlegend: !compact,
    });
    traces.push(mkSeries('비교평균', xs, avg, COLORS.avg, 'line', { dash: 'dot' }));
  }

  // 2) 지역 시계열
  const regColor = (i) => (mode === 'single' ? COLORS.target : TREND_PALETTE[i % TREND_PALETTE.length]);
  trend.regionSeries.forEach((s, i) => {
    traces.push(mkSeries(s.name, xs, s.values, regColor(i), chartType));
  });

  // 3) 복수 모드 전국평균 기준선
  if (mode === 'multi' && showRefLine && trend.nationalAvg) {
    traces.push(mkSeries('전국 평균', xs, trend.nationalAvg, '#94a3b8', 'line', { dash: 'dot' }));
  }

  // 4) 이중축 겹쳐보기(보조 지표) — 보조 Y축도 autorange로 독립 가변
  if (secondary?.trend) {
    const sx = secondary.trend.years.map(String);
    secondary.trend.regionSeries.forEach((s, i) => {
      const c = regColor(i);
      traces.push(mkSeries(`${secondary.name} · ${s.name}`, sx, s.values, c, secondary.chartType, { yaxis: 'y2', opacity: 0.55 }));
    });
  }

  const layout = {
    height: compact ? 168 : 430,
    margin: compact ? { l: 42, r: 10, t: 6, b: 26 } : { l: 56, r: secondary ? 56 : 18, t: 28, b: 44 },
    showlegend: !compact,
    legend: { orientation: 'h', y: -0.16, x: 0, font: { size: 11 } },
    paper_bgcolor: 'white',
    plot_bgcolor: 'white',
    font: { family: 'Noto Sans KR, sans-serif', size: compact ? 10 : 12, color: COLORS.caption },
    barmode: 'group',
    bargap: 0.25,
    hovermode: 'x unified',
    xaxis: { type: 'category', showgrid: false, tickfont: { size: compact ? 10 : 11 } },
    yaxis: {
      title: compact ? '' : (unit || ''),
      autorange: true,
      zeroline: false,
      gridcolor: '#eef2f7',
      tickfont: { size: compact ? 10 : 11 },
    },
  };
  if (secondary?.trend) {
    layout.yaxis2 = {
      title: secondary.unit || '',
      overlaying: 'y',
      side: 'right',
      autorange: true,
      showgrid: false,
      zeroline: false,
      tickfont: { size: 11 },
    };
  }

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{ displayModeBar: false, responsive: true }}
      style={{ width: '100%', height: `${layout.height}px` }}
      useResizeHandler
    />
  );
}
