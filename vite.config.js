import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/kihasa-indicator/',   // 리포명과 일치 (마지막 / 필수)
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,        // 큰 JSON은 별도 파일로
    chunkSizeWarningLimit: 2000, // plotly 번들 특성 반영
    rollupOptions: {
      output: {
        manualChunks: {
          plotly: ['plotly.js-dist-min'],   // plotly를 별도 청크로 분리(캐싱 최적화)
        },
      },
    },
  },
})
