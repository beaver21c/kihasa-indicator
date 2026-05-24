// 좌측 공통 사이드바. children으로 페이지별 컨트롤을 주입받는다.
export default function Sidebar({ children, title = '분석 설정' }) {
  return (
    <aside className="bg-white w-72 shrink-0 p-4 border-r border-slate-200 min-h-full">
      <h2 className="text-sm font-bold text-slate-700 mb-3 pb-2 border-b border-slate-100">
        {title}
      </h2>
      {children}
    </aside>
  );
}
