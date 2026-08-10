import { useState } from 'react';
import FontStepper from './FontStepper';
import {
  BASE_OPTS,
  CLASS_METHODS,
  LABEL_OPTS,
  MAP_PALETTES,
  SCOPE_OPTS,
  VIEW_OPTS,
} from '../utils/constants';
import { rampColors } from '../utils/choropleth';

function Group({ title, summary, open, onToggle, children }) {
  return (
    <section className="border border-slate-200 rounded-md overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold text-slate-700">{title}</div>
          {!open && summary && (
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{summary}</div>
          )}
        </div>
        <span className={`text-slate-400 text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {open && <div className="px-2.5 pb-2.5 pt-1 border-t border-slate-100 space-y-2.5">{children}</div>}
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-600 block mb-1">{label}</label>
      {children}
    </div>
  );
}

const selectCls = 'w-full p-1.5 border border-slate-300 rounded-md text-xs bg-white';

/**
 * 단계구분도 표시 옵션 패널 (지표 지도 · 지표 만들기 공용)
 * opts: { view, basemap, labelMode, fontSize, palette, method, classCount, reverse, scope }
 */
export default function MapOptionsPanel({ opts, setOpts, showScope = true }) {
  const [open, setOpen] = useState('view');
  const toggle = (id) => setOpen((p) => (p === id ? '' : id));
  const set = (patch) => setOpts({ ...opts, ...patch });

  const viewLabel = VIEW_OPTS.find(([k]) => k === opts.view)?.[1] || '';
  const baseLabel = BASE_OPTS.find(([k]) => k === opts.basemap)?.[1] || '';
  const labelLabel = LABEL_OPTS.find(([k]) => k === opts.labelMode)?.[1] || '';
  const methodLabel = CLASS_METHODS.find(([k]) => k === opts.method)?.[1] || '';

  return (
    <div className="space-y-2">
      <Group
        title="🗺 범위 · 배경 · 라벨"
        summary={`${viewLabel} · ${baseLabel} · ${labelLabel}`}
        open={open === 'view'}
        onToggle={() => toggle('view')}
      >
        <Row label="표시 범위">
          <select className={selectCls} value={opts.view} onChange={(e) => set({ view: e.target.value })}>
            {VIEW_OPTS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Row>
        <Row label="배경">
          <select
            className={selectCls}
            value={opts.basemap}
            onChange={(e) => set({ basemap: e.target.value })}
          >
            {BASE_OPTS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          {opts.basemap === 'osm' && (
            <p className="text-[10px] text-amber-700 mt-1">
              ⓘ 외부 타일을 내려받으므로 인터넷 연결 필요. 내부망에서는 “도형만”을 사용.
            </p>
          )}
        </Row>
        <Row label="라벨">
          <select
            className={selectCls}
            value={opts.labelMode}
            onChange={(e) => set({ labelMode: e.target.value })}
          >
            {LABEL_OPTS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Row>
        <div className="flex items-center justify-between">
          <FontStepper
            value={opts.fontSize}
            onChange={(v) => set({ fontSize: v })}
            caption="라벨 글자"
          />
        </div>
        {opts.view === 'nation' && opts.labelMode !== 'none' && (
          <p className="text-[10px] text-slate-500">
            전국 범위는 229개 라벨이 겹친다. 글자 크기를 5~6pt로 줄이거나 “값”만 표시할 것.
          </p>
        )}
      </Group>

      <Group
        title="🎨 색상 · 계급"
        summary={`${MAP_PALETTES[opts.palette]?.name || opts.palette} · ${methodLabel} ${opts.classCount}계급`}
        open={open === 'color'}
        onToggle={() => toggle('color')}
      >
        <Row label="색상">
          <select
            className={selectCls}
            value={opts.palette}
            onChange={(e) => set({ palette: e.target.value })}
          >
            {Object.entries(MAP_PALETTES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
          <div className="flex h-3 mt-1 rounded overflow-hidden border border-slate-200">
            {rampColors(opts.classCount, opts.reverse, opts.palette).map((c, i) => (
              <div key={i} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        </Row>
        <Row label="분류 방식">
          <select
            className={selectCls}
            value={opts.method}
            onChange={(e) => set({ method: e.target.value })}
          >
            {CLASS_METHODS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Row>
        <Row label="계급 수">
          <div className="flex gap-1">
            {[4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set({ classCount: n })}
                className={`flex-1 px-2 py-1 text-xs rounded border ${
                  opts.classCount === n
                    ? 'border-brand-700 bg-brand-700 text-white font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Row>
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={opts.reverse}
            onChange={(e) => set({ reverse: e.target.checked })}
            className="accent-brand-700"
          />
          색 방향 반전
        </label>
        {showScope && (
          <Row label="계급 기준">
            <select
              className={selectCls}
              value={opts.scope}
              onChange={(e) => set({ scope: e.target.value })}
            >
              {SCOPE_OPTS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              전국 기준은 지역 간 비교를 유지하고, 비교집단 기준은 집단 내부 대비를 강조한다.
            </p>
          </Row>
        )}
      </Group>
    </div>
  );
}

// 지도 옵션 기본값
export const DEFAULT_MAP_OPTS = {
  view: 'sido',
  basemap: 'none',
  labelMode: 'both',
  fontSize: 9,
  palette: 'navy',
  method: 'jenks',
  classCount: 5,
  reverse: false,
  scope: 'all',
};
