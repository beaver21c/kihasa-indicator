import { Link, NavLink } from 'react-router-dom';
import { BRAND, NAV_ITEMS } from '../utils/constants';

export default function Header() {
  return (
    <header
      className="text-white px-5 py-3 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-2"
      style={{ backgroundColor: BRAND }}
    >
      <Link to="/" className="block min-w-0">
        <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
          📊 지역사회보장 종합분석 플랫폼
        </h1>
        <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5">
          지역사회보장지표 분석 · GIS 지도분석 통합 · 한국보건사회연구원(KIHASA)
        </p>
      </Link>
      <nav className="flex flex-wrap gap-1 text-xs sm:text-sm">
        {NAV_ITEMS.map(({ to, label, short }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-2.5 py-1.5 rounded-md transition whitespace-nowrap ${
                isActive ? 'bg-white text-[#1a4f8a] font-semibold' : 'bg-white/10 hover:bg-white/20'
              }`
            }
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{short}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
