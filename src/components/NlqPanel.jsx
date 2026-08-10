import { useState } from 'react';
import { askFormula, clearKey, loadKey, saveKey } from '../utils/nlq';

/**
 * 자연어로 지표 만들기 (Gemini API · 이용자 본인 키)
 * 키를 넣지 않으면 이 기능만 비활성화되고 아래 수동 빌더는 정상 동작한다.
 */
export default function NlqPanel({ indicators, onApply }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(() => loadKey());
  const [persist, setPersist] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const run = async () => {
    setErr(null);
    setMsg(null);
    if (!key.trim()) {
      setErr('Gemini API 키를 입력할 것.');
      return;
    }
    if (!q.trim()) {
      setErr('만들고 싶은 지표를 문장으로 적을 것.');
      return;
    }
    setBusy(true);
    try {
      saveKey(key.trim(), persist);
      const r = await askFormula(key.trim(), q.trim(), indicators);
      onApply(r.def, r.desc);
      setMsg(
        `모델 ${r.model} 사용 · 산식 배치 완료.` +
          (r.warnings.length ? ` (${r.warnings.join(' / ')})` : '')
      );
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
      >
        <span className="text-sm font-bold text-slate-700">
          🤖 자연어로 지표 만들기 <span className="text-[11px] font-normal text-slate-400">(선택 · 본인 Gemini API 키)</span>
        </span>
        <span className={`text-slate-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            자연어 설명(예: “노인 천 명당 노인복지시설 수”)을 산식·가칭으로 옮겨 아래 슬롯에 자동 배치한다.
            AI는 산식 설계만 담당하고 계산·검증·시각화는 브라우저에서 수행하므로, 외부로 전송되는 것은
            질의문과 지표 목록(공개 메타)뿐이며 지표 값 데이터는 전송되지 않는다. 키는 HTTP 헤더로만 전달한다.
          </p>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Gemini API 키"
              className="flex-1 min-w-[220px] p-2 border border-slate-300 rounded-md text-sm"
              autoComplete="off"
            />
            <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={persist}
                onChange={(e) => setPersist(e.target.checked)}
                className="accent-[#1a4f8a]"
              />
              이 브라우저에 저장
            </label>
            <button
              onClick={() => {
                clearKey();
                setKey('');
                setPersist(false);
              }}
              className="px-2 py-1.5 text-[11px] rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              키 지우기
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            키 발급:{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              aistudio.google.com/app/apikey
            </a>{' '}
            · 저장 안 하면 탭을 닫을 때 삭제된다.
          </p>

          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !busy && run()}
              placeholder="예: 노인 천 명당 노인여가복지시설 수"
              className="flex-1 p-2 border border-slate-300 rounded-md text-sm"
            />
            <button
              onClick={run}
              disabled={busy}
              className="px-3 py-2 text-sm rounded-md bg-[#1a4f8a] text-white disabled:opacity-50 whitespace-nowrap"
            >
              {busy ? '생성 중…' : '산식 만들기'}
            </button>
          </div>

          {msg && (
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
              ✓ {msg}
            </div>
          )}
          {err && (
            <div className="p-2 rounded bg-red-50 border border-red-200 text-[11px] text-red-700">⚠ {err}</div>
          )}
        </div>
      )}
    </section>
  );
}
