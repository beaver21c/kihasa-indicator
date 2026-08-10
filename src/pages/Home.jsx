import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadRegion } from '../utils/dataLoader';
import { BRAND } from '../utils/constants';

function Metric({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
      <div className="text-2xl font-bold text-[#1a4f8a]">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function EntryCard({ to, emoji, title, desc, points }) {
  return (
    <Link
      to={to}
      className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-[#1a4f8a] hover:shadow-md transition group"
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1a4f8a]">{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
      <ul className="mt-3 space-y-1 text-xs text-slate-500 list-disc list-inside">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div className="mt-4 text-sm font-semibold text-[#1a4f8a]">바로가기 →</div>
    </Link>
  );
}

export default function Home() {
  const [m, setM] = useState({ region: '19', area: '229', years: '2015~2024' });
  useEffect(() => {
    loadRegion()
      .then((r) => {
        setM({
          region: String(r.indicators.length),
          area: String(Object.keys(r.areas).length),
          years: '2015~2024',
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <section className="mt-4 rounded-lg border border-slate-200 bg-white px-5 py-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-700">통합 안내</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            「지역사회보장지표 종합분석 대시보드」와 「지역사회보장계획 수립을 위한 GIS분석(읍면동 코로플레스 맵)」을
            하나의 서비스로 통합했다. 지표 분석 5종과 GIS 지도분석 1종을 같은 화면 체계·같은 주소에서 사용한다.
          </p>
        </div>
        <Link
          to="/guide"
          className="shrink-0 px-3 py-2 rounded-md text-xs font-semibold text-white"
          style={{ backgroundColor: BRAND }}
        >
          📖 이용안내 보기
        </Link>
      </section>

      <section className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <EntryCard
          to="/region"
          emoji="🏙️"
          title="지역중심 리포트"
          desc="시·군·구 1곳 선택 → 핵심 지표를 박스플롯으로 일괄 표시"
          points={[
            '카테고리별(인구·총괄·돌봄·건강·기타) 그룹 접기',
            '연도 선택 시 전체 지표 동시 갱신',
            '전체 리포트 PNG 저장',
          ]}
        />
        <EntryCard
          to="/custom"
          emoji="🎯"
          title="지역맞춤 리포트"
          desc="254개 전체 지표 중 최대 20개를 직접 선택해 비교"
          points={['영역·연도·지표명 검색 필터', '체크박스 다중 선택(최대 20개)', '선택 구성 그대로 PNG 저장']}
        />
        <EntryCard
          to="/trend"
          emoji="📈"
          title="연도별 추이"
          desc="연도 구간을 정해 지역·비교집단 추이를 비교"
          points={[
            '복수 지역(최대 5) 직접 비교 / 단일 vs 비교집단',
            '선·막대 전환, 그래프 값 표시(글자 크기 조절)',
            '카드 클릭 확대 + 두 지표 보조축 겹쳐보기',
          ]}
        />
        <EntryCard
          to="/indicator-map"
          emoji="🗾"
          title="지표 지도 (단계구분도)"
          desc="지표 1개를 골라 전국 시·군·구를 계급색으로 표시"
          points={[
            '색상 11종 · 분류 3종 · 계급 4~7 · 색 반전',
            '표시 범위(나의 시·도/전국) · 배경(도형만/OSM) · 라벨 4종',
            '나의 지역 강조 + 전국·비교집단 순위 표기',
          ]}
        />
        <EntryCard
          to="/builder"
          emoji="🧮"
          title="지표 만들기"
          desc="분자·분모를 조합해 나만의 지표를 만들고 검증"
          points={[
            '분자 복수 합산 + 분모 + 단위조정 계수',
            '공통 가용 연도·평균·중앙값·결측 실시간 표시',
            '추이·단계구분도 산출 + 산식 링크 공유',
          ]}
        />
        <EntryCard
          to="/map"
          emoji="🗺️"
          title="GIS 지도분석"
          desc="내 데이터를 올려 읍면동·시군구 코로플레스 맵 제작"
          points={[
            '보기 모드 3종 · 엑셀 업로드/직접 입력',
            '팔레트 6종 × 분류 3종 × 단계 3~7',
            '기관 위치 표시(좌표·주소 지오코딩) + PNG 내보내기',
          ]}
        />
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold text-slate-600 mb-3">데이터 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="핵심 지표(지역중심)" value={m.region} sub="개" />
          <Metric label="전체 지표(지역맞춤·만들기)" value="254" sub="개" />
          <Metric label="분석 대상 시·군·구" value={m.area} sub="개" />
          <Metric label="행정동 경계(GIS)" value="3,558" sub="개 읍면동" />
        </div>
      </section>
    </div>
  );
}
