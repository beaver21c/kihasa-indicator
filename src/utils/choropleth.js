// 단계구분도 공용 유틸 (지표 지도 · 지표 만들기 지도에서 공유)
// 색 램프 / 계급 분류(자연분류·등분위·등간격) / 폴리곤 무게중심·경계상자
import { MAP_PALETTES } from './constants';

/* ── 계급 분류 ─────────────────────────────────────────── */

// 오름차순 배열의 p분위수
export function quantileSorted(sorted, p) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

// Fisher–Jenks 자연분류 → 계급 상한 k개
export function jenksBreaks(vals, k) {
  const d = [...vals].sort((a, b) => a - b);
  const n = d.length;
  if (n <= k) return [...new Set(d)];
  const mat1 = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
  const mat2 = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
  for (let i = 1; i <= k; i++) {
    mat1[1][i] = 1;
    mat2[1][i] = 0;
    for (let j = 2; j <= n; j++) mat2[j][i] = Infinity;
  }
  for (let l = 2; l <= n; l++) {
    let s1 = 0;
    let s2 = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = d[i3 - 1];
      s2 += val * val;
      s1 += val;
      w++;
      const v = s2 - (s1 * s1) / w;
      const i4 = i3 - 1;
      if (i4 !== 0) {
        for (let j = 2; j <= k; j++) {
          if (mat2[l][j] >= v + mat2[i4][j - 1]) {
            mat1[l][j] = i3;
            mat2[l][j] = v + mat2[i4][j - 1];
          }
        }
      }
    }
    mat1[l][1] = 1;
    mat2[l][1] = s2 - (s1 * s1) / w;
  }
  const brk = Array(k + 1);
  brk[k] = d[n - 1];
  brk[0] = d[0];
  let cnt = n;
  for (let j = k; j >= 2; j--) {
    brk[j - 1] = d[mat1[cnt][j] - 2];
    cnt = mat1[cnt][j] - 1;
  }
  return brk.slice(1); // 상한 k개
}

// method: 'jenks' | 'quantile' | 'equal' → 계급 상한 배열
export function classBreaks(vals, method, k) {
  const d = [...vals].sort((a, b) => a - b);
  const n = d.length;
  if (!n) return [];
  if (new Set(d).size <= k) return [...new Set(d)];
  if (method === 'equal') {
    const mn = d[0];
    const mx = d[n - 1];
    const st = (mx - mn) / k;
    return Array.from({ length: k }, (_, i) => (i === k - 1 ? mx : mn + st * (i + 1)));
  }
  if (method === 'quantile') {
    return Array.from({ length: k }, (_, i) =>
      i === k - 1 ? d[n - 1] : quantileSorted(d, (i + 1) / k)
    );
  }
  return jenksBreaks(d, k);
}

// 값 → 계급 인덱스
export function classIdx(v, brk) {
  for (let i = 0; i < brk.length; i++) if (v <= brk[i]) return i;
  return brk.length - 1;
}

/* ── 색 램프 ───────────────────────────────────────────── */

export function rampColors(k, rev, key) {
  const p = MAP_PALETTES[key] || MAP_PALETTES.navy;
  const mix = (x, y, t) => x.map((s, j) => Math.round(s + (y[j] - s) * t));
  const arr = Array.from({ length: k }, (_, i) => {
    const t = k === 1 ? (p.m ? 0.5 : 1) : i / (k - 1);
    const c = p.m ? (t < 0.5 ? mix(p.a, p.m, t * 2) : mix(p.m, p.b, (t - 0.5) * 2)) : mix(p.a, p.b, t);
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  });
  return rev ? arr.reverse() : arr;
}

// 계급 색을 plotly 이산 colorscale(z=계급 인덱스)로 변환
export function discreteColorscale(cols) {
  return cols.flatMap((c, i) => [
    [i / cols.length, c],
    [(i + 1) / cols.length, c],
  ]);
}

// 배경색 밝기 → 라벨 글자색(어두운 칸은 흰 글씨)
export function lumOf(rgb) {
  const m = String(rgb).match(/\d+/g);
  return m ? 0.299 * +m[0] + 0.587 * +m[1] + 0.114 * +m[2] : 255;
}

export const labelColorOn = (fill) => (lumOf(fill) < 140 ? '#ffffff' : '#22303f');

/* ── 폴리곤 기하 ───────────────────────────────────────── */

const _cenCache = new Map();
const _bboxCache = new Map();

const featKey = (f) => String(f.id ?? f.properties?.code);

// 최대 링 기준 폴리곤 무게중심
export function featCentroid(f) {
  const id = featKey(f);
  if (_cenCache.has(id)) return _cenCache.get(id);
  const g = f.geometry || {};
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let best = null;
  let bestA = -1;
  for (const poly of polys) {
    const ring = poly && poly[0];
    if (!ring || ring.length < 3) continue;
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0, n = ring.length - 1; i < n; i++) {
      const p0 = ring[i];
      const p1 = ring[i + 1];
      const cr = p0[0] * p1[1] - p1[0] * p0[1];
      a += cr;
      cx += (p0[0] + p1[0]) * cr;
      cy += (p0[1] + p1[1]) * cr;
    }
    a *= 0.5;
    if (Math.abs(a) < 1e-12) continue;
    if (Math.abs(a) > bestA) {
      bestA = Math.abs(a);
      best = [cx / (6 * a), cy / (6 * a)];
    }
  }
  _cenCache.set(id, best);
  return best;
}

export function featBBox(f) {
  const id = featKey(f);
  if (_bboxCache.has(id)) return _bboxCache.get(id);
  const g = f.geometry || {};
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let b = null;
  for (const poly of polys) {
    for (const ring of poly) {
      for (const p of ring) {
        if (!b) b = [p[0], p[1], p[0], p[1]];
        else {
          if (p[0] < b[0]) b[0] = p[0];
          if (p[1] < b[1]) b[1] = p[1];
          if (p[0] > b[2]) b[2] = p[0];
          if (p[1] > b[3]) b[3] = p[1];
        }
      }
    }
  }
  _bboxCache.set(id, b);
  return b;
}

// 배경 지도(mapbox) 모드에서 쓸 중심·배율 (geo.fitbounds 대체)
export function mapboxView(geo, codes) {
  const by = new Map((geo?.features || []).map((f) => [featKey(f), f]));
  let b = null;
  codes.forEach((c) => {
    const f = by.get(String(c));
    if (!f) return;
    const x = featBBox(f);
    if (!x) return;
    if (!b) b = [...x];
    else {
      b[0] = Math.min(b[0], x[0]);
      b[1] = Math.min(b[1], x[1]);
      b[2] = Math.max(b[2], x[2]);
      b[3] = Math.max(b[3], x[3]);
    }
  });
  if (!b) return { center: { lon: 127.8, lat: 36.2 }, zoom: 6.2 };
  const w = Math.max(b[2] - b[0], 1e-4);
  const h = Math.max(b[3] - b[1], 1e-4);
  const z = Math.min(Math.log2(360 / w), Math.log2(170 / h)) - 0.35;
  return {
    center: { lon: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2 },
    zoom: Math.max(5.2, Math.min(11, z)),
  };
}
