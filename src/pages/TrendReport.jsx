import { useEffect, useMemo, useRef, useState } from 'react';
import { loadRegion } from '../utils/dataLoader';
import { buildIndicatorTrend, trendYears } from '../utils/trend';
import { CAT_ORDER, CMP_OPTIONS, TREND_MODES, TREND_PALETTE, BRAND, COLORS } from '../utils/constants';
import Sidebar from '../components/Sidebar';
import RegionSelector from '../components/RegionSelector';
import MultiRegionSelector from '../components/MultiRegionSelector';
import TrendCard from '../components/TrendCard';
import TrendModal from '../components/TrendModal';
import FontStepper from '../components/FontStepper';
import { saveReportPng } from '../utils/png';

export default function TrendReport() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [state, setState] = useState({
    mode: 'single',
    sido: '', sgg: '', cmpMode: 'sido',
    regions: [], showRefLine: true,
    yearFrom: '', yearTo: '', chartType: 'line',
    showValues: false, valueFs: 9,
  });
  const [expanded, setExpanded] = useState(null); // 확대할 indicator
  const [saving, setSaving] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    loadRegion()
      .then((d) => {
        setData(d);
        const firstSido = d.sido_list[0];
        const firstSgg = Object.entries(d.areas)
          .filter(([, a]) => a.sido === firstSido)
          .sort((a, b) => a[1].sigungu.localeCompare(b[1].sigungu, 'ko'))[0];
        const ys = trendYears(d.indicators);
        const code = firstSgg ? firstSgg[0] : '';
        setState((s) => ({
          ...s,
          sido: firstSido, sgg: code, regions: code ? [code] : [],
          yearFrom: ys[0], yearTo: ys[ys.length - 1],
        }));
      })
      .catch((e) => setErr(e.message));
  }, []);

  const allYears = useMemo(() => (data ? trendYears(data.indicators) : []), [data]);
  const years = useMemo(
    () => allYears.filter((y) => y >= state.yearFrom && y <= state.yearTo),
    [allYears, state.yearFrom, state.yearTo]
  );

  const grouped = useMemo(() => {
    if (!data) return [];
    const byCat = {};
    for (const ind of data.indicators) (byCat[ind.category] ||= []).push(ind);
    return CAT_ORDER.filter((c) => byCat[c]).map((c) => ({ cat: c, items: byCat[c] }));
  }, [data]);

  // 현재 설정으로 한 지표의 시계열을 만드는 클로저
  const buildTrend = useMemo(() => {
    if (!data || !years.length) return () => null;
    const { mode, sgg, cmpMode, regions } = state;
    const regionCodes = mode === 'single' ? (sgg ? [sgg] : []) : regions;
    const cmpSido = data.areas[sgg]?.sido;
    return (indicator) =>
      buildIndicatorTrend(indicator, {
        years, mode, regionCodes, areas: data.areas, cmpMode, cmpSido, cmpSgg: sgg,
      });
  }, [data, years, state]);

  if (err) return <div className="text-red-600">데이터 로드 오류: {err}</div>;
  if (!data || !state.sido) return <div className="text-slate-500">데이터 로딩 중…</div>;

  const { areas } = data;
  const hasRegions = state.mode === 'single' ? !!state.sgg : state.regions.length > 0;
  const cmpLabel = CMP_OPTIONS.find(([k]) => k === state.cmpMode)?.[1] || '';

  const onSave = async () => {
    setSaving(true);
    try {
      const tag = state.mode === 'single' ? areas[state.sgg]?.sigungu : `${state.regions.length}개지역`;
      await saveReportPng(reportRef.current, `연도별추이_${tag}_${state.yearFrom}-${state.yearTo}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-0 max-w-[1400px] mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Sidebar title="연도별 추이 설정">
        {/* 비교 모드 */}
        <div>
          <label className="text-xs font-bold text-slate-600">🔀 비교 모드</label>
          <div className="flex gap-1 mt-1">
            {TREND_MODES.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setState({ ...state, mode: k })}
                className={`flex-1 px-2 py-1.5 rounded-md text-[11px] font-semibold border ${
                  state.mode === k ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]' : 'bg-white text-slate-600 border-slate-300'
                }`}
              >{l}</button>
            ))}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          {state.mode === 'single'
            ? <RegionSelector data={data} state={state} setState={setState} />
            : <MultiRegionSelector data={data} state={state} setState={setState} />}
        </div>

        {/* 연도 범위 */}
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-slate-600">📅 시작</label>
            <select
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
              value={state.yearFrom}
              onChange={(e) => setState({ ...state, yearFrom: e.target.value })}
            >
              {allYears.filter((y) => y <= state.yearTo).map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">종료</label>
            <select
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
              value={state.yearTo}
              onChange={(e) => setState({ ...state, yearTo: e.target.value })}
            >
              {allYears.filter((y) => y >= state.yearFrom).map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
        </div>

        {/* 차트 타입 */}
        <div className="mt-3">
          <label className="text-xs font-bold text-slate-600">📈 기본 표시</label>
          <div className="flex gap-1 mt-1">
            {[['line', '꺾은선'], ['bar', '막대']].map(([k, l]) => (
              <button
                key={k}
                onClick={() => setState({ ...state, chartType: k })}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold border ${
                  state.chartType === k ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]' : 'bg-white text-slate-600 border-slate-300'
                }`}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* 그래프 값 표시 */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <label className="flex items-center text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={state.showValues}
              onChange={(e) => setState({ ...state, showValues: e.target.checked })}
              className="mr-2 accent-[#1a4f8a]"
            />
            그래프 값 표시
          </label>
          {state.showValues && (
            <div className="mt-1.5">
              <FontStepper
                value={state.valueFs}
                onChange={(v) => setState({ ...state, valueFs: v })}
                caption="값 글자"
              />
            </div>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={saving || !hasRegions}
          className="w-full mt-5 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: BRAND }}
        >
          {saving ? '저장 중…' : '🖼 PNG 저장'}
        </button>
      </Sidebar>

      {/* 메인 */}
      <div className="flex-1 p-4 min-w-0" ref={reportRef}>
        <div className="rounded-md px-4 py-3 text-white mb-3" style={{ backgroundColor: BRAND }}>
          <div className="text-lg font-bold">
            연도별 추이 비교
            <span className="text-sm font-normal text-blue-100 ml-2">· {state.yearFrom}~{state.yearTo}년</span>
          </div>
          <div className="text-xs text-blue-100 mt-1 flex flex-wrap gap-2 items-center">
            <span className="px-2 py-0.5 rounded-full bg-white/15">
              {state.mode === 'single' ? '단일 vs 비교집단' : `복수 지역 ${state.regions.length}곳`}
            </span>
            {state.mode === 'single' && <span className="px-2 py-0.5 rounded-full bg-white/15">{cmpLabel}</span>}
          </div>
        </div>

        {/* 추이 범례 */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center py-2 px-1 mb-1">
          {state.mode === 'single' ? (
            <>
              <Token color={COLORS.target} label={areas[state.sgg]?.sigungu || '선택지역'} shape="line" />
              <Token color={COLORS.avg} label="비교평균" shape="dot-line" />
              <Token color="rgba(168,197,255,0.7)" label="Q1~Q3 밴드" shape="box" />
            </>
          ) : (
            state.regions.map((c, i) => (
              <Token key={c} color={TREND_PALETTE[i % TREND_PALETTE.length]} label={areas[c]?.sigungu || c} shape="line" />
            ))
          )}
        </div>

        {!hasRegions ? (
          <div className="text-center text-slate-400 py-16 text-sm">
            {state.mode === 'single' ? '좌측에서 지역을 선택.' : '좌측에서 비교할 지역을 1곳 이상 추가.'}
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat} className="mb-4">
              <h3 className="text-sm font-bold text-[#1a4f8a] bg-slate-50 px-3 py-1.5 rounded-md mb-2">{cat}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {items.map((ind) => (
                  <TrendCard
                    key={ind.name}
                    indicator={ind}
                    trend={buildTrend(ind)}
                    mode={state.mode}
                    chartType={state.chartType}
                    showRefLine={state.showRefLine}
                    showValues={state.showValues}
                    valueFontSize={state.valueFs}
                    onExpand={() => setExpanded(ind)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {expanded && (
        <TrendModal
          indicator={expanded}
          indicators={data.indicators}
          buildTrend={buildTrend}
          mode={state.mode}
          defaultChartType={state.chartType}
          showValues={state.showValues}
          valueFontSize={state.valueFs}
          onClose={() => setExpanded(null)}
        />
      )}
    </div>
  );
}

function Token({ color, label, shape }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      {shape === 'line' && <span className="inline-block w-5 h-0.5" style={{ background: color }} />}
      {shape === 'dot-line' && <span className="inline-block w-5 h-0.5 border-b-2 border-dotted" style={{ borderColor: color }} />}
      {shape === 'box' && <span className="inline-block w-5 h-3 rounded-sm" style={{ background: color }} />}
      {label}
    </span>
  );
}
