# 통합 이관 대조표 (rcssp_map · kihasa-indicator-new → kihasa-indicator)

`rcssp_map` 저장소를 폐기해도 기능 손실이 없도록, 이관 항목을 1:1로 대조한 문서다.
`kihasa-indicator-new`(개편 대시보드)에서 참고해 새로 구현한 항목도 함께 정리한다.

---

## 1. rcssp_map → `/map` (GIS 지도분석) 전량 이관

| rcssp_map 원본 | 통합본 위치 | 상태 |
|---|---|---|
| `src/App.jsx` (헤더·패널·지도 레이아웃) | `src/pages/MapAnalysis.jsx` | 공통 헤더/푸터 안쪽 전체높이 레이아웃으로 재구성 |
| `src/components/MapView.jsx` | `src/map/components/MapView.jsx` | 데이터 경로만 `data/map/**` 로 변경 + 경계 갱신 버그 수정 |
| `src/components/ControlPanel.jsx` | `src/map/components/ControlPanel.jsx` | 그대로 |
| `src/components/ColorSettings.jsx` | `src/map/components/ColorSettings.jsx` | 그대로 (팔레트 6종 · 분류 3종 · 단계 3~7) |
| `src/components/DirectInput.jsx` | `src/map/components/DirectInput.jsx` | 그대로 |
| `src/components/ExcelUpload.jsx` | `src/map/components/ExcelUpload.jsx` | 그대로 (양식 다운로드 · 매칭 통계 · 실패율 경고) |
| `src/components/InstitutionUpload.jsx` | `src/map/components/InstitutionUpload.jsx` | 그대로 (WGS84 좌표 업로드) |
| `src/components/GeocodeUpload.jsx` | `src/map/components/GeocodeUpload.jsx` | 그대로 (V-World·카카오 주소 지오코딩) |
| `src/components/ExportButton.jsx` | `src/map/components/ExportButton.jsx` | 그대로 (클린 PNG · 1x/2x/3x · 제목박스 · 워터마크 · 범례) |
| `src/components/ResetButton.jsx` | `src/map/components/ResetButton.jsx` | 그대로 |
| `src/components/Legend.jsx` | `src/map/components/Legend.jsx` | 그대로 |
| `src/components/ServiceGuide.jsx` | `src/map/components/ServiceGuide.jsx` | GIS 화면 전용 가이드로 문구 조정 + `/guide` 안내 링크 추가 |
| `src/components/UsageGuide.jsx` | `src/map/components/UsageGuide.jsx` | 그대로 (①~⑤ 진행 단계 바) |
| `src/components/ErrorBoundary.jsx` | `src/map/components/ErrorBoundary.jsx` | 그대로 |
| `src/hooks/useGeoData.js` | `src/map/hooks/useGeoData.js` | 공통 `dataLoader` 사용 + 경로 변경 + 로딩 시 이전 경계 비움 |
| `src/hooks/useColorScale.js` | `src/map/hooks/useColorScale.js` | 그대로 (등간격·분위수·Jenks) |
| `src/utils/{codeTable,excelTemplate,geoUtils,geocoder,mapStyles,_meta}.js` | `src/map/utils/**` | 그대로 |
| `src/store.js` | `src/map/store.js` | 그대로 (zustand) |
| `src/index.css` 의 지도 전용 규칙 | `src/map/map.css` | 지도 화면에서만 import (전역 오염 방지) |
| `index.html` 의 leaflet CSS(CDN) | `src/map/components/MapView.jsx` 의 `import 'leaflet/dist/leaflet.css'` | 번들 포함으로 변경 → 오프라인 동작 |
| `public/data/**` (경계·코드표) | `public/data/map/**` | 이름 충돌 없이 네임스페이스 분리 |
| `scripts/embed-data.mjs` | `scripts/embed-data.mjs` | 통합본 전체 데이터 인라인으로 확장 + 삽입 위치 버그 수정 |
| `npm run build:single` / `build:embedded` | 동일 | 유지 |
| 푸터 경계데이터 출처 표기 | `src/components/Footer.jsx` | **전 화면 상시 노출**로 격상 |

### 이관하지 않은 것

| 항목 | 사유 |
|---|---|
| `dist-single/` (약 9.7MB 빌드 산출물) | 빌드 산출물. `npm run build:embedded` 로 언제든 재생성 |
| `public/templates/*.xlsx` (`~$` 잠금 파일 포함) | 코드에서 참조되지 않는 잔여 파일. 양식은 `excelTemplate.js` 가 실행 시 생성 |
| `__perm_test.txt` | 권한 테스트용 잔여 파일 |
| `PHASE*_REPORT.md`, `REQUESTS_HISTORY.md`, `REVISION_REPORT.md` | 개발 이력 문서. 서비스 동작과 무관 |
| `DEPLOY_GUIDE.md`, `DEPLOY_VERIFY_CHECKLIST.md` | 최초 저장소 생성·PAT 발급 등 1회성 절차. 필요한 운영 내용은 [`deploy.md`](deploy.md)로 재작성 |

