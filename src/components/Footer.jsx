import { useEffect, useState } from 'react';
import { loadDataVersion } from '../map/hooks/useGeoData';

/**
 * 통합 푸터.
 * 지표 자료 출처와 행정경계 자료 출처(vuski/admdongkor)를 상시 노출한다.
 * 경계 데이터 라이선스가 출처 표기를 요구하므로 지도 화면 밖에서도 항상 표시한다.
 */
export default function Footer() {
  const [ver, setVer] = useState(null);

  useEffect(() => {
    let alive = true;
    loadDataVersion()
      .then((v) => alive && setVer(v))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <footer className="mt-6 py-3 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
      <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between gap-x-6 gap-y-1">
        <div>
          <span className="text-slate-700 font-medium">
            본 서비스는 한국보건사회연구원(KIHASA)에서 제공.
          </span>{' '}
          지표 원자료: 보건복지부·한국보건사회연구원,「지역사회보장지표」 · 운영: 지역사회보장균형발전지원센터
        </div>
        <div>
          경계 데이터:{' '}
          <a
            href="https://github.com/vuski/admdongkor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-700 hover:underline"
          >
            vuski/admdongkor
          </a>{' '}
          저장소가 공개·관리하는 행정동 경계 자료를 활용함. 데이터 제공자께 감사를 표함.
          {ver && (
            <span className="text-slate-400">
              {' '}
              · 기준일 {ver.admin_boundary_base} · 변환 {ver.extracted_date}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
