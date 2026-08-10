import { useEffect, useMemo, useRef, useState } from 'react';
import { loadRegion } from '../utils/dataLoader';
import { getCmpStats, flattenSigungu, pickYearBlock, filledYears } from '../utils/stats';
import { CAT_ORDER, TYPE7_LABEL, CMP_OPTIONS, BRAND } from '../utils/constants';
import Sidebar from '../components/Sidebar';
import RegionSelector from '../components/RegionSelector';
import IndicatorRow from '../components/IndicatorRow';
import Legend from '../components/Legend';
import { saveReportPng } from '../utils/png';

export default function RegionReport() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [state, setState] = useState({ sido: '', sgg: '', cmpMode: 'sido', year: '' });
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState({}); // 영역(카테고리) 그룹 접기
  const reportRef = useRef(null);

  useEffect(() => {
    loadRegion()
      .then((d) => {
        setData(d);
        // 초기값: 첫 시도의 첫 시군구, 최신 연도
        const firstSido = d.sido_list[0];
        const firstSgg = Object.entries(d.areas)
          .filter(([, a]) => a.sido === firstSido)
          .sort((a, b) => a[1].sigungu.localeCompare(b[1].sigungu, 'ko'))[0];
        const years = d.indicators[0].years;
        setState((s) => ({
          ...s,
          sido: firstSido,
          sgg: firstSgg ? firstSgg[0] : '',
          year: String(years[years.length - 1]),
        }));
      })
      .catch((e) => setErr(e.message));
  }, []);

  // 가용 연도 = 실제 데이터(data_by_year)가 존재하는 모든 연도의 합집합.
  // 지표마다 생산 주기가 달라(2024·2023 혼재) 교집합만 쓰면 최신 연도를 볼 수 없다.
  const yearOptions = useMemo(() => {
    if (!data) return [];
    const ys = new Set();
    data.indicators.forEach((i) => filledYears(i).forEach((y) => ys.add(y)));
    return [...ys].sort();
  }, [data]);

  // 카테고리별 그룹
  const grouped = useMemo(() => {
    if (!data) return [];
    const byCat = {};
    for (const ind of data.indicators) {
      (byCat[ind.category] ||= []).push(ind);
    }
    return CAT_ORDER.filter((c) => byCat[c]).map((c) => ({ cat: c, items: byCat[c] }));
  }, [data]);

  if (err) return <div className="text-red-600">데이터 로드 오류: {err}</div>;
  if (!data || !state.sido) return <div className="text-slate-500">데이터 로딩 중…</div>;

  const { areas } = data;
  const curArea = areas[state.sgg];
  const year = state.year;

  const onSave = async () => {
    setSaving(true);
    try {
      await saveReportPng(
        reportRef.current,
        `지역중심리포트_${curArea?.sido}_${curArea?.sigungu}_${year}.png`
      );
    } finally {
      setSaving(false);
    }
  };

  const cmpLabel = CMP_OPTIONS.find(([k]) => k === state.cmpMode)?.[1] || '';

  return (
    <div className="flex gap-0 max-w-[1400px] mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* 사이드바 */}
      <Sidebar title="지역중심 리포트 설정">
        <RegionSelector data={data} state={state} setState={setState} />
        <div className="mt-3">
          <label className="text-xs font-bold text-slate-600">📅 연도</label>
          <select
            className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
            value={year}
            onChange={(e) => setState({ ...state, year: e.target.value })}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
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
            {curArea?.sido} {curArea?.sigungu}
            <span className="text-sm font-normal text-blue-100 ml-2">· {year}년</span>
          </div>
          <div className="text-xs text-blue-100 mt-1 flex flex-wrap gap-2 items-center">
            <span className="px-2 py-0.5 rounded-full bg-white/15">{cmpLabel}</span>
            {curArea?.type7 && (
              <span className="px-2 py-0.5 rounded-full bg-white/15">{TYPE7_LABEL[curArea.type7]}</span>
            )}
          </div>
        </div>

        <Legend />

        {grouped.map(({ cat, items }) => (
          <section key={cat} className="mb-4">
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
              className="w-full flex items-center justify-between text-sm font-bold text-[#1a4f8a] bg-slate-50 px-3 py-1.5 rounded-md mb-1 hover:bg-slate-100"
            >
              <span>
                {cat} <span className="text-[11px] font-normal text-slate-400">({items.length}개)</span>
              </span>
              <span className={`text-[10px] text-slate-400 transition-transform ${collapsed[cat] ? '' : 'rotate-180'}`}>
                ▼
              </span>
            </button>
            {!collapsed[cat] && items.map((ind) => {
              // 선택 연도 값이 없으면 그보다 앞선 최근 유효 연도로 대체하고 배지로 알린다.
              const useYear = pickYearBlock(ind, year);
              const flat = flattenSigungu(useYear ? ind.data_by_year[useYear] : null);
              const targetVal = flat[state.sgg];
              const stats = getCmpStats(flat, areas, state.cmpMode, state.sido, state.sgg);
              return (
                <IndicatorRow
                  key={ind.name}
                  indicator={ind}
                  stats={stats}
                  targetVal={targetVal}
                  yearNote={useYear && useYear !== year ? useYear : null}
                />
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
