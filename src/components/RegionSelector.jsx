import { TYPE7_LABEL, CMP_OPTIONS } from '../utils/constants';

// data: {sido_list, areas}, state: {sido, sgg, cmpMode, ...}
export default function RegionSelector({ data, state, setState }) {
  const { sido_list, areas } = data;
  const curSido = state.sido;

  const sggList = Object.entries(areas)
    .filter(([, a]) => a.sido === curSido)
    .map(([code, a]) => ({ code, name: a.sigungu, type7: a.type7 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const curType = areas[state.sgg]?.type7;

  const onSido = (e) => {
    const sido = e.target.value;
    const first = Object.entries(areas)
      .filter(([, a]) => a.sido === sido)
      .sort((a, b) => a[1].sigungu.localeCompare(b[1].sigungu, 'ko'))[0];
    setState({ ...state, sido, sgg: first ? first[0] : '' });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-600">📍 시·도</label>
        <select
          className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
          value={curSido}
          onChange={onSido}
        >
          {sido_list.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-600">시·군·구</label>
        <select
          className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
          value={state.sgg}
          onChange={(e) => setState({ ...state, sgg: e.target.value })}
        >
          {sggList.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
        {curType && (
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#e8f0fb] text-[#1a4f8a] border border-[#c5d8f5]">
            {TYPE7_LABEL[curType]}
          </span>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-slate-600">⚖️ 비교 기준</label>
        <div className="space-y-1 mt-1">
          {CMP_OPTIONS.map(([k, label]) => (
            <label key={k} className="flex items-center text-sm cursor-pointer">
              <input
                type="radio"
                name="cmp"
                value={k}
                checked={state.cmpMode === k}
                onChange={() => setState({ ...state, cmpMode: k })}
                className="mr-2 accent-[#1a4f8a]"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
