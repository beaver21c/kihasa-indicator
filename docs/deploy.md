# 배포·운영 안내

## 1. 배포 시나리오

| 시나리오 | 사용 산출물 | 환경 제약 | 적합 사용처 |
|---|---|---|---|
| **GitHub Pages** | `dist/` (Actions 자동 배포) | 인터넷 | 외부 공개·정책 홍보 (기본) |
| 사내 정적서버 | `dist/` → IIS·nginx | 사내망 | 내부 담당자 공유 |
| **단일 HTML 더블클릭** | `dist-single/index_embedded.html` 파일 1개 | **없음** | 폐쇄망·USB·메일 첨부 |

## 2. GitHub Pages 자동 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml` 이 자동으로 빌드·배포한다.

1. `npm ci`
2. `npm run build` → `dist/`
3. `cp dist/index.html dist/404.html` — SPA 새로고침·딥링크 404 방지
4. `actions/upload-pages-artifact` → `actions/deploy-pages`

배포 후 약 1~3분 뒤 https://beaver21c.github.io/kihasa-indicator/ 에 반영된다.
Actions 탭에서 **Run workflow** 로 수동 실행도 가능하다.

최초 1회만 필요한 설정: **Settings → Pages → Source = GitHub Actions**.

> `vite.config.js` 의 `base` 는 `/kihasa-indicator/` 다. 저장소 이름을 바꾸면 이 값도 함께 바꿔야 한다.
> 라우팅은 `BrowserRouter` + `basename=import.meta.env.BASE_URL` 이므로 base만 맞추면 전 경로가 따라온다.

## 3. 폐쇄망 단일 HTML

```bash
npm run build:embedded
# → dist-single/index_embedded.html  (약 12MB)
```

이 파일 **1개만** 있으면 된다. 더블클릭하면 기본 브라우저에서 열리고, USB·메일 첨부로 배포할 수 있다.

동작 원리
- `SINGLE=1` 빌드는 `vite-plugin-singlefile` 로 JS·CSS·이미지를 HTML 안에 인라인한다.
- `scripts/embed-data.mjs` 가 `dist-single/data/**` 의 JSON·TopoJSON 전부를
  `window.__EMBEDDED_DATA__` 로 문서 첫 `<head>` 직후에 주입한다.
- `src/utils/dataLoader.js` 의 `fetchData()` 가 fetch보다 `__EMBEDDED_DATA__` 를 먼저 본다
  → `file://` 의 CORS 제약을 우회한다.
- `file://` 에서는 경로 라우팅이 동작하지 않으므로 이 빌드만 **HashRouter** 를 쓴다
  (`vite.config.js` 의 `__SINGLE_FILE__` 분기).

제약
- 웹폰트(Noto Sans KR)를 못 받아 시스템 글꼴(Malgun Gothic 등)로 대체된다.
- OSM 배경 타일을 못 받는다 → 지도 배경은 **“도형만”** 을 쓸 것.
- 그 외 지표 분석·단계구분도·지표 만들기·GIS 폴리곤·PNG 저장은 모두 정상 동작한다
  (Plotly 기본 지형 파일을 저장소에 동봉해 외부 CDN 의존을 제거했다).

## 4. 빌드 명령

```bash
npm run dev              # 개발 서버 (http://localhost:5173/kihasa-indicator/)
npm run build            # GitHub Pages 배포용 (dist/)
npm run preview          # 빌드 결과 미리보기
npm run build:single     # 단일 HTML (JS·CSS만 인라인, dist-single/index.html)
npm run build:embedded   # 단일 HTML + 데이터 인라인 (dist-single/index_embedded.html)
```

## 5. 데이터 갱신

| 데이터 | 갱신 방법 |
|---|---|
| `public/data/welfare_region.json`, `welfare_custom.json` | `rcssp_index` 의 `build_data.py` 로 재생성 → commit·push → Actions 자동 재배포 |
| `public/data/sigungu.json` (지표 지도 경계) | `python tools/build_geo.py public/data/map/sgg.topojson <regions.json> public/data/sigungu.json` (shapely 필요). 행정경계가 바뀌지 않으면 재생성 불필요 |
| `public/data/map/**` (GIS 경계·코드표) | 행정경계 갱신 시에만 교체. 출처·기준일은 `data_version.json` 에 기록되어 푸터·PNG 워터마크에 자동 반영 |
| `public/data/topojson/world_110m.json` | Plotly 기본 지형. 교체 불필요 |

> 원자료에는 **연도 키만 있고 내용이 빈 블록(`{}`)** 이 섞여 있다. 화면은 이를 결측으로 처리해
> 지표별로 가장 최근 유효 연도를 자동 사용하고 `○○○○년 값` 배지로 표시한다.
> 데이터 갱신 시 빈 블록이 줄었는지 함께 확인하면 좋다.

## 6. 갱신 후 점검

`tools/smoke-check.mjs` 로 전 화면·전 기능을 헤드리스 브라우저에서 한 번에 확인할 수 있다.
저장소 의존성이 아니라 선택 도구이므로 playwright를 따로 설치해야 한다.

```bash
npm run build
# dist/ 를 하위경로 /kihasa-indicator/ 로, SPA 폴백(404.html)과 함께 정적 서버로 띄운 뒤
npm i -D playwright && npx playwright install chromium
SMOKE_BASE=http://127.0.0.1:8199/kihasa-indicator/ node tools/smoke-check.mjs
```

외부 폰트·OSM 타일이 차단된 환경에서는 **“배경지도(OSM)” 항목만 실패**로 나오는 것이 정상이다.

## 7. 트러블슈팅

| 증상 | 원인·조치 |
|---|---|
| 배포 후 화면이 흰 화면 | `vite.config.js` 의 `base` 와 저장소 이름 불일치. base를 `/{repo}/` 로 맞출 것 |
| 새로고침·딥링크에서 404 | `dist/404.html` 누락. 워크플로의 `cp dist/index.html dist/404.html` 단계 확인 |
| 지도가 회색만 표시 | 데이터 미입력(=회색) 또는 해당 연도 시·군·구 값 없음. 화면 안내 문구 확인 |
| 단계구분도가 비어 보임 | 외부 CDN 차단 환경. 동봉한 `public/data/topojson/world_110m.json` 이 배포 산출물에 포함됐는지 확인 |
| 배경 지도만 안 나옴 | 외부 타일 서버 차단. “도형만” 모드 사용 |
| 반영이 늦음 | Actions 실행 1~3분 + Pages 캐시. 브라우저 강력 새로고침(Ctrl+F5) |
