'use client';

import { useEffect, useState } from 'react';
import { NotebookPen, Send } from 'lucide-react';

type ARow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number | string;
  course_name: string;
  my_content?: string | null;
  my_submitted_at?: string | null;
  my_score?: number | string | null;
  my_feedback?: string | null;
  my_graded_at?: string | null;
  student_name?: string;
  score?: number | string | null;
  graded_at?: string | null;
};

export default function PortalAssignments() {
  const [rows, setRows] = useState<ARow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [role, setRole] = useState('');

  useEffect(() => {
    fetch('/api/learner/assignments').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
    fetch('/api/learner/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.role) setRole(d.role); }).catch(() => {});
  }, []);

  async function submit(a: ARow) {
    const content = (drafts[a.id] ?? '').trim();
    if (!content) { setError('اكتب إجابتك أولاً'); return; }
    setBusy(a.id); setError('');
    try {
      const r = await fetch('/api/learner/assignments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assignmentId: a.id, content }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'تعذر التسليم');
      setRows((p) => p.map((x) => x.id === a.id ? { ...x, my_content: content, my_submitted_at: new Date().toISOString(), my_score: null, my_feedback: null, my_graded_at: null } : x));
      setDrafts((p) => ({ ...p, [a.id]: '' }));
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر التسليم'); }
    finally { setBusy(''); }
  }

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-3 pt-6">
      <h1 className="text-xl font-extrabold mb-1">واجباتي</h1>
        {error && <div className="error">{error}</div>}
        {rows.length === 0 && <div className="bento-card p-8 text-center text-[color:var(--muted)]">لا واجبات بعد</div>}
        {rows.map((a) => {
          const graded = a.my_graded_at || a.graded_at;
          const submitted = a.my_submitted_at;
          const overdue = a.due_date && !submitted && new Date(a.due_date) < new Date();
          return (
            <div key={a.id + (a.student_name || '')} className="bento-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <b>{a.title}</b>
                  <div className="text-xs text-[color:var(--muted)] mt-1">
                    {a.course_name}{a.student_name ? ' — ' + a.student_name : ''}
                    {a.due_date ? ' · التسليم: ' + new Date(a.due_date).toLocaleDateString('ar-EG') : ''}
                    {' · من ' + a.max_score}
                  </div>
                </div>
                {graded ? (
                  <span className="badge success">مُصحح: {a.my_score ?? a.score}/{a.max_score}</span>
                ) : submitted ? (
                  <span className="badge pending">مُسلّم — بانتظار التصحيح</span>
                ) : overdue ? (
                  <span className="badge unpaid">فات التسليم</span>
                ) : (
                  <span className="badge">قيد الحل</span>
                )}
              </div>
              {a.description && <p className="text-sm text-[color:var(--muted)]">{a.description}</p>}
              {graded && a.my_feedback && <p className="text-sm p-3 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)]">ملاحظة المصحح: {a.my_feedback}</p>}
              {role === 'student' && (
                <div className="space-y-2">
                  {a.my_content && <p className="text-xs text-[color:var(--muted)]">آخر تسليم: {new Date(a.my_submitted_at!).toLocaleString('ar-EG')} {graded ? '(إعادة التسليم تُلغي الدرجة الحالية)' : ''}</p>}
                  <textarea
                    value={drafts[a.id] ?? ''}
                    onChange={(e) => setDrafts((p) => ({ ...p, [a.id]: e.target.value }))}
                    rows={3}
                    placeholder="اكتب إجابتك هنا..."
                    className="w-full"
                  />
                  <button onClick={() => submit(a)} disabled={busy === a.id || !(drafts[a.id] ?? '').trim()} className="primary !min-h-0 py-1.5 px-4 text-xs flex items-center gap-1">
                    <Send size={13} /> {busy === a.id ? 'جاري التسليم...' : submitted ? 'إعادة التسليم' : 'تسليم'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </main>
  );
}
