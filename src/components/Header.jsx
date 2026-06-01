import { Link } from 'react-router-dom';
import { BRAND } from '../utils/constants';

export default function Header() {
  return (
    <header
      className="text-white px-5 py-3.5 rounded-lg shadow-sm flex items-center justify-between"
      style={{ backgroundColor: BRAND }}
    >
      <div>
        <Link to="/" className="block">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            📊 지역사회보장지표 종합분석 대시보드
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
            2024년도 지역사회보장지표 · 출처: 한국보건사회연구원(KIHASA)
          </p>
        </Link>
      </div>
      <nav className="hidden sm:flex gap-2 text-sm">
        <Link to="/region" className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition">
          지역중심
        </Link>
        <Link to="/custom" className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition">
          지역맞춤
        </Link>
        <Link to="/trend" className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition">
          연도별 추이
        </Link>
      </nav>
    </header>
  );
}
