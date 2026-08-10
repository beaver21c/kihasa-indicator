import { useEffect, useMemo, useState } from 'react';
import Plot from '../utils/plot';
import { loadJson } from '../utils/dataLoader';
import { fmt } from '../utils/format';
import { COLORS, MISSING_FILL } from '../utils/constants';
import {
  classBreaks,
  classIdx,
  rampColors,
  discreteColorscale,
  featCentroid,
  labelColorOn,
  mapboxView,
} from '../utils/choropleth';

// plotly의 geo(choropleth)는 기본 지형 topojson을 cdn.plot.ly 에서 내려받는다.
// 내부망·오프라인에서도 동작하도록 저장소에 동봉한 파일을 미리 캐시에 넣는다.
// (단일 HTML 빌드에서는 window.__EMBEDDED_DATA__ 로 인라인되어 fetch 자체가 없다)
const TOPOJSON_NAME = 'world_110m';
let geoAssetsPromise = null;
function ensureGeoAssets() {
  if (!geoAssetsPromise) {
    geoAssetsPromise = loadJson(`data/topojson/${TOPOJSON_NAME}.json`)
      .then((topo) => {
        if (typeof window === 'undefined') return;
        window.PlotlyGeoAssets = window.PlotlyGeoAssets || { topojson: {} };
        window.PlotlyGeoAssets.topojson = window.PlotlyGeoAssets.topojson || {};
        window.PlotlyGeoAssets.topojson[TOPOJSON_NAME] = topo;
      })
      .catch((e) => {
        // 실패해도 topojsonURL 폴백으로 계속 진행
        console.warn('[ChoroplethMap] 기본 지형 데이터 사전 로드 실패:', e);
      });
  }
  return geoAssetsPromise;
}

/**
 * 시·군·구 단계구분도 (지표 지도 · 지표 만들기 공용)
 *
 * props
 *  geo         : FeatureCollection (properties.code = 시군구 코드)
 *  rows        : [{ code, name, short, v }] — 전국 229개 전체 (v=null 허용)
 *  viewCodes   : 화면에 그릴 코드 배열
 *  groupCodes  : 비교집단 코드 배열 (계급기준·순위용)
 *  selected    : 나의 지역 코드 (굵은 테두리 강조)
 *  unit        : 단위 문자열
 *  palette/method/classCount/reverse/scope/labelMode/basemap/fontSize : 표시 옵션
 *  height      : 차트 높이(px)
 */
