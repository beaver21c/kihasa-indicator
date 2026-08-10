/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans KR"', '"Malgun Gothic"', 'sans-serif'],
      },
      colors: {
        // KIHASA 브랜드 네이비(#1a4f8a)를 기준으로 구성한 단계 색.
        // 지표 리포트(BRAND 상수)와 GIS 지도분석 UI가 같은 계열을 공유한다.
        brand: {
          50: '#eff5fb',
          100: '#dbe8f6',
          200: '#c5d8f5',
          300: '#9dbde8',
          400: '#5a8ec6',
          500: '#2a6aa8',
          600: '#1f5a94',
          700: '#1a4f8a',
          800: '#163f6f',
          900: '#102d50',
        },
      },
    },
  },
  plugins: [],
};
