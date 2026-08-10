import { FS_MAX, FS_MIN, FS_STEP } from '../utils/constants';

/**
 * 라벨·값 글자 크기 조절기 ( − 값 + )
 * 범위 4~20pt, 0.5pt 단위. 화면별로 값을 따로 보관한다.
 */
export default function FontStepper({ value, onChange, caption = '글자' }) {
  const step = (d) => {
    const n = Math.round((value + d * FS_STEP) * 2) / 2;
    onChange(Math.min(FS_MAX, Math.max(FS_MIN, n)));
  };
  const label = Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
      <span className="text-slate-500">{caption}</span>
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= FS_MIN}
        title="글자 작게"
        aria-label="글자 작게"
        className="w-6 h-6 rounded border border-slate-300 bg-white leading-none disabled:opacity-40 hover:bg-slate-50"
      >
        −
      </button>
      <span className="w-7 text-center tabular-nums">{label}</span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= FS_MAX}
        title="글자 크게"
        aria-label="글자 크게"
        className="w-6 h-6 rounded border border-slate-300 bg-white leading-none disabled:opacity-40 hover:bg-slate-50"
      >
        +
      </button>
    </span>
  );
}
