'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

type ARow = {
  id: string;
  exam_title: string;
  score: number | string | null;
  total: number | string | null;
  finished_at: string | null;
  student_name?: string;
};

export default function PortalResults() {
  const [rows, setRows] = useState<ARow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/attempts').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
  }, []);

  function pct(score: number | string | null, total: number | string | null): number | null {
    const s = Number(score); const t = Number(total);
    if (!Number.isFinite(s) || !Number.isFinite(t) || t <= 0) return null;
    return Math.round((s / t) * 100);
  }
  function pctColor(p: number | null): string {
    if (p === null) return 'text-[color:var(--muted)]';
    if (p >= 85) return 'text-[color:var(--success)]';
    if (p >= 60) return 'text-[color:var(--gold)]';
    return 'text-[color:var(--danger)]';
  }

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-2 pt-6">
      <h1 className="text-xl font-extrabold mb-1">نتائجي</h1>
        {error && <div className="error">{error}</div>}
        {rows.length === 0 && <div className="bento-card p-8 text-center text-[color:var(--muted)]">لا نتائج بعد — ابدأ بأول امتحان</div>}
        {rows.map((r) => {
          const p = pct(r.score, r.total);
          return (
            <div key={r.id} className="bento-card p-4 flex items-center justify-between gap-3">
              <div>
                <b>{r.exam_title}</b>
                {r.student_name ? <div className="text-xs text-[color:var(--muted)]">{r.student_name}</div> : null}
                <div className="text-xs text-[color:var(--muted)] mt-0.5">{r.finished_at ? new Date(r.finished_at).toLocaleString('ar-EG') : 'غير منتهية'}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ClipboardCheck size={16} className="text-[color:var(--muted)]" />
                <span className={'font-bold ' + pctColor(p)}>{r.score}/{r.total} {p !== null ? '(' + p + '%)' : ''}</span>
              </div>
            </div>
          );
        })}
      </main>
  );
}
