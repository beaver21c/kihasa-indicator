// 공통 숫자 포맷 — 화면·라벨·표에서 동일한 자릿수 규칙을 쓴다.
export function fmt(v) {
  if (v == null || Number.isNaN(Number(v))) return '–';
  const n = Number(v);
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  if (abs >= 100) return n.toFixed(1);
  return n.toFixed(2);
}

// 단위를 덧붙인 표기 (라벨·툴팁용)
export function fmtUnit(v, unit) {
  const s = fmt(v);
  if (s === '–' || !unit) return s;
  return `${s}${unit}`;
}
