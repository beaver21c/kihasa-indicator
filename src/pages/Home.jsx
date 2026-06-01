import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { loadRegion } from '../utils/dataLoader';

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
      className="block bg-white rounded-xl border border-slate-200 p-6 hover:border-[#1a4f8a] hover:shadow-md transition group"
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#1a4f8a]">{title}</h3>
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
  const [m, setM] = useState({ region: '19', sido: '17', area: '229', years: '2015~2024' });
  useEffect(() => {
    loadRegion().then((r) => {
      setM({
        region: String(r.indicators.length),
        sido: String(r.sido_list.length),
        area: String(Object.keys(r.areas).length),
        years: '2015~2024',
      });
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        <EntryCard
          to="/region"
          emoji="🏙️"
          title="지역중심 리포트"
          desc="시·군·구 1곳 선택 → 19개 핵심 지표를 박스플롯으로 일괄 표시"
          points={['카테고리별(인구·총괄·돌봄·건강·기타) 그룹 표시', '연도 선택 시 19개 지표 동시 갱신', '전체 리포트 PNG 저장']}
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
          desc="2018~2024 연도별 추이를 지역·비교집단 기준으로 비교"
          points={['복수 지역(최대 5) 직접 비교 / 단일 vs 비교집단', '선·막대 전환, 지표별 Y축 자동 스케일', '카드 클릭 확대 + 두 지표 보조축 겹쳐보기']}
        />
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold text-slate-600 mb-3">데이터 현황</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="핵심 지표(지역중심)" value={m.region} sub="개" />
          <Metric label="전체 지표(지역맞춤)" value="254" sub="개" />
          <Metric label="분석 대상 시·군·구" value={m.area} sub="개" />
          <Metric label="수록 연도" value={m.years} />
        </div>
      </section>
    </div>
  );
}
