import { useState } from 'react';
import MapView from '../map/components/MapView.jsx';
import ControlPanel from '../map/components/ControlPanel.jsx';
import UsageGuide from '../map/components/UsageGuide.jsx';
import ExportButton from '../map/components/ExportButton.jsx';
import ResetButton from '../map/components/ResetButton.jsx';
import ServiceGuide from '../map/components/ServiceGuide.jsx';
import ErrorBoundary from '../map/components/ErrorBoundary.jsx';

/**
 * GIS 지도분석 (구 rcssp_map)
 * 읍면동·시군구 단위 코로플레스 맵 + 기관 위치 표시 + PNG 내보내기.
 * 통합 대시보드의 공통 헤더/푸터 안쪽에서 전체 높이를 사용한다.
 */
export default function MapAnalysis() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* 지도 전용 툴바 */}
      <div className="border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            className="md:hidden p-1.5 rounded hover:bg-slate-100 flex-shrink-0"
            onClick={() => setPanelOpen((v) => !v)}
            aria-label="설정 패널 토글"
          >
            <span className="block w-5 h-0.5 bg-slate-700 mb-1" />
            <span className="block w-5 h-0.5 bg-slate-700 mb-1" />
            <span className="block w-5 h-0.5 bg-slate-700" />
          </button>
          <h2 className="text-sm font-bold text-slate-800 truncate">
            🗺 GIS 지도분석
            <span className="text-slate-500 font-normal text-xs ml-1 hidden sm:inline">
              (읍면동 단위 코로플레스 맵 · 기관 위치)
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setGuideOpen(true)}
            className="px-2.5 py-1.5 text-xs border border-brand-500 text-brand-700 rounded hover:bg-brand-50 font-medium whitespace-nowrap"
          >
            <span className="hidden sm:inline">📖 이용 가이드</span>
            <span className="sm:hidden">📖</span>
          </button>
          <ResetButton />
          <ExportButton />
        </div>
      </div>

      <ServiceGuide open={guideOpen} onClose={() => setGuideOpen(false)} />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <aside
          className={`bg-white border-r border-slate-200 flex-shrink-0 transition-transform duration-200 z-[700]
            md:static md:w-80 md:translate-x-0
            absolute inset-y-0 left-0 w-72 ${panelOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <ErrorBoundary>
            <ControlPanel />
          </ErrorBoundary>
        </aside>

        {panelOpen && (
          <div
            className="md:hidden absolute inset-0 bg-black/30 z-[650]"
            onClick={() => setPanelOpen(false)}
          />
        )}

        <section className="flex-1 relative bg-slate-100 min-w-0">
          <ErrorBoundary>
            <MapView />
          </ErrorBoundary>
        </section>
      </div>

      <UsageGuide />
    </div>
  );
}
