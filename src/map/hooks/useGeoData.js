import { useEffect, useState } from 'react';
import * as topojson from 'topojson-client';
import { loadJson } from '../../utils/dataLoader';

/**
 * TopoJSON 동적 로딩 + 캐싱 hook
 * path 는 base 상대 경로(예: 'data/map/sgg.topojson')
 */
const cache = new Map();

export function useGeoData(path, objectKey = null) {
  const [data, setData] = useState(() => cache.get(path) || null);
  const [loading, setLoading] = useState(!!path && !cache.has(path));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return;

    if (cache.has(path)) {
      setData(cache.get(path));
      setLoading(false);
      return;
    }

    let cancelled = false;
    // 새 경로를 받아올 때는 이전 경계를 즉시 비운다.
    // (남겨두면 새 지역 선택 직후 한 프레임 동안 이전 지역 폴리곤이 그대로 그려진다)
    setData(null);
    setLoading(true);
    setError(null);

    loadJson(path)
      .then((topo) => {
        if (cancelled) return;
        const key = objectKey || Object.keys(topo.objects)[0];
        const geo = topojson.feature(topo, topo.objects[key]);
        cache.set(path, geo);
        setData(geo);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('[useGeoData] 로딩 실패:', path, e);
        setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, objectKey]);

  return { data, loading, error };
}

export function loadCodeTable() {
  return loadJson('data/map/code_table.json');
}

export function loadDataVersion() {
  return loadJson('data/map/data_version.json');
}
