# 지역사회보장지표 종합분석 대시보드 (kihasa-indicator)

「2024년도 지역사회보장지표」를 시·군·구 단위로 비교·시각화하는 정적 웹 대시보드.
한국보건사회연구원(KIHASA)의 `rcssp_index`(Python/Streamlit) 기능을 React로 재구현하여
GitHub Pages에 배포한다. 동일 기관 서비스인 `rcssp_map`과 운영·디자인 체계를 통일한다.

## 접속 URL

- 공개 URL: https://beaver21c.github.io/kihasa-indicator/

## 주요 기능

- **지역중심 리포트** (`/region`): 시·군·구 1곳 선택 → 19개 핵심 지표를 카테고리별 박스플롯으로 일괄 표시
- **지역맞춤 리포트** (`/custom`): 254개 전체 지표 중 최대 20개를 직접 선택해 비교
- 비교 기준 3종: 광역(시·도) 내 / 7대 유형별 / 전국
- 박스플롯: Min~Max(위스커) · Q1~Q3(IQR) · 비교평균(파랑) · 선택지역(빨강 다이아몬드)
- 전체 리포트 PNG 저장

## 기술 스택

- Vite 5 + React 18 + React Router 6
- TailwindCSS 3 (Noto Sans KR)
- Plotly.js (react-plotly.js, plotly.js-dist-min)
- GitHub Pages + GitHub Actions 자동 배포

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173/kihasa-indicator/
npm run build    # dist/ 생성
npm run preview  # 빌드 결과 미리보기
```

## 데이터

- `public/data/welfare_region.json` (지역중심, 19개 핵심 지표, 사전 계산 통계 포함)
- `public/data/welfare_custom.json` (지역맞춤, 254개 전체 지표 원시값)
- 신규 연도 갱신 시: `rcssp_index`의 `build_data.py`로 두 JSON 재생성 후 commit·push → Actions가 자동 재배포

## 데이터 출처

- 원자료: 보건복지부·한국보건사회연구원,「2024년도 지역사회보장지표」
- 운영기관: 지역사회보장균형발전지원센터
- 이용약관: 공공데이터 자유이용(공공누리 제1유형) 가정
