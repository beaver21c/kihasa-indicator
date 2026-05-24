import { useEffect, useMemo, useRef, useState } from 'react';
import { loadCustom } from '../utils/dataLoader';
import { getCustomStats, getCustomTarget } from '../utils/stats';
import { TYPE7_LABEL, CMP_OPTIONS, BRAND } from '../utils/constants';
import Sidebar from '../components/Sidebar';
import RegionSelector from '../components/RegionSelector';
import IndicatorRow from '../components/IndicatorRow';
import Legend from '../components/Legend';
import ChipList from '../components/ChipList';
import { saveReportPng } from '../utils/png';

const MAX_SEL = 20;

export default function CustomReport() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [state, setState] = useState({
    sido: '', sgg: '', cmpMode: 'sido', year: '2024',
    sheet: '전체', query: '', selected: [],
  });
  const [saving, setSaving] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    loadCustom()
      .then((d) => {
        setData(d);
        const firstSido = d.sido_list[0];
        const firstSgg = Object.entries(d.areas)
          .filter(([, a]) => a.sido === firstSido)
          .sort((a, b) => a[1].sigungu.localeCompare(b[1].sigungu, 'ko'))[0];
        setState((s) => ({ ...s, sido: firstSido, sgg: firstSgg ? firstSgg[0] : '' }));
      })
      .catch((e) => setErr(e.message));
  }, []);

  const sheets = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.indicators.map((i) => i.sheet))];
  }, [data]);

  const yearOptions = useMemo(() => {
    if (!data) return [];
    const ys = new Set();
    data.indicators.forEach((i) => (i.years || []).forEach((y) => ys.add(String(y))));
    return [...ys].sort();
  }, [data]);

  // 필터된 지표 목록
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = state.query.trim();
    return data.indicators.filter((i) => {
      if (state.sheet !== '전체' && i.sheet !== state.sheet) return false;
      if (q && !i.name.includes(q)) return false;
      if (!(i.years || []).map(String).includes(state.year)) return false;
      return true;
    });
  }, [data, state.sheet, state.query, state.year]);

  if (err) return <div className="text-red-600">데이터 로드 오류: {err}</div>;
  if (!data || !state.sido) return <div className="text-slate-500">데이터 로딩 중…</div>;

  const { areas } = data;
  const curArea = areas[state.sgg];
  const indByKey = Object.fromEntries(data.indicators.map((i) => [i.key, i]));
  const selectedItems = state.selected.map((k) => indByKey[k]).filter(Boolean);
  const cmpLabel = CMP_OPTIONS.find(([k]) => k === state.cmpMode)?.[1] || '';

  const toggle = (key) => {
    setState((s) => {
      if (s.selected.includes(key)) return { ...s, selected: s.selected.filter((k) => k !== key) };
      if (s.selected.length >= MAX_SEL) {
        alert(`최대 ${MAX_SEL}개까지 선택 가능하다.`);
        return s;
      }
      return { ...s, selected: [...s.selected, key] };
    });
  };
  const remove = (key) => setState((s) => ({ ...s, selected: s.selected.filter((k) => k !== key) }));

  const onSave = async () => {
    setSaving(true);
    try {
      await saveReportPng(reportRef.current, `지역맞춤리포트_${curArea?.sigungu}_${state.year}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-0 max-w-[1400px] mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden">
      <Sidebar title="지역맞춤 리포트 설정">
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
              {sheets.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">📅 연도</label>
            <select
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
              value={state.year}
              onChange={(e) => setState({ ...state, year: e.target.value })}
            >
              {yearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">🔍 지표명 검색</label>
            <input
              type="text"
              value={state.query}
              onChange={(e) => setState({ ...state, query: e.target.value })}
              placeholder="예: 어린이집, 자살, 고용"
              className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* 지표 목록 (체크박스) */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600">
              지표 선택 ({state.selected.length}/{MAX_SEL})
            </span>
            <span className="text-[11px] text-slate-400">{filtered.length}개</span>
          </div>
          <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-md">
            {filtered.map((i) => {
              const checked = state.selected.includes(i.key);
              return (
                <label
                  key={i.key}
                  className={`flex items-start gap-2 px-2 py-1.5 text-xs cursor-pointer border-b border-slate-50 ${
                    checked ? 'bg-[#e8f0fb]' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(i.key)}
                    className="mt-0.5 accent-[#1a4f8a]"
                  />
                  <span>
                    <span className="text-slate-700">{i.name}</span>
                    <span className="text-slate-400 ml-1">[{i.sheet}]</span>
                  </span>
                </label>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-xs text-slate-400 p-3">조건에 맞는 지표가 없다.</div>
            )}
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={saving || !selectedItems.length}
          className="w-full mt-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: BRAND }}
        >
          {saving ? '저장 중…' : '🖼 PNG 저장'}
        </button>
      </Sidebar>

      {/* 메인 */}
      <div className="flex-1 p-4 min-w-0" ref={reportRef}>
        <div className="rounded-md px-4 py-3 text-white mb-3" style={{ backgroundColor: BRAND }}>
          <div className="text-lg font-bold">
            {curArea?.sido} {curArea?.sigungu}
            <span className="text-sm font-normal text-blue-100 ml-2">· {state.year}년</span>
          </div>
          <div className="text-xs text-blue-100 mt-1 flex flex-wrap gap-2 items-center">
            <span className="px-2 py-0.5 rounded-full bg-white/15">{cmpLabel}</span>
            {curArea?.type7 && (
              <span className="px-2 py-0.5 rounded-full bg-white/15">{TYPE7_LABEL[curArea.type7]}</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-white/15">선택 {selectedItems.length}개</span>
          </div>
        </div>

        <ChipList items={selectedItems} onRemove={remove} />
        {selectedItems.length > 0 && <Legend />}

        {selectedItems.map((ind) => {
          const raw = data.data[ind.key]?.[state.year] || {};
          const targetVal = getCustomTarget(raw, state.sgg);
          const stats = getCustomStats(raw, areas, state.cmpMode, state.sido, state.sgg);
          return (
            <IndicatorRow
              key={ind.key}
              indicator={ind}
              stats={stats}
              targetVal={targetVal}
              areaLabel={ind.sheet}
            />
          );
        })}

        {selectedItems.length === 0 && (
          <div className="text-center text-slate-400 py-16 text-sm">
            좌측에서 지표를 선택하면 박스플롯이 표시된다 (최대 {MAX_SEL}개).
          </div>
        )}
      </div>
    </div>
  );
}
