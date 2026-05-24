import { COLORS } from '../utils/constants';

function Item({ color, label, shape = 'dot' }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      {shape === 'dot' && (
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: color }} />
      )}
      {shape === 'diamond' && (
        <span className="inline-block w-3 h-3 rotate-45" style={{ background: color }} />
      )}
      {shape === 'box' && (
        <span className="inline-block w-5 h-3 rounded-sm" style={{ background: color }} />
      )}
      {shape === 'line' && (
        <span className="inline-block w-5 h-0.5" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}

export default function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 items-center py-2 px-1">
      <Item color={COLORS.target} label="선택지역" shape="diamond" />
      <Item color={COLORS.avg} label="비교평균" shape="dot" />
      <Item color={COLORS.iqr} label="IQR (Q1~Q3)" shape="box" />
      <Item color={COLORS.whisker} label="Min~Max" shape="line" />
    </div>
  );
}
