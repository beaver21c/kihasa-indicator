# 지역사회보장 종합분석 플랫폼 (kihasa-indicator)

지역사회보장지표 분석과 지역사회보장계획 GIS 분석을 **하나의 정적 웹서비스로 통합**한 대시보드.
한국보건사회연구원(KIHASA)에서 제공하며, 별도 설치 없이 브라우저에서 동작한다.

> **통합 안내(2026-08)** — 기존 `rcssp_map`(지역사회보장계획 수립을 위한 GIS분석) 저장소의 기능 전부를
> 이 저장소로 이관하고, `kihasa-indicator-new`(개편 대시보드)의 지표 기능(단계구분도·지표 만들기·
> 자연어 지표 생성·표시 옵션)을 이식했다. `rcssp_map`은 더 이상 유지하지 않아도 된다.
> 이관 대조표는 [`docs/integration.md`](docs/integration.md) 참조.

## 문서

| 문서 | 내용 |
|---|---|
| [`docs/user-guide.md`](docs/user-guide.md) | **이용 안내서** — 화면 6종 사용법·표시 옵션·엑셀 양식 가이드·FAQ (서비스 안 `이용안내` 메뉴와 동일 내용) |
| [`docs/deploy.md`](docs/deploy.md) | 배포·운영 안내 — GitHub Pages, 폐쇄망 단일 HTML, 데이터 갱신, 트러블슈팅 |
| [`docs/integration.md`](docs/integration.md) | 통합 이관 대조표 — rcssp_map 항목별 이관 위치, 이관 제외 항목과 사유 |
| [`docs/trend-plan.md`](docs/trend-plan.md) | (기록 보존) 연도별 추이 화면 기획 문서 |

## 접속 URL

- 공개 URL: https://beaver21c.github.io/kihasa-indicator/
- 폐쇄망·USB 배포: `dist-single/index_embedded.html` 단일 파일 (더블클릭 실행, 인터넷 불필요)

## 화면 구성 (분석 6종 + 이용안내)

| 경로 | 화면 | 내용 |
|------|------|------|
| `/region` | **지역중심 리포트** | 시·군·구 1곳 → 19개 핵심 지표 박스플롯 일괄 표시. 영역 그룹 접기, 지표별 최신 연도 자동 대체(연도 배지), 리포트 PNG 저장 |
| `/custom` | **지역맞춤 리포트** | 254개 전체 지표 중 최대 20개 선택 비교. 영역·연도·지표명 필터, PNG 저장 |
| `/trend` | **연도별 추이** | 복수 지역(최대 5) 직접 비교 / 단일 지역 vs 비교집단(Q1~Q3 밴드). 선·막대 전환, 전국 평균 기준선, 그래프 값 표시(글자 크기 조절), 카드 확대 + 보조축 겹쳐보기 + 연도별 수치표 |
| `/indicator-map` | **지표 지도(단계구분도)** | 지표 1개 → 전국 시·군·구 계급색. 색상 11종·분류 3종·계급 4~7·색 반전·계급기준 2종, 표시 범위 2종, 배경 2종, 라벨 4종 + 글자 크기, 나의 지역 강조, 전국·비교집단 순위, PNG 저장 |
| `/builder` | **지표 만들기** | 분자(복수 합산)÷분모×계수로 이용자 정의 지표 생성. 공통 가용 연도·평균·중앙값·결측 실시간 표시, 자릿수 경고, 추이·단계구분도 산출, 산식 링크 공유, 자연어 생성(Gemini, 선택) |
| `/map` | **GIS 지도분석** | 내 데이터를 올려 만드는 읍면동·시군구 코로플레스 맵. 보기 모드 3종, 엑셀 업로드/직접 입력, 팔레트 6종×분류 3종×단계 3~7, 기관 위치 표시(좌표·주소 지오코딩), PNG 내보내기 |
| `/guide` | **이용안내** | 화면 6종 사용법·표시 옵션·유의사항을 서비스 안에서 바로 확인 ([`docs/user-guide.md`](docs/user-guide.md)와 동일 내용) |

공통 비교 기준 3종: 광역(시·도) 내 / 시·군·구 7대 유형별 / 전국.

## 기술 스택

- Vite 5 + React 18 + React Router 6 (라우트 단위 코드 분할)
- TailwindCSS 3 (Noto Sans KR / Malgun Gothic 대체)
- Plotly.js — 박스플롯·추이·단계구분도
- Leaflet + react-leaflet — GIS 지도분석
- xlsx(SheetJS) — 엑셀 양식 생성·업로드 파싱
- zustand — GIS 화면 상태
- GitHub Pages + GitHub Actions 자동 배포

## 로컬 실행

```bash
npm install
npm run dev              # http://localhost:5173/kihasa-indicator/
npm run build            # dist/ (GitHub Pages 배포용)
npm run preview          # 빌드 결과 미리보기
npm run build:embedded   # dist-single/index_embedded.html (폐쇄망 단일 HTML)
```