### 이관 중 수정한 결함 (rcssp_map 원본에도 존재)

1. **지역 변경 시 이전 경계가 남는 문제** — `react-leaflet`의 `GeoJSON`은 `data` 변경을 반영하지 않아
   `key`로 재생성하는데, 경계 데이터가 비동기로 도착하므로 `key`가 먼저 바뀌고 이전 경계로 마운트된 뒤
   새 데이터가 와도 다시 그려지지 않았다. (예: 전국 시군구 → 서울 읍면동으로 바꿔도 시군구 255개가 그대로 표시)
   → `key`에 피처 수를 포함하고, 새 경로 로딩 시작 시 이전 경계를 비우도록 수정.
2. **단일 HTML 데이터 인라인 위치 오류** — `embed-data.mjs` 가 첫 `</head>` 앞에 삽입했는데, 인라인된
   xlsx 번들 문자열 안의 `</head>` 가 먼저 잡혀 번들이 깨졌다. → 문서의 첫 `<head>` 직후 삽입으로 변경.

---

## 2. kihasa-indicator-new 참고 → 신규 구현

| 개편본 기능 | 통합본 구현 | 비고 |
|---|---|---|
| 지역별 현황 지도(단계구분도) | `/indicator-map` (`src/pages/IndicatorMap.jsx`, `src/components/ChoroplethMap.jsx`) | 색상 11종·분류 3종(Fisher–Jenks/등분위/등간격)·계급 4~7·색 반전·계급기준 2종·범위 2종·배경 2종·라벨 4종·순위 표기·PNG |
| 데이터 기반 신규지표 생성 | `/builder` (`src/pages/IndicatorBuilder.jsx`, `src/utils/builder.js`) | 분자 복수 합산 + 분모 + 계수 5종, 공통 연도 교집합, 실시간 요약(평균·중앙값·범위·결측·분모0), 자릿수 경고, 드래그/버튼 배치, 산식 링크 공유 |
| 자연어로 지표 만들기 | `src/components/NlqPanel.jsx`, `src/utils/nlq.js` | Gemini, 헤더 전달, 모델 자동 선택·429/404 폴백, 미존재 코드 자동 제외, 세션 저장 기본 |
| 그래프 값 표시 | `TrendChart` `showValues` + `/trend`·`/builder` 토글 | 막대는 바깥, 꺾은선은 점 위. 밴드 등 보조 도형 제외 |
| 라벨 글자 크기 조절(4~20pt, 0.5pt) | `src/components/FontStepper.jsx` | 지도 라벨·그래프 값에 각각 적용, 상·하한에서 버튼 비활성 |
| 영역 그룹 접기 | `/region` 카테고리 헤더 클릭 | |
| 지표별 최신값 + 연도 배지 | `pickYearBlock` + `IndicatorRow` 배지 | 생산 주기 차이(2024·2023 혼재) 대응 |
| 계급 구간·단순평균 주의 문구 | 각 화면 하단 주석 | |
| 서비스 전체 이용 안내 | `/guide` (`src/pages/Guide.jsx`) + [`user-guide.md`](user-guide.md) | rcssp_map README의 사용 방법·엑셀 양식 가이드·FAQ를 흡수해 6종 화면 기준으로 재작성 |
| Plotly 기본 지형 CDN 의존 제거 | `public/data/topojson/world_110m.json` 동봉 + `PlotlyGeoAssets` 사전 주입 | 내부망·`file://` 에서도 단계구분도 렌더 |

### 이식하지 않은 것

- 개편본의 **데이터셋 자체**(187개 시계열, 2015~2025, `catalog.json`/`series/*.json`)는 가져오지 않았다.
  통합본은 기존 `welfare_region.json`(19개) · `welfare_custom.json`(254개)을 계속 쓴다.
  지역코드 체계가 동일(시군구 5자리)하므로, 원하면 후속 작업으로 데이터만 교체 가능하다.
- Streamlit 셸(`streamlit_app.py`)은 통합본이 GitHub Pages 정적 배포이므로 불필요.

---

## 3. 통합 후 경로 변경 요약

| 이전 | 이후 |
|---|---|
| `https://beaver21c.github.io/rcssp_map/` | `https://beaver21c.github.io/kihasa-indicator/map` |
| `rcssp_map` 단일 HTML | `npm run build:embedded` → `dist-single/index_embedded.html` (지표 기능 포함) |
| rcssp_map README의 사용 설명·FAQ | [`user-guide.md`](user-guide.md) 6~8장 + 서비스 안 `이용안내` 화면 |
| rcssp_map `DEPLOY_GUIDE.md` | [`deploy.md`](deploy.md) |
