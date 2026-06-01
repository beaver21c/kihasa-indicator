import { useState } from 'react';
import { TYPE7_LABEL, TREND_PALETTE, TREND_MAX_REGIONS } from '../utils/constants';

// 복수 지역(최대 5) 선택기 — state.regions = [지자체코드]
export default function MultiRegionSelector({ data, state, setState }) {
  const { sido_list, areas } = data;
  const [pickSido, setPickSido] = useState(sido_list[0]);

  const sggList = Object.entries(areas)
    .filter(([, a]) => a.sido === pickSido)
    .map(([code, a]) => ({ code, name: a.sigungu, type7: a.type7 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const add = (code) => {
    if (!code) return;
    setState((s) => {
      if (s.regions.includes(code)) return s;
      if (s.regions.length >= TREND_MAX_REGIONS) {
        alert(`복수 지역은 최대 ${TREND_MAX_REGIONS}곳까지 비교 가능하다.`);
        return s;
      }
      return { ...s, regions: [...s.regions, code] };
    });
  };
  const remove = (code) => setState((s) => ({ ...s, regions: s.regions.filter((c) => c !== code) }));

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-bold text-slate-600">📍 시·도</label>
        <select
          className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
          value={pickSido}
          onChange={(e) => setPickSido(e.target.value)}
        >
          {sido_list.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-600">
          시·군·구 추가 ({state.regions.length}/{TREND_MAX_REGIONS})
        </label>
        <select
          className="w-full p-2 mt-1 border border-slate-300 rounded-md text-sm bg-white"
          value=""
          onChange={(e) => add(e.target.value)}
        >
          <option value="">+ 지역 선택…</option>
          {sggList.map((s) => (
            <option key={s.code} value={s.code} disabled={state.regions.includes(s.code)}>
              {s.name}{state.regions.includes(s.code) ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 선택된 지역 칩 (팔레트 색상 고정) */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {state.regions.length === 0 && (
          <span className="text-xs text-slate-400">비교할 지역을 1곳 이상 추가.</span>
        )}
        {state.regions.map((code, i) => {
          const a = areas[code];
          const color = TREND_PALETTE[i % TREND_PALETTE.length];
          return (
            <span
              key={code}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: color }}
              title={a?.type7 ? TYPE7_LABEL[a.type7] : ''}
            >
              {a?.sido} {a?.sigungu}
              <button onClick={() => remove(code)} className="ml-0.5 font-bold leading-none hover:text-yellow-200" aria-label="제거">×</button>
            </span>
          );
        })}
      </div>

      <label className="flex items-center text-xs text-slate-600 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={state.showRefLine}
          onChange={(e) => setState({ ...state, showRefLine: e.target.checked })}
          className="mr-2 accent-[#1a4f8a]"
        />
        전국 평균 기준선 표시
      </label>
    </div>
  );
}