### 폐쇄망 단일 HTML

`npm run build:embedded` 는 앱 번들과 `public/data/**` 전체를 한 파일에 인라인해
`dist-single/index_embedded.html`(약 12MB)을 만든다. 파일 1개만 있으면 되고, 더블클릭하면
기본 브라우저에서 열린다.

- 단일 HTML 빌드는 `file://` 에서도 라우팅되도록 HashRouter를 쓴다(`__SINGLE_FILE__` 분기).
- 데이터는 `window.__EMBEDDED_DATA__` 로 인라인되며, `src/utils/dataLoader.js` 가 fetch보다 먼저 참조한다.
- 인터넷이 없으면 웹폰트(Noto Sans KR)와 OSM 배경 타일만 빠지고 나머지 기능은 모두 동작한다.
  지도 배경은 “도형만” 모드를 사용할 것.

## 데이터

| 파일 | 용도 |
|------|------|
| `public/data/welfare_region.json` | 지역중심·연도별 추이 (19개 핵심 지표, 사전 계산 통계 포함) |
| `public/data/welfare_custom.json` | 지역맞춤·지표 지도·지표 만들기 (254개 전체 지표 원시값) |
| `public/data/sigungu.json` | 지표 단계구분도용 시·군·구 경계 229개 (지표 지역코드 체계) |
| `public/data/topojson/world_110m.json` | Plotly geo 기본 지형 (외부 CDN 대신 동봉 — 내부망 대응) |
| `public/data/map/code_table.json` | GIS 지도분석 지역코드 테이블 (시도 17 / 시군구 255 / 읍면동 3,558) |
| `public/data/map/data_version.json` | 경계 데이터 출처·기준일 메타 |
| `public/data/map/sido.topojson`, `sgg.topojson`, `emd/{시도코드}.topojson` | GIS 지도분석 행정경계 |

### 갱신 방법

- 지표 데이터(`welfare_*.json`): `rcssp_index` 의 `build_data.py` 로 재생성 후 commit·push → Actions 자동 재배포
- 시·군·구 경계(`sigungu.json`): `python tools/build_geo.py public/data/map/sgg.topojson <regions.json> public/data/sigungu.json`
  (shapely 필요. 행정경계가 바뀌지 않으면 재생성 불필요)

> 원자료에는 연도 키만 있고 내용이 빈 블록(`{}`)이 섞여 있다. 화면은 이를 결측으로 처리해
> 지표별로 가장 최근 유효 연도를 자동 사용하고 “○○○○년 값” 배지로 표시한다.

## 자연어 지표 생성(Gemini) 안내

“지표 만들기” 화면 상단의 선택 기능이다. 이용자 본인의 Gemini API 키를 입력하면 자연어 설명을
산식으로 옮겨 슬롯에 자동 배치한다.

- AI는 **산식 설계만** 담당하고 계산·검증·시각화는 브라우저에서 로컬 수행한다.
- 외부로 전송되는 것은 **질의문과 지표 목록(공개 메타)뿐**이며 지표 값 데이터는 전송하지 않는다.
- 키는 HTTP 헤더(`x-goog-api-key`)로만 전달해 주소창·리퍼러·프록시 로그에 남지 않는다.
- 키는 기본 세션 저장(탭을 닫으면 삭제), “이 브라우저에 저장”을 켠 경우에만 유지된다.
- 키를 넣지 않으면 이 기능만 비활성화되고 수동 빌더는 정상 동작한다(내부망 배포 시 자연 축소).

## 산출 방식 유의사항

- 지도의 계급 구간은 분류 방식에 따라 달라지므로 보고서 인용 시 **분류 방식·계급 수를 병기**할 것.
- 화면의 모든 “평균”은 시·군·구 **단순평균(unweighted)** 이며 시·도 공식 소계값과 산출 방식이 다르다.
- 비교집단 규모(n)는 화면에 표기되며, 해당 연도 결측 지역은 분모에서 제외된다.
- “지표 만들기” 산출물은 **이용자 정의(비공식)** 이다. 인용 시 산식과 출처를 반드시 병기할 것.

## 데이터 출처 및 라이선스

- 지표 원자료: 보건복지부·한국보건사회연구원,「지역사회보장지표」 / 운영: 지역사회보장균형발전지원센터
- 행정경계: [vuski/admdongkor](https://github.com/vuski/admdongkor) 저장소가 공개·관리하는 행정동 경계 데이터.
  자유 이용(출처 표기). 데이터 제공자께 깊이 감사드림.
  - 행정경계 기준일 2026-04-01(ver20260401) · 추출 commit e24f80c · 변환 mapshaper 0.7.3(simplify 12%)
  - 좌표계 WGS84(EPSG:4326) · 통계청 8자리 `adm_cd` 기준 + 행안부 10자리 `adm_cd2` 보조
- 출처 표기는 푸터 상시 노출 + GIS PNG 워터마크로 자동 삽입된다.
