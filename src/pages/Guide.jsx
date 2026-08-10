import { Link } from 'react-router-dom';
import { BRAND, CMP_OPTIONS, TYPE7_LABEL } from '../utils/constants';

/**
 * 전체 이용 안내 (/guide)
 * 화면 6종의 사용법·표시 옵션·유의사항을 한 곳에 정리한다.
 * 문서판은 docs/user-guide.md 에 동일 내용으로 유지한다.
 */

function Section({ id, emoji, title, to, children }) {
  return (
    <section id={id} className="scroll-mt-4 bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h2 className="text-base font-bold text-slate-800">
          <span className="mr-1.5">{emoji}</span>
          {title}
        </h2>
        {to && (
          <Link to={to} className="text-xs font-semibold text-[#1a4f8a] hover:underline">
            화면 열기 →
          </Link>
        )}
      </div>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Steps({ items }) {
  return (
    <ol className="list-decimal ml-5 space-y-0.5">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ol>
  );
}

function Table({ head, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-slate-500 border-b border-slate-200">
            {head.map((h) => (
              <th key={h} className="text-left py-1.5 pr-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-50 align-top">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-3 text-slate-700">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const NOTE = 'text-[12px] text-slate-500';

export default function Guide() {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="rounded-lg px-5 py-4 text-white" style={{ backgroundColor: BRAND }}>
        <h1 className="text-lg font-bold">📖 이용 안내</h1>
        <p className="text-xs text-blue-100 mt-1">
          지표 분석 5종과 GIS 지도분석 1종을 한 서비스에서 쓴다. 입력 데이터는 이용자 단말 안에서만
          처리되며 서버로 전송되지 않는다.
        </p>
      </div>

      {/* 목차 */}
      <nav className="bg-white rounded-lg border border-slate-200 px-5 py-3 text-sm">
        <span className="text-xs font-bold text-slate-500 mr-2">바로가기</span>
        {[
          ['common', '공통 개념'],
          ['region', '지역중심'],
          ['custom', '지역맞춤'],
          ['trend', '연도별 추이'],
          ['imap', '지표 지도'],
          ['builder', '지표 만들기'],
          ['gis', 'GIS 지도분석'],
          ['caution', '인용 시 유의'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="text-[#1a4f8a] hover:underline mr-3 text-xs">
            {label}
          </a>
        ))}
      </nav>

      <Section id="common" emoji="🧭" title="공통 개념">
        <Table
          head={['개념', '설명']}
          rows={[
            ['나의 지역', '시·도 → 시·군·구 순으로 고르는 분석 대상 1곳. 모든 화면에서 빨강(◆)으로 강조된다.'],
            ['비교집단', `우리 지역을 무엇과 비교할지. ${CMP_OPTIONS.map(([, l]) => l).join(' / ')}`],
            ['7대 유형', Object.values(TYPE7_LABEL).join(' · ')],
          ]}
        />
        <p className={NOTE}>
          비교집단 규모(n)는 각 화면에 표기되며, 해당 연도 결측 지역은 분모에서 제외된다.
        </p>
      </Section>

      <Section id="region" emoji="🏙️" title="지역중심 리포트" to="/region">
        <p>시·군·구 1곳을 고르면 19개 핵심 지표를 한 화면에 박스플롯으로 펼친다.</p>
        <Steps
          items={[
            '좌측에서 시·도 → 시·군·구 → 비교 기준 선택',
            '연도 선택',
            '지표별 위치 확인 후 PNG 저장',
          ]}
        />
        <Table
          head={['표시', '의미']}
          rows={[
            ['빨강 다이아몬드', '선택한 우리 지역 값'],
            ['파랑 점', '비교집단 평균'],
            ['연파랑 박스', 'Q1~Q3 (비교집단의 가운데 50%)'],
            ['회색 선', 'Min~Max'],
            ['하단 숫자열', 'Min · Q1 · 평균 · Q3 · Max · N'],
          ]}
        />
        <p className={NOTE}>
          영역 제목(인구·총괄·돌봄·건강·기타)을 누르면 접거나 펼칠 수 있다. 지표마다 생산 주기가 달라
          선택 연도에 값이 없으면 그보다 앞선 최근 연도 값을 자동으로 쓰고 <b>○○○○년 값</b> 배지를 붙인다.
        </p>
      </Section>

      <Section id="custom" emoji="🎯" title="지역맞춤 리포트" to="/custom">
        <p>254개 전체 지표 중 필요한 것만 최대 20개 골라 같은 방식으로 비교한다.</p>
        <Steps
          items={[
            '나의 지역·비교 기준 선택',
            '영역(시트)·연도·지표명 검색으로 목록 좁히기',
            '체크박스로 지표 선택 (상단 칩의 × 로 개별 해제)',
            'PNG 저장',
          ]}
        />
        <p className={NOTE}>
          일부 지표는 특정 연도에 시·도 단위 값만 제공된다. 이 경우 비교 분포도 시·도 집계 기준으로 대체된다.
        </p>
      </Section>

      <Section id="trend" emoji="📈" title="연도별 추이" to="/trend">
        <Table
          head={['모드', '구성', '언제 쓰나']}
          rows={[
            [
              '단일 지역 vs 비교집단',
              '우리 지역 실선 + 비교집단 평균 점선 + Q1~Q3 음영밴드',
              '집단 안에서의 상대 위치 변화',
            ],
            [
              '복수 지역 직접 비교',
              '최대 5개 지역을 고정 색으로 겹쳐 표시 (+ 전국 평균 기준선)',
              '인접·유사 지역과 직접 비교',
            ],
          ]}
        />
        <p>
          연도 범위 지정, 꺾은선·막대 전환, <b>그래프 값 표시</b>(점 위·막대 바깥에 숫자 표기)를 제공한다.
          값 표시를 켜면 <b>값 글자 크기 조절기(− 9 +)</b>가 나타난다(4~20pt). 글자를 키우면 차트 높이가
          자동으로 늘어나 라벨이 잘리지 않는다.
        </p>
        <p>
          지표 카드를 누르면 확대 모달이 열린다. 여기서 <b>두 번째 지표를 보조축(오른쪽 Y축)에 겹쳐</b> 보고,
          연도별 수치표를 확인할 수 있다.
        </p>
      </Section>

      <Section id="imap" emoji="🗾" title="지표 지도 (단계구분도)" to="/indicator-map">
        <p>지표 1개를 골라 전국 시·군·구를 계급색으로 칠한다.</p>
        <Table
          head={['그룹', '항목', '선택지']}
          rows={[
            ['범위·배경·라벨', '표시 범위', '나의 시·도(기본) / 전국'],
            ['', '배경', '도형만(기본) / 배경 지도(OpenStreetMap)'],
            ['', '라벨', '지역명+값(기본) / 지역명 / 값 / 없음, 글자 4~20pt'],
            ['색상·계급', '색상', '순차 9종 + 발산 2종 = 11종 (흑백 인쇄용 그레이 포함)'],
            ['', '분류 방식', '자연분류(Fisher–Jenks) / 등분위 / 등간격'],
            ['', '계급 수 · 반전', '4~7 계급, 색 방향 반전'],
            ['', '계급 기준', '전국 기준(기본, 지역 간 비교 유지) / 비교집단 기준(내부 대비 강조)'],
          ]}
        />
        <p>
          나의 지역은 굵은 빨강 테두리로 강조되고, 상단에 <b>값 · 전국 순위 · 비교집단 내 순위</b>(내림차순)가
          표시된다. 범례에는 계급 구간과 각 계급의 지역 수가 함께 나온다.
        </p>
        <p className={NOTE}>
          특정 지표는 해당 연도에 시·도 값만 있어 지도를 그릴 수 없다. 이때 목록에서 비활성화되고, 이미 선택된
          상태면 “시·군·구 값이 있는 연도”를 안내한다. 표시 범위를 전국으로 바꾸면 229개 라벨이 겹치므로
          글자를 5~6pt로 줄이거나 “값”만 표시하는 편이 읽기 쉽다. 배경 지도는 외부 타일 서버에 접속하므로
          내부망에서는 “도형만”을 쓸 것.
        </p>
      </Section>

      <Section id="builder" emoji="🧮" title="지표 만들기" to="/builder">
        <p>기존 지표에 없는 값을 직접 조합해 만든다. 산식은 한 가지 형태다.</p>
        <pre className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs overflow-x-auto">
값 = ( 분자 항목들의 합 ) ÷ ( 분모 항목 1개 ) × 단위조정 계수
        </pre>
        <p>분모를 비우면 분자 합산값 자체가 지표가 된다.</p>
        <Steps
          items={[
            '좌측 목록에서 항목을 드래그하거나 [분자] · [분모] 버튼으로 배치',
            '지표 가칭 입력, 단위조정 계수 선택 (×1 / ×100 / ×1,000 / ×1만 / ×10만)',
            '결과 확인 후 PNG 저장 또는 🔗 링크 복사',
          ]}
        />
        <p>
          배치하는 동안 <b>공통 가용 연도</b>(교집합), 최신 연도 기준 <b>평균·중앙값·범위·유효 지역 수</b>,
          <b> 데이터 없음 / 분모 0</b> 건수를 실시간으로 보여준다. 첫 항목을 고르면 공통 연도가 없는 항목은
          목록에서 자동 비활성화된다. 표시 자릿수가 길거나 너무 작으면 권장 계수를 경고로 안내한다(진행은 허용).
        </p>
        <p>
          산출물은 <b>연도별 추이</b>(Q1~Q3 밴드)와 <b>단계구분도</b>이며, 모든 산출물에
          “이용자 정의(비공식)” 표기와 산식이 자동 삽입된다.
          <b> 🔗 링크 복사</b>는 값이 아니라 <b>산식만</b> 주소에 담으므로, 받는 쪽에서 주소만 열면 같은 지표가
          재현되고 데이터가 갱신되면 자동으로 최신값이 된다.
        </p>
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
          <b>자연어로 지표 만들기(선택)</b> — 본인의 Gemini API 키를 넣으면 자연어 설명을 산식으로 옮겨
          자동 배치한다. AI는 산식 설계만 담당하고 계산·검증·시각화는 브라우저에서 로컬 수행하므로,
          외부로 전송되는 것은 <b>질의문과 지표 목록(공개 메타)뿐</b>이며 <b>지표 값 데이터는 전송하지 않는다</b>.
          키는 HTTP 헤더로만 전달하고 기본은 세션 저장(탭을 닫으면 삭제)이다. 키를 넣지 않으면 이 기능만
          비활성화되고 수동 빌더는 정상 동작한다.
        </div>
      </Section>

      <Section id="gis" emoji="🗺️" title="GIS 지도분석" to="/map">
        <p>
          내가 가진 통계값을 읍면동·시군구 지도에 칠하고 기관 위치를 함께 표시해 PNG로 내보낸다.
          화면 하단 진행 바에 현재 단계가 항상 표시된다.
        </p>
        <Table
          head={['단계', '내용']}
          rows={[
            [
              '① 보기 모드 · 지역',
              '전국→시군구(255) / 시도→읍면동 / 시군구→읍면동. 일반구가 있는 시는 “일반구 통합(시 단위)”로 한 번에 표시',
            ],
            [
              '② 데이터 입력',
              '엑셀 업로드(양식 다운로드 → 값만 입력 → 업로드, 매칭 성공·실패 표시) 또는 직접 입력. 미입력 지역은 회색, 음수 허용',
            ],
            [
              '③ 색상 설정',
              '팔레트 6종(YlOrRd·Blues·Greens·RdYlGn·Spectral·Viridis) × 분류 3종(등간격·분위수·자연단절) × 단계 3~7',
            ],
            [
              '④ 기관 위치 (선택)',
              '좌표 직접(WGS84 경위도) 또는 주소 지오코딩(V-World·카카오). 선택 지역 밖 기관은 표시되지 않음',
            ],
            [
              '⑤ PNG 내보내기',
              '해상도 1x/2x/3x. 타일 배경을 숨기고 흰 배경 + 폴리곤, 제목 박스·출처 워터마크·범례 자동 삽입',
            ],
          ]}
        />
        <p className={NOTE}>
          엑셀 양식의 지역코드 컬럼은 텍스트(@) 형식으로 지정되어 있다(앞자리 0 손실 방지). 값 컬럼만 입력할 것.
          매칭은 8자리 정확 매칭 → 4·7·9자리 자동 0 패딩 → 행안부 10자리 자동 변환 순으로 시도한다.
          매칭 실패율이 50%를 넘으면 보기 모드와 양식이 어긋난 경우가 대부분이다.
        </p>
      </Section>

      <Section id="caution" emoji="⚠️" title="보고서 인용 시 유의사항">
        <ul className="list-disc ml-5 space-y-1">
          <li>지도의 계급 구간은 분류 방식에 따라 달라진다. 인용 시 <b>분류 방식·계급 수를 병기</b>할 것.</li>
          <li>
            화면의 모든 “평균”은 시·군·구 <b>단순평균(unweighted)</b>이며 시·도 공식 소계값과 산출 방식이 다르다.
          </li>
          <li>비교집단 규모(n)는 화면에 표기되며, 해당 연도 결측 지역은 분모에서 제외된다.</li>
          <li>“지표 만들기” 산출물은 <b>이용자 정의(비공식)</b>이다. 인용 시 산식과 출처를 함께 밝힐 것.</li>
        </ul>
        <p className={NOTE}>
          인용 예 — 한국보건사회연구원. (2026). 지역사회보장 종합분석 플랫폼 [Web application].
          https://beaver21c.github.io/kihasa-indicator/
        </p>
      </Section>

      <p className="text-[11px] text-slate-400 px-1">
        내부망·오프라인 배포가 필요하면 단일 HTML 파일(<code>index_embedded.html</code>) 1개로 배포할 수 있다.
        이 환경에서는 웹폰트와 지도 배경 타일만 빠지고 나머지 기능은 모두 동작한다.
      </p>
    </div>
  );
}
