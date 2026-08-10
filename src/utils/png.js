// PNG 저장 유틸
//  - saveReportPng : 리포트 DOM 전체를 단일 PNG로 (html-to-image)
//  - savePlotPng   : Plotly 그래프 1개를 PNG로 (지도는 WebGL 캔버스가 섞이므로 Plotly 자체 출력 사용)
import { toPng } from 'html-to-image';
import { Plotly } from './plot';

function download(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function saveReportPng(node, filename = 'report.png') {
  if (!node) return;
  // Plotly SVG/Canvas 안정적 캡처를 위해 약간 대기
  await new Promise((r) => setTimeout(r, 150));
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* 폰트 준비 실패는 무시 */
    }
  }
  const dataUrl = await toPng(node, {
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    cacheBust: true,
    style: { fontFamily: 'Noto Sans KR, sans-serif' },
  });
  download(dataUrl, filename);
}

export async function savePlotPng(graphDiv, filename = 'map.png', scale = 2) {
  if (!graphDiv) throw new Error('그래프가 아직 준비되지 않았다.');
  const dataUrl = await Plotly.toImage(graphDiv, {
    format: 'png',
    scale,
    width: graphDiv.clientWidth || 1000,
    height: graphDiv.clientHeight || 620,
  });
  download(dataUrl, filename);
}
