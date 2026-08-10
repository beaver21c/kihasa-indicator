import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadCustom, loadSigunguGeo } from '../utils/dataLoader';
import { calcStats, getGroupCodes } from '../utils/stats';
import { fmt } from '../utils/format';
import {
  FACTORS,
  commonYears,
  computeDef,
  defKeys,
  defToParams,
  digitWarning,
  emptyDef,
  formulaText,
  latestYearWithData,
  paramsToDef,
  summarize,
} from '../utils/builder';
import { BRAND, CMP_OPTIONS, COLORS } from '../utils/constants';
import Sidebar from '../components/Sidebar';
import RegionSelector from '../components/RegionSelector';
import TrendChart from '../components/TrendChart';
import ChoroplethMap from '../components/ChoroplethMap';
import MapOptionsPanel, { DEFAULT_MAP_OPTS } from '../components/MapOptionsPanel';
import FontStepper from '../components/FontStepper';
import NlqPanel from '../components/NlqPanel';
import { saveReportPng } from '../utils/png';

const UNOFFICIAL = '이용자 정의(비공식)';

export default function IndicatorBuilder() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [geo, setGeo] = useState(null);
  const [err, setErr] = useState(null);
  const [def, setDef] = useState(() => {
    const d = paramsToDef(params);
    return d.num.length ? d : emptyDef();
  });
  const [desc, setDesc] = useState('');
  const [state, setState] = useState({ sido: '', sgg: '', cmpMode: 'sido', sheet: '전체', query: '' });
  const [opts, setOpts] = useState(DEFAULT_MAP_OPTS);
  const [showValues, setShowValues] = useState(false);
  const [trendFs, setTrendFs] = useState(9);
  const [chartType, setChartType] = useState('line');
  const [mapYear, setMapYear] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    Promise.all([loadCustom(), loadSigunguGeo()])
      .then(([d, g]) => {
        setData(d);
        setGeo(g);
        const firstSido = d.sido_list[0];
        const firstSgg = Object.entries(d.areas)
          .filter(([, a]) => a.sido === firstSido)
          .sort((a, b) => a[1].sigungu.localeCompare(b[1].sigungu, 'ko'))[0];
        setState((s) => ({ ...s, sido: firstSido, sgg: firstSgg ? firstSgg[0] : '' }));
      })
      .catch((e) => setErr(e.message));
  }, []);

  const indByKey = useMemo(
    () => (data ? Object.fromEntries(data.indicators.map((i) => [i.key, i])) : {}),
    [data]
  );

  const sheets = useMemo(
    () => (data ? [...new Set(data.indicators.map((i) => i.sheet))] : []),
    [data]
  );

  // 이미 배치된 항목과 공통 연도가 없는 항목은 목록에서 비활성화
  const picked = defKeys(def);

  const listed = useMemo(() => {
    if (!data) return [];
    const q = state.query.trim();
    return data.indicators
      .filter((i) => (state.sheet === '전체' || i.sheet === state.sheet) && (!q || i.name.includes(q)))
      .map((i) => {
        const used = picked.includes(i.key);
        const ok =
          !picked.length ||
          used ||
          commonYears(indByKey, [...picked, i.key]).length > 0;
        return { ...i, used, ok };
      });
  }, [data, state.sheet, state.query, picked.join('~'), indByKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    if (!data || !def.num.length) return null;
    return computeDef(data, def);
  }, [data, def]);

  const summary = useMemo(() => (result ? summarize(result) : null), [result]);
  const warn = useMemo(() => digitWarning(summary), [summary]);

  // 지도 연도 기본값 — 시·군·구 값이 실제로 산출된 가장 최근 연도
  useEffect(() => {
    if (!result?.years?.length) return;
    const usable = result.years.filter((y) => Object.keys(result.byYear[y] || {}).length);
    setMapYear((y) => (usable.includes(y) ? y : latestYearWithData(result) || result.years[result.years.length - 1]));
  }, [result]);

  const groupCodes = useMemo(() => {
    if (!data) return [];
    return getGroupCodes(data.areas, state.cmpMode, state.sido, state.sgg) || Object.keys(data.areas);
  }, [data, state.cmpMode, state.sido, state.sgg]);

  // 연도별 추이 (선택 지역 실선 + 비교집단 Q1~Q3 밴드)
  const trend = useMemo(() => {
    if (!result || !data || !state.sgg) return null;
    const years = result.years;
    const grp = new Set(groupCodes);
    const avg = [];
    const q1 = [];
    const q3 = [];
    for (const y of years) {
      const m = result.byYear[y] || {};
      const st = calcStats(Object.entries(m).filter(([c]) => grp.has(c)).map(([, v]) => v));
      avg.push(st?.avg ?? null);
      q1.push(st?.q1 ?? null);
      q3.push(st?.q3 ?? null);
    }
    return {
      years,
      regionSeries: [
        {
          code: state.sgg,
          name: data.areas[state.sgg]?.sigungu || state.sgg,
          values: years.map((y) => result.byYear[y]?.[state.sgg] ?? null),
        },
      ],
      band: { avg, q1, q3 },
      nationalAvg: null,
    };
  }, [result, data, state.sgg, groupCodes]);

  // 단계구분도용 행
  const rows = useMemo(() => {
    if (!data || !result || !mapYear) return [];
    const m = result.byYear[mapYear] || {};
    return Object.entries(data.areas).map(([code, a]) => ({
      code,
      name: `${a.sido} ${a.sigungu}`,
      short: a.sigungu,
      sido: a.sido,
      v: Number.isFinite(m[code]) ? m[code] : null,
    }));
  }, [data, result, mapYear]);

  const viewCodes = useMemo(() => {
    if (!rows.length) return [];
    if (opts.view === 'nation') return rows.map((r) => r.code);
    const mySido = data?.areas[state.sgg]?.sido;
    const inSido = rows.filter((r) => r.sido === mySido).map((r) => r.code);
    return inSido.length ? inSido : rows.map((r) => r.code);
  }, [rows, opts.view, data, state.sgg]);

  if (err) return <div className="text-red-600">데이터 로드 오류: {err}</div>;
  if (!data || !geo || !state.sido) return <div className="text-slate-500">데이터 로딩 중…</div>;

  const addNum = (key) => setDef((d) => (d.num.includes(key) ? d : { ...d, num: [...d.num, key] }));
  const setDen = (key) => setDef((d) => ({ ...d, den: d.den === key ? '' : key }));
  const removeNum = (key) => setDef((d) => ({ ...d, num: d.num.filter((k) => k !== key) }));
  const reset = () => {
    setDef(emptyDef());
    setDesc('');
    setParams({});
  };

  const onCopyLink = async () => {
    const p = defToParams(def);
    const url = `${window.location.origin}${window.location.pathname}?${p.toString()}${window.location.hash || ''}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('아래 주소를 복사하시오:', url);
    }
    setParams(p);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveReportPng(
        reportRef.current,
        `신규지표_${def.name || '이용자정의'}.png`.replace(/[\\/:*?"<>|]/g, '_')
      );
    } finally {
      setSaving(false);
    }
  };

  const formula = formulaText(indByKey, def);
  const cmpLabel = CMP_OPTIONS.find(([k]) => k === state.cmpMode)?.[1] || '';
  const title = def.name?.trim() || '(가칭 미입력) 이용자 정의 지표';

  return (
    <div className="flex gap-0 max-w-[1400px] mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Sidebar title="지표 만들기 설정">
        <RegionSelector data={data} state={state} setState={setState} />

        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div>
            <label className="text-xs font-bold text-slate-600">📁 영역(시트)</label>
            <select
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
              value={state.sheet}
              onChange={(e) => setState({ ...state, sheet: e.target.value })}
            >
              <option value="전체">전체</option>
              {sheets.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">🔍 데이터 검색</label>
            <input
              type="text"
              value={state.query}
              onChange={(e) => setState({ ...state, query: e.target.value })}
              placeholder="예: 노인, 인구, 시설"
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* 데이터 목록 — 분자/분모로 배치 */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600">데이터 목록</span>
            <span className="text-[11px] text-slate-400">{listed.length}개</span>
          </div>
          <div className="max-h-72 overflow-y-auto scroll-thin border border-slate-100 rounded-md">
            {listed.map((i) => (
              <div
                key={i.key}
                draggable={i.ok}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', i.key)}
                className={`flex items-start gap-1 px-2 py-1.5 text-xs border-b border-slate-50 ${
                  !i.ok ? 'opacity-35' : i.used ? 'bg-[#e8f0fb]' : 'hover:bg-slate-50'
                }`}
                title={i.ok ? `${i.name} (단위 ${i.unit || '-'})` : '이미 배치한 항목과 공통 연도가 없다'}
              >
                <span className="flex-1 min-w-0">
                  <span className="text-slate-700">{i.name}</span>
                  <span className="text-slate-400 ml-1">
                    [{i.sheet}
                    {i.unit ? ` · ${i.unit}` : ''}]
                  </span>
                </span>
                <span className="flex gap-0.5 shrink-0">
                  <button
                    onClick={() => addNum(i.key)}
                    disabled={!i.ok || def.num.includes(i.key)}
                    className="px-1.5 py-0.5 rounded border border-slate-300 text-[10px] disabled:opacity-30 hover:bg-white"
                    title="분자로 추가"
                  >
                    분자
                  </button>
                  <button
                    onClick={() => setDen(i.key)}
                    disabled={!i.ok}
                    className={`px-1.5 py-0.5 rounded border text-[10px] disabled:opacity-30 ${
                      def.den === i.key ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]' : 'border-slate-300 hover:bg-white'
                    }`}
                    title="분모로 지정"
                  >
                    분모
                  </button>
                </span>
              </div>
            ))}
            {listed.length === 0 && <div className="text-xs text-slate-400 p-3">조건에 맞는 데이터가 없다.</div>}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <MapOptionsPanel opts={opts} setOpts={setOpts} />
        </div>

        <button
          onClick={onSave}
          disabled={saving || !result?.years?.length}
          className="w-full mt-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: BRAND }}
        >
          {saving ? '저장 중…' : '🖼 PNG 저장'}
        </button>
      </Sidebar>

      <div className="flex-1 p-4 min-w-0">
        <NlqPanel
          indicators={data.indicators}
          onApply={(d, description) => {
            setDef(d);
            setDesc(description || '');
          }}
        />

        {/* 산식 구성 슬롯 */}
        <section className="mt-3 border border-slate-200 rounded-lg p-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <input
              value={def.name}
              onChange={(e) => setDef({ ...def, name: e.target.value })}
              placeholder="지표 가칭 (예: 노인 천 명당 노인복지시설 수)"
              className="flex-1 min-w-[200px] p-2 border border-slate-300 rounded-md text-sm"
            />
            <select
              value={def.factor}
              onChange={(e) => setDef({ ...def, factor: Number(e.target.value) })}
              className="p-2 border border-slate-300 rounded-md text-sm bg-white"
              title="단위조정 계수"
            >
              {FACTORS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <button
              onClick={onCopyLink}
              disabled={!def.num.length}
              className="px-3 py-2 text-xs rounded-md border border-brand-500 text-brand-700 hover:bg-brand-50 disabled:opacity-40"
            >
              {copied ? '✓ 복사됨' : '🔗 링크 복사'}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              ↺ 초기화
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Slot
              title="분자 (복수 합산 가능)"
              onDrop={(k) => addNum(k)}
              empty="여기로 항목을 끌어놓거나 좌측 [분자] 버튼을 누를 것"
            >
              {def.num.map((k) => (
                <Chip key={k} label={indByKey[k]?.name || k} onRemove={() => removeNum(k)} />
              ))}
            </Slot>
            <Slot
              title="분모 (1개, 선택)"
              onDrop={(k) => setDef((d) => ({ ...d, den: k }))}
              empty="비워두면 분자 합산값이 그대로 지표가 된다"
            >
              {def.den && (
                <Chip label={indByKey[def.den]?.name || def.den} onRemove={() => setDef({ ...def, den: '' })} />
              )}
            </Slot>
          </div>

          {/* 실시간 요약 */}
          <div className="mt-2 text-[11px] text-slate-600 leading-relaxed">
            <div>
              <b className="text-slate-700">산식</b> {def.num.length ? formula : '— 항목을 배치할 것'}
            </div>
            {result && (
              <div>
                <b className="text-slate-700">공통 가용 연도</b>{' '}
                {result.years.length ? `${result.years[0]}~${result.years[result.years.length - 1]} (${result.years.length}개)` : '없음'}
                {summary && summary.n > 0 && (
                  <>
                    {' · '}
                    <b className="text-slate-700">{summary.year}년</b> 평균 {fmt(summary.avg)} · 중앙값{' '}
                    {fmt(summary.median)} · 범위 {fmt(summary.min)}~{fmt(summary.max)} · 유효 {summary.n}개
                    {summary.missing ? ` · 데이터 없음 ${summary.missing}` : ''}
                    {summary.zeroDen ? ` · 분모 0 ${summary.zeroDen}` : ''}
                  </>
                )}
              </div>
            )}
            {desc && <div className="text-slate-500">설명 {desc}</div>}
          </div>

          {warn && (
            <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
              ⚠ {warn.message} (진행은 가능)
            </div>
          )}
          {result && result.years.length === 0 && (
            <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-[11px] text-red-700">
              선택한 항목들의 공통 가용 연도가 없다. 항목 조합을 바꿀 것.
            </div>
          )}
        </section>

        {/* 산출물 */}
        {result && result.years.length > 0 && (
          <div ref={reportRef} className="mt-3">
            <div className="rounded-md px-4 py-3 text-white" style={{ backgroundColor: BRAND }}>
              <div className="text-lg font-bold">
                {title}
                <span className="ml-2 text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/20">
                  {UNOFFICIAL}
                </span>
              </div>
              <div className="text-xs text-blue-100 mt-1">산식: {formula}</div>
              <div className="text-xs text-blue-100 mt-0.5 flex flex-wrap gap-2 items-center">
                <span className="px-2 py-0.5 rounded-full bg-white/15">
                  ◆ {data.areas[state.sgg]?.sido} {data.areas[state.sgg]?.sigungu}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/15">{cmpLabel}</span>
              </div>
            </div>

            {/* 연도별 추이 */}
            <section className="mt-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-[#1a4f8a]">연도별 추이</h3>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[
                      ['line', '꺾은선'],
                      ['bar', '막대'],
                    ].map(([k, l]) => (
                      <button
                        key={k}
                        onClick={() => setChartType(k)}
                        className={`px-2 py-1 rounded-md text-[11px] border ${
                          chartType === k
                            ? 'bg-[#1a4f8a] text-white border-[#1a4f8a]'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showValues}
                      onChange={(e) => setShowValues(e.target.checked)}
                      className="accent-[#1a4f8a]"
                    />
                    그래프 값 표시
                  </label>
                  {showValues && <FontStepper value={trendFs} onChange={setTrendFs} caption="값 글자" />}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-slate-600 mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-5 h-0.5" style={{ background: COLORS.target }} />
                  {data.areas[state.sgg]?.sigungu}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-5 h-0.5 border-b-2 border-dotted"
                    style={{ borderColor: COLORS.avg }}
                  />
                  비교평균
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block w-5 h-3 rounded-sm" style={{ background: 'rgba(168,197,255,0.7)' }} />
                  Q1~Q3 밴드
                </span>
              </div>
              <TrendChart
                trend={trend}
                mode="single"
                chartType={chartType}
                unit=""
                showValues={showValues}
                valueFontSize={trendFs}
              />
            </section>

            {/* 단계구분도 */}
            <section className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-[#1a4f8a]">지역 비교 (단계구분도)</h3>
                <select
                  value={mapYear}
                  onChange={(e) => setMapYear(e.target.value)}
                  className="p-1 border border-slate-300 rounded-md text-xs bg-white"
                >
                  {result.years
                    .filter((y) => Object.keys(result.byYear[y] || {}).length)
                    .map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                </select>
              </div>
              <ChoroplethMap
                geo={geo}
                rows={rows}
                viewCodes={viewCodes}
                groupCodes={groupCodes}
                selected={state.sgg}
                unit=""
                {...opts}
                height={520}
              />
            </section>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              ※ {UNOFFICIAL} 지표. 산식: {formula}. 공식 통계가 아니므로 인용 시 산식·출처를 반드시 병기할 것.
              모든 평균은 시·군·구 단순평균(unweighted)이며, 해당 연도 결측 지역은 분모에서 제외된다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Slot({ title, children, onDrop, empty }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const k = e.dataTransfer.getData('text/plain');
        if (k) onDrop(k);
      }}
      className={`rounded-md border-2 border-dashed p-2 min-h-[76px] ${
        over ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50/60'
      }`}
    >
      <div className="text-[11px] font-bold text-slate-600 mb-1">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {children}
        {!children || (Array.isArray(children) ? children.filter(Boolean).length === 0 : !children) ? (
          <span className="text-[11px] text-slate-400">{empty}</span>
        ) : null}
      </div>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-[#e8f0fb] text-[#1a4f8a] border-[#c5d8f5]">
      {label}
      <button onClick={onRemove} className="font-bold leading-none hover:text-red-600" aria-label="제거">
        ×
      </button>
    </span>
  );
}