export default function ChoroplethMap({
  geo,
  rows,
  viewCodes,
  groupCodes,
  selected,
  unit = '',
  palette = 'navy',
  method = 'jenks',
  classCount = 5,
  reverse = false,
  scope = 'all',
  labelMode = 'both',
  basemap = 'none',
  fontSize = 9,
  height = 560,
  revision = 0,
  onGraphDiv,
}) {
  const [geoReady, setGeoReady] = useState(false);
  useEffect(() => {
    let alive = true;
    ensureGeoAssets().then(() => alive && setGeoReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const model = useMemo(() => {
    if (!geo || !rows?.length) return null;
    const viewSet = new Set(viewCodes?.length ? viewCodes : rows.map((r) => r.code));
    const grpSet = new Set(groupCodes?.length ? groupCodes : rows.map((r) => r.code));

    const view = rows.filter((r) => viewSet.has(r.code));
    const has = view.filter((r) => r.v != null);
    const miss = view.filter((r) => r.v == null);

    // 계급 구간 산출 모집단 — 전국 기준이면 화면 밖 지역까지 포함해 비교 가능성 유지
    const pool = (scope === 'all' ? rows : rows.filter((r) => grpSet.has(r.code)))
      .filter((r) => r.v != null)
      .map((r) => r.v);

    if (!has.length || !pool.length) {
      return { empty: true, view, miss, has, cols: [], brk: [] };
    }

    const brk = classBreaks(pool, method, classCount);
    const cols = rampColors(brk.length, reverse, palette);
    return { empty: false, view, has, miss, brk, cols, grpSet, viewSet };
  }, [geo, rows, viewCodes, groupCodes, palette, method, classCount, reverse, scope]);

  const { data, layout } = useMemo(() => {
    if (!model || model.empty) return { data: [], layout: {} };
    const { has, miss, brk, cols, viewSet } = model;
    const onBase = basemap === 'osm';
    const type = onBase ? 'choroplethmapbox' : 'choropleth';
    const cs = discreteColorscale(cols);
    const marker = onBase
      ? { line: { color: '#fff', width: 0.6 }, opacity: 0.78 }
      : { line: { color: '#fff', width: 0.5 } };

    const traces = [];

    // 값 없는 지역 (회색)
    if (miss.length) {
      traces.push({
        type,
        geojson: geo,
        featureidkey: 'properties.code',
        locations: miss.map((r) => r.code),
        z: miss.map(() => 0),
        colorscale: [
          [0, MISSING_FILL],
          [1, MISSING_FILL],
        ],
        showscale: false,
        marker,
        customdata: miss.map((r) => [r.name]),
        hovertemplate: '%{customdata[0]}<br>데이터 없음<extra></extra>',
      });
    }

    // 값 있는 지역 (계급색)
    traces.push({
      type,
      geojson: geo,
      featureidkey: 'properties.code',
      locations: has.map((r) => r.code),
      z: has.map((r) => classIdx(r.v, brk)),
      zmin: -0.5,
      zmax: cols.length - 0.5,
      colorscale: cs,
      showscale: false,
      marker,
      customdata: has.map((r) => [r.name, `${fmt(r.v)}${unit ? ` ${unit}` : ''}`]),
      hovertemplate: '%{customdata[0]}<br>%{customdata[1]}<extra></extra>',
    });

    // 라벨(지역명·값)
    if (labelMode && labelMode !== 'none') {
      const byCode = new Map((geo.features || []).map((f) => [String(f.id ?? f.properties?.code), f]));
      const labelRows = [
        ...has.map((r) => ({ ...r, vTxt: fmt(r.v), fill: cols[classIdx(r.v, brk)] })),
        ...(labelMode === 'name' || labelMode === 'both'
          ? miss.map((r) => ({ ...r, vTxt: '', fill: MISSING_FILL }))
          : []),
      ];
      const lon = [];
      const lat = [];
      const txt = [];
      const col = [];
      labelRows.forEach((r) => {
        const f = byCode.get(String(r.code));
        if (!f) return;
        const c = featCentroid(f);
        if (!c) return;
        const parts = [];
        if (labelMode !== 'value') parts.push(r.short);
        if (labelMode !== 'name' && r.vTxt) parts.push(r.vTxt);
        if (!parts.length) return;
        lon.push(c[0]);
        lat.push(c[1]);
        txt.push(parts.join('<br>'));
        col.push(labelColorOn(r.fill));
      });
      if (lon.length) {
        traces.push({
          type: onBase ? 'scattermapbox' : 'scattergeo',
          mode: 'text',
          lon,
          lat,
          text: txt,
          textfont: { size: fontSize, color: col, family: 'Noto Sans KR' },
          hoverinfo: 'skip',
          showlegend: false,
        });
      }
    }

    // 나의 지역 강조 — 같은 칸을 굵은 테두리로 덧그림
    if (selected && viewSet.has(selected)) {
      const sel = model.view.find((r) => r.code === selected);
      if (sel) {
        traces.push({
          type,
          geojson: geo,
          featureidkey: 'properties.code',
          locations: [selected],
          z: [sel.v != null ? classIdx(sel.v, brk) : 0],
          zmin: -0.5,
          zmax: cols.length - 0.5,
          colorscale:
            sel.v != null
              ? cs
              : [
                  [0, MISSING_FILL],
                  [1, MISSING_FILL],
                ],
          showscale: false,
          marker: { line: { color: COLORS.target, width: 2.6 }, ...(onBase ? { opacity: 0.9 } : {}) },
          customdata: [[sel.name, sel.v != null ? `${fmt(sel.v)}${unit ? ` ${unit}` : ''}` : '데이터 없음']],
          hovertemplate: '%{customdata[0]}<br>%{customdata[1]}<extra></extra>',
        });
      }
    }

    const base = {
      height,
      margin: { l: 0, r: 0, t: 6, b: 0 },
      font: { family: 'Noto Sans KR' },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
    };
    const lay = onBase
      ? {
          ...base,
          mapbox: (() => {
            const v = mapboxView(geo, model.view.map((r) => r.code));
            return { style: 'open-street-map', center: v.center, zoom: v.zoom };
          })(),
        }
      : {
          ...base,
          geo: {
            fitbounds: 'locations',
            projection: { type: 'mercator' },
            visible: false,
            bgcolor: 'rgba(0,0,0,0)',
          },
        };

    return { data: traces, layout: lay };
  }, [model, geo, basemap, labelMode, fontSize, selected, unit, height]);

  if (!geo || !rows?.length || !geoReady) {
    return <div className="text-slate-400 text-sm py-20 text-center">지도 데이터 로딩 중…</div>;
  }
  if (!model || model.empty) {
    return (
      <div className="text-slate-500 text-sm py-20 text-center">
        해당 조건에 표시할 시·군·구 데이터가 없다.
      </div>
    );
  }

  const { has, miss, brk, cols } = model;
  let lo = Math.min(...has.map((r) => r.v));

  return (
    <div>
      <Plot
        key={`${basemap}-${revision}`}
        data={data}
        layout={layout}
        config={{
          displaylogo: false,
          responsive: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
          toImageButtonOptions: { format: 'png', scale: 2 },
          // 사전 캐시가 실패한 경우의 폴백 (외부 CDN 대신 동봉 파일 사용)
          topojsonURL: `${import.meta.env.BASE_URL}data/topojson/`,
        }}
        style={{ width: '100%', height: `${height}px` }}
        useResizeHandler
        onInitialized={(fig, gd) => onGraphDiv?.(gd)}
        onUpdate={(fig, gd) => onGraphDiv?.(gd)}
      />
      {basemap === 'osm' && (
        <p className="text-[10px] text-amber-700 px-1 pt-1">
          ⓘ 배경 지도(OpenStreetMap) 모드는 외부 타일 서버에 접속한다. 내부망·오프라인에서 지도가 비어 보이면
          배경을 “도형만”으로 바꿀 것.
        </p>
      )}

      {/* 범례 — 계급 구간 + 해당 지역 수 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[11px] text-slate-600 px-1 pt-1">
        {cols.map((c, i) => {
          const hi = brk[i];
          const label = `${fmt(lo)} ~ ${fmt(hi)}`;
          lo = hi;
          const n = has.filter((r) => classIdx(r.v, brk) === i).length;
          return (
            <span key={i} className="inline-flex items-center gap-1">
              <span
                className="inline-block w-4 h-3 border border-slate-300"
                style={{ background: c }}
              />
              {label} <span className="text-slate-400">({n})</span>
            </span>
          );
        })}
        {miss.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block w-4 h-3 border border-slate-300"
              style={{ background: MISSING_FILL }}
            />
            데이터 없음 <span className="text-slate-400">({miss.length})</span>
          </span>
        )}
      </div>
    </div>
  );
}
