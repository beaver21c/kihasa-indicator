import { useEffect, useMemo, useRef, useState } from 'react';
import { loadCustom, loadSigunguGeo } from '../utils/dataLoader';
import { getGroupCodes } from '../utils/stats';
import { fmt } from '../utils/format';
import { BRAND, CMP_OPTIONS, TYPE7_LABEL, VIEW_OPTS, CLASS_METHODS, SCOPE_OPTS } from '../utils/constants';
import Sidebar from '../components/Sidebar';
import RegionSelector from '../components/RegionSelector';
import ChoroplethMap from '../components/ChoroplethMap';
import MapOptionsPanel, { DEFAULT_MAP_OPTS } from '../components/MapOptionsPanel';
import { savePlotPng } from '../utils/png';

/**
 * 지역별 현황 지도 (지표 단계구분도)
 * 지표 1개 + 연도를 고르면 전국 시·군·구를 계급색으로 칠하고,
 * 나의 지역을 굵은 테두리로 강조하며 전국·비교집단 순위를 함께 보여준다.
 */
export default function IndicatorMap() {
  const [data, setData] = useState(null);
  const [geo, setGeo] = useState(null);
  const [err, setErr] = useState(null);
  const [state, setState] = useState({
    sido: '',
    sgg: '',
    cmpMode: 'sido',
    year: '2024',
    sheet: '전체',
    query: '',
    key: '',
  });
  const [opts, setOpts] = useState(DEFAULT_MAP_OPTS);
  const [saving, setSaving] = useState(false);
  const gdRef = useRef(null);

  useEffect(() => {
    Promise.all([loadCustom(), loadSigunguGeo()])
      .then(([d, g]) => {
        setData(d);
        setGeo(g);
        const firstSido = d.sido_list[0];
        const firstSgg = Object.entries(d.areas)
          .filter(([, a]) => a.sido === firstSido)
          .sort((a, b) => a[1].sigungu.localeCompare(b[1].sigungu, 'ko'))[0];
        // 초기 지표·연도: 시·군·구(5자리) 값이 실제로 존재하는 최신 조합을 고른다.
        // (일부 지표는 특정 연도에 시·도 값만 있어 지도를 그릴 수 없다)
        const allYears = [...new Set(d.indicators.flatMap((i) => (i.years || []).map(String)))].sort();
        let pickYear = allYears[allYears.length - 1] || '2024';
        let pickKey = d.indicators[0]?.key || '';
        for (let yi = allYears.length - 1; yi >= 0; yi--) {
          const y = allYears[yi];
          const found = d.indicators.find((i) => {
            const raw = d.data[i.key]?.[y];
            return raw && Object.keys(raw).some((k) => k.length === 5);
          });
          if (found) {
            pickYear = y;
            pickKey = found.key;
            break;
          }
        }
        setState((s) => ({
          ...s,
          sido: firstSido,
          sgg: firstSgg ? firstSgg[0] : '',
          year: pickYear,
          key: pickKey,
        }));
      })
      .catch((e) => setErr(e.message));
  }, []);

  const sheets = useMemo(
    () => (data ? [...new Set(data.indicators.map((i) => i.sheet))] : []),
    [data]
  );

  const yearOptions = useMemo(() => {
    if (!data) return [];
    const ys = new Set();
    data.indicators.forEach((i) => (i.years || []).forEach((y) => ys.add(String(y))));
    return [...ys].sort();
  }, [data]);

  // 해당 연도에 시·군·구(5자리) 값이 있는 지표만 지도로 그릴 수 있다.
  const listed = useMemo(() => {
    if (!data) return [];
    const q = state.query.trim();
    return data.indicators
      .filter((i) => (state.sheet === '전체' || i.sheet === state.sheet) && (!q || i.name.includes(q)))
      .map((i) => {
        const raw = data.data[i.key]?.[state.year];
        const hasSgg = !!raw && Object.keys(raw).some((k) => k.length === 5);
        return { ...i, hasSgg };
      });
  }, [data, state.sheet, state.query, state.year]);

  const indicator = useMemo(
    () => data?.indicators.find((i) => i.key === state.key) || null,
    [data, state.key]
  );

  // 전국 229개 시·군·구 행 (v=null 허용)
  const rows = useMemo(() => {
    if (!data || !indicator) return [];
    const raw = data.data[indicator.key]?.[state.year] || {};
    return Object.entries(data.areas).map(([code, a]) => {
      const v = raw[code];
      return {
        code,
        name: `${a.sido} ${a.sigungu}`,
        short: a.sigungu,
        sido: a.sido,
        v: v == null || Number.isNaN(Number(v)) ? null : Number(v),
      };
    });
  }, [data, indicator, state.year]);

  const groupCodes = useMemo(() => {
    if (!data) return [];
    return getGroupCodes(data.areas, state.cmpMode, state.sido, state.sgg) || Object.keys(data.areas);
  }, [data, state.cmpMode, state.sido, state.sgg]);

  const viewCodes = useMemo(() => {
    if (!rows.length) return [];
    if (opts.view === 'nation') return rows.map((r) => r.code);
    const mySido = data?.areas[state.sgg]?.sido;
    const inSido = rows.filter((r) => r.sido === mySido).map((r) => r.code);
    return inSido.length ? inSido : rows.map((r) => r.code);
  }, [rows, opts.view, data, state.sgg]);

  // 전국·비교집단 순위 (내림차순)
  const rank = useMemo(() => {
    const me = rows.find((r) => r.code === state.sgg);
    if (!me || me.v == null) return null;
    const grpSet = new Set(groupCodes);
    const nat = rows.filter((r) => r.v != null).sort((a, b) => b.v - a.v);
    const grp = nat.filter((r) => grpSet.has(r.code));
    return {
      me,
      nat: nat.findIndex((r) => r.code === state.sgg) + 1,
      natN: nat.length,
      grp: grp.findIndex((r) => r.code === state.sgg) + 1,
      grpN: grp.length,
    };
  }, [rows, state.sgg, groupCodes]);

  if (err) return <div className="text-red-600">데이터 로드 오류: {err}</div>;
  if (!data || !geo || !state.sido) return <div className="text-slate-500">데이터 로딩 중…</div>;

  const curArea = data.areas[state.sgg];
  const cmpLabel = CMP_OPTIONS.find(([k]) => k === state.cmpMode)?.[1] || '';
  const methodLabel = CLASS_METHODS.find(([k]) => k === opts.method)?.[1] || '';
  const scopeLabel = SCOPE_OPTS.find(([k]) => k === opts.scope)?.[1] || '';
  const viewLabel = VIEW_OPTS.find(([k]) => k === opts.view)?.[1] || '';
  const nHas = rows.filter((r) => viewCodes.includes(r.code) && r.v != null).length;
  // 선택 지표가 시·군·구 단위로 존재하는 연도 (지도를 그릴 수 있는 연도)
  const sggYears = indicator
    ? (indicator.years || [])
        .map(String)
        .filter((y) => Object.keys(data.data[indicator.key]?.[y] || {}).some((k) => k.length === 5))
    : [];
  const noSggData = !!indicator && !sggYears.includes(state.year);

  const onSave = async () => {
    setSaving(true);
    try {
      await savePlotPng(
        gdRef.current,
        `지표지도_${indicator?.name || ''}_${state.year}.png`.replace(/[\\/:*?"<>|]/g, '_')
      );
    } catch (e) {
      alert('PNG 저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-0 max-w-[1400px] mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Sidebar title="지표 지도 설정">
        <RegionSelector data={data} state={state} setState={setState} />

        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div>
            <label className="text-xs font-bold text-slate-600">📅 연도</label>
            <select
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
              value={state.year}
              onChange={(e) => setState({ ...state, year: e.target.value })}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
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
            <label className="text-xs font-bold text-slate-600">🔍 지표명 검색</label>
            <input
              type="text"
              value={state.query}
              onChange={(e) => setState({ ...state, query: e.target.value })}
              placeholder="예: 노인, 어린이집, 자살"
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600">지표 선택 (1개)</span>
            <span className="text-[11px] text-slate-400">{listed.length}개</span>
          </div>
          <div className="max-h-60 overflow-y-auto scroll-thin border border-slate-100 rounded-md">
            {listed.map((i) => (
              <label
                key={i.key}
                className={`flex items-start gap-2 px-2 py-1.5 text-xs border-b border-slate-50 ${
                  !i.hasSgg
                    ? 'opacity-40 cursor-not-allowed'
                    : state.key === i.key
                      ? 'bg-[#e8f0fb] cursor-pointer'
                      : 'hover:bg-slate-50 cursor-pointer'
                }`}
                title={i.hasSgg ? i.name : `${state.year}년 시·군·구 단위 값 없음`}
              >
                <input
                  type="radio"
                  name="ind"
                  checked={state.key === i.key}
                  disabled={!i.hasSgg}
                  onChange={() => setState({ ...state, key: i.key })}
                  className="mt-0.5 accent-[#1a4f8a]"
                />
                <span>
                  <span className="text-slate-700">{i.name}</span>
                  <span className="text-slate-400 ml-1">[{i.sheet}]</span>
                </span>
              </label>
            ))}
            {listed.length === 0 && (
              <div className="text-xs text-slate-400 p-3">조건에 맞는 지표가 없다.</div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <MapOptionsPanel opts={opts} setOpts={setOpts} />
        </div>

        <button
          onClick={onSave}
          disabled={saving || !indicator}
          className="w-full mt-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: BRAND }}
        >
          {saving ? '저장 중…' : '🖼 지도 PNG 저장'}
        </button>
      </Sidebar>

      <div className="flex-1 p-4 min-w-0">
        <div className="rounded-md px-4 py-3 text-white mb-3" style={{ backgroundColor: BRAND }}>
          <div className="text-lg font-bold">
            {indicator?.name || '지표를 선택'}
            {indicator?.unit && (
              <span className="text-sm font-normal text-blue-100 ml-2">({indicator.unit})</span>
            )}
          </div>
          <div className="text-xs text-blue-100 mt-1 flex flex-wrap gap-2 items-center">
            <span className="px-2 py-0.5 rounded-full bg-white/15">{state.year}년</span>
            <span className="px-2 py-0.5 rounded-full bg-white/15">
              ◆ {curArea?.sido} {curArea?.sigungu}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/15">{cmpLabel}</span>
            {curArea?.type7 && (
              <span className="px-2 py-0.5 rounded-full bg-white/15">{TYPE7_LABEL[curArea.type7]}</span>
            )}
          </div>
        </div>

        {rank && (
          <div className="text-sm mb-2 px-1">
            <b className="text-[#c0392b]">{rank.me.name}</b>
            <span className="text-slate-700"> — {fmt(rank.me.v)}{indicator?.unit ? ` ${indicator.unit}` : ''}</span>
            <span className="text-slate-500">
              {' '}· 전국 {rank.nat}위/{rank.natN}
              {state.cmpMode !== 'national' && rank.grp > 0 && (
                <> · {cmpLabel.replace(' 비교', '')} 내 {rank.grp}위/{rank.grpN}</>
              )}
              {' '}(내림차순)
            </span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 mb-1 px-1">
          {viewLabel} {viewCodes.length}개 표시 · {methodLabel} {opts.classCount}계급({scopeLabel}) · n={nHas}
        </div>

        {noSggData && (
          <div className="mb-2 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
            ⚠ 이 지표는 {state.year}년에 시·군·구 단위 값이 없어 지도를 그릴 수 없다.
            {sggYears.length
              ? ` 시·군·구 값이 있는 연도: ${sggYears.join(', ')}`
              : ' 이 지표는 시·도 단위로만 제공된다.'}
          </div>
        )}

        {indicator ? (
          <ChoroplethMap
            geo={geo}
            rows={rows}
            viewCodes={viewCodes}
            groupCodes={groupCodes}
            selected={state.sgg}
            unit={indicator.unit}
            {...opts}
            height={600}
            onGraphDiv={(gd) => {
              gdRef.current = gd;
            }}
          />
        ) : (
          <div className="text-center text-slate-400 py-20 text-sm">좌측에서 지표를 1개 선택.</div>
        )}

        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
          ※ 계급 구간은 분류 방식에 따라 달라지므로 보고서 인용 시 분류 방식·계급 수를 병기할 것.
          화면의 모든 평균은 시·군·구 단순평균(unweighted)이며 시·도 공식 소계값과 산출 방식이 다르다.
        </p>
      </div>
    </div>
  );
}
