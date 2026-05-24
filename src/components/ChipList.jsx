// 선택된 지표 chip 표시 (X로 개별 제거)
export default function ChipList({ items, onRemove }) {
  if (!items.length)
    return <div className="text-xs text-slate-400 py-2">선택된 지표가 없다. 좌측에서 지표를 선택.</div>;
  return (
    <div className="flex flex-wrap gap-1.5 py-2">
      {items.map((it) => (
        <span
          key={it.key}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-[#e8f0fb] text-[#1a4f8a] border-[#c5d8f5]"
        >
          {it.name}
          <button
            onClick={() => onRemove(it.key)}
            className="ml-0.5 text-[#1a4f8a] hover:text-red-600 font-bold leading-none"
            aria-label="제거"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
