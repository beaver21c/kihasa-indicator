import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';

// 라우트 단위 코드 분할 — 첫 진입(홈)에서는 plotly·leaflet 번들을 내려받지 않는다.
const RegionReport = lazy(() => import('./pages/RegionReport'));
const CustomReport = lazy(() => import('./pages/CustomReport'));
const TrendReport = lazy(() => import('./pages/TrendReport'));
const IndicatorMap = lazy(() => import('./pages/IndicatorMap'));
const IndicatorBuilder = lazy(() => import('./pages/IndicatorBuilder'));
const MapAnalysis = lazy(() => import('./pages/MapAnalysis'));
const Guide = lazy(() => import('./pages/Guide'));

// 단일 HTML(폐쇄망) 빌드는 file:// 에서 열리므로 HashRouter를 쓴다.
const SINGLE = typeof __SINGLE_FILE__ !== 'undefined' && __SINGLE_FILE__;
const Router = SINGLE ? HashRouter : BrowserRouter;

function Loading() {
  return <div className="text-slate-400 text-sm py-16 text-center">화면 불러오는 중…</div>;
}

function Shell() {
  const { pathname } = useLocation();
  // GIS 지도분석은 전체 높이를 쓰고 내부에서만 스크롤한다.
  const full = pathname.startsWith('/map');

  return (
    <div className={full ? 'h-screen flex flex-col overflow-hidden' : 'min-h-screen flex flex-col'}>
      <div className="px-4 pt-4 flex-shrink-0">
        <Header />
      </div>
      <main className={full ? 'flex-1 min-h-0 px-4 py-3 flex' : 'flex-1 px-4 py-4'}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/region" element={<RegionReport />} />
            <Route path="/custom" element={<CustomReport />} />
            <Route path="/trend" element={<TrendReport />} />
            <Route path="/indicator-map" element={<IndicatorMap />} />
            <Route path="/builder" element={<IndicatorBuilder />} />
            <Route path="/map" element={<MapAnalysis />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      <div className="px-4 flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
}

// GitHub Pages 하위경로 대응: basename = import.meta.env.BASE_URL ('/kihasa-indicator/')
export default function App() {
  return (
    <Router basename={SINGLE ? undefined : import.meta.env.BASE_URL}>
      <Shell />
    </Router>
  );
}
