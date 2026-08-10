import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 빌드 모드
//  기본        → GitHub Pages 배포 (base = '/kihasa-indicator/')
//  SINGLE=1   → 폐쇄망·USB 배포용 단일 HTML (dist-single/), base = './'
//               scripts/embed-data.mjs 로 data/*.json 까지 인라인하면 더블클릭 실행 가능
const isSingle = process.env.SINGLE === '1';

export default defineConfig({
  plugins: [react(), ...(isSingle ? [viteSingleFile()] : [])],
  base: isSingle ? './' : '/kihasa-indicator/',
  define: {
    // 단일 HTML 빌드에서는 HashRouter를 써야 file:// 에서도 라우팅이 동작한다.
    __SINGLE_FILE__: JSON.stringify(isSingle),
  },
  build: {
    outDir: isSingle ? 'dist-single' : 'dist',
    sourcemap: false,
    // 단일 HTML은 모든 자산을 인라인, 일반 빌드는 큰 JSON을 별도 파일로 유지
    assetsInlineLimit: isSingle ? 100000000 : 0,
    chunkSizeWarningLimit: 4000, // plotly + leaflet 번들 특성 반영
    rollupOptions: isSingle
      ? { output: { inlineDynamicImports: true, manualChunks: undefined } }
      : {
          output: {
            manualChunks: {
              plotly: ['plotly.js-dist-min'],
              leaflet: ['leaflet', 'react-leaflet'],
              sheet: ['xlsx'],
            },
          },
        },
  },
  server: { port: 5173 },
});
