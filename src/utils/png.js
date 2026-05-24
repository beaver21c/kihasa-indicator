// 리포트 DOM 전체를 단일 PNG로 저장 (html-to-image)
import { toPng } from 'html-to-image';

export async function saveReportPng(node, filename = 'report.png') {
  if (!node) return;
  // Plotly SVG/Canvas 안정적 캡처를 위해 약간 대기
  await new Promise((r) => setTimeout(r, 150));
  const dataUrl = await toPng(node, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    cacheBust: true,
    style: { fontFamily: 'Noto Sans KR, sans-serif' },
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
