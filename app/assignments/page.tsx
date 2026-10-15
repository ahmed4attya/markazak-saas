'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Shell from '@/components/Shell';

type ARow = {
  id: string; title: string; description: string | null; due_date: string | null; max_score: number | string;
  course_id: string; course_name: string | null; group_name: string | null;
  submitted_count: number; graded_count: number;
};
type SubRow = { id: string; student_id: string; student_name: string; student_no: string; content: string | null; submitted_at: string | null; score: number | string | null; feedback: string | null; graded_at: string | null };

const EMPTY = { title: '', courseId: '', groupId: '', description: '', dueDate: '', maxScore: 100 };

export default function Assignments() {
  const [rows, setRows] = useState<ARow[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string; course_id: string }[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState<typeof EMPTY>({ ...EMPTY });
  const [openId, setOpenId] = useState('');
  const [subs, setSubs] = useState<Record<string, SubRow[]>>({});
  const [gradeDraft, setGradeDraft] = useState<Record<string, { score: string; feedback: string }>>({});

  const load = useCallback(async () => {
    const r = await fetch('/api/assignments');
    if (r.ok) setRows(await r.json()); else setError('تعذر تحميل الواجبات');
  }, []);

  useEffect(() => { load().catch(() => setError('تعذر التحميل')); }, [load]);
  useEffect(() => {
    fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setCourses(d); }).catch(() => {});
    fetch('/api/groups').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setGroups(d); }).catch(() => {});
  }, []);

  async function onCreate() {
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/assignments', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: f.title, courseId: f.courseId || null, groupId: f.groupId || null, description: f.description, dueDate: f.dueDate || null, maxScore: Number(f.maxScore) || 100 }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'فشل الإنشاء');
      setOk('تم إنشاء الواجب'); setF({ ...EMPTY }); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل الإنشاء'); }
    finally { setBusy(false); }
  }

  async function onDelete(row: ARow) {
    if (!window.confirm('حذف الواجب وكل تسليماته؟')) return;
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/assignments/' + row.id, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'فشل الحذف'); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل الحذف'); }
    finally { setBusy(false); }
  }

  async function toggleSubs(row: ARow) {
    if (openId === row.id) { setOpenId(''); return; }
    setOpenId(row.id);
    try {
      const r = await fetch('/api/assignments/' + row.id);
      if (r.ok) { const j = await r.json(); setSubs((p) => ({ ...p, [row.id]: j.submissions || [] })); }
    } catch { setError('تعذر تحميل التسليمات'); }
  }

  async function saveGrade(assignmentId: string, sub: SubRow) {
    const draft = gradeDraft[sub.id];
    const score = Number(draft?.score ?? sub.score ?? NaN);
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/assignments/' + assignmentId + '/grade', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studentId: sub.student_id, score, feedback: draft?.feedback ?? sub.feedback ?? '' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'فشل حفظ الدرجة');
      setOk('تم حفظ الدرجة');
      const rr = await fetch('/api/assignments/' + assignmentId);
      if (rr.ok) { const jj = await rr.json(); setSubs((p) => ({ ...p, [assignmentId]: jj.submissions || [] })); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل حفظ الدرجة'); }
    finally { setBusy(false); }
  }

  return (
    <Shell title="الواجبات" subtitle="إنشاء الواجبات ومتابعة التسليمات والتصحيح">
      <div className="space-y-6">
        <div className="toolbar">
          <span className="text-sm text-[color:var(--muted)]">{rows.length} واجباً</span>
          <button className="primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> واجب جديد</button>
        </div>
        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}

        {showForm && (
          <div className="panel space-y-4">
            <h3 className="font-extrabold">واجب جديد</h3>
            <div className="formGrid">
              <label>العنوان<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="واجب النسب المئوية" /></label>
              <label>الدورة
                <select value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value, groupId: '' })}>
                  <option value="">— اختر الدورة —</option>
                  {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </label>
              <label>المجموعة (اختياري)
                <select value={f.groupId} onChange={(e) => setF({ ...f, groupId: e.target.value })} disabled={!f.courseId}>
                  <option value="">كل مجموعات الدورة</option>
                  {groups.filter((g) => g.course_id === f.courseId).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
              </label>
              <label>تاريخ التسليم<input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></label>
              <label>الدرجة القصوى<input type="number" min={1} value={f.maxScore} onChange={(e) => setF({ ...f, maxScore: Number(e.target.value) })} /></label>
            </div>
            <label className="block">الوصف / التعليمات
              <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={3} />
            </label>
            <div className="flex gap-2">
              <button className="primary" disabled={busy || !f.title || !f.courseId} onClick={onCreate}>إنشاء</button>
              <button className="ghost" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rows.length === 0 && <div className="panel p-8 text-center text-[color:var(--muted)]">لا توجد واجبات بعد</div>}
          {rows.map((r) => (
            <div key={r.id} className="panel p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <b>{r.title}</b>
                  <div className="text-xs text-[color:var(--muted)] mt-1">
                    {r.course_name}{r.group_name ? ' · ' + r.group_name : ''}
                    {r.due_date ? ' · التسليم: ' + new Date(r.due_date).toLocaleDateString('ar-EG') : ''}
                    {' · من ' + r.max_score}
                  </div>
                  {r.description && <p className="text-xs text-[color:var(--muted)] mt-1">{r.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="badge pending">مُسلّم {r.submitted_count}</span>
                    <span className="badge success">مُصحح {r.graded_count}</span>
                  <button className="ghost !min-h-0 py-1.5 px-3" onClick={() => toggleSubs(r)}>
                    {openId === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />} التسليمات
                  </button>
                  <button className="ghost !min-h-0 py-1.5 px-3 text-[color:var(--danger)]" onClick={() => onDelete(r)} disabled={busy}><Trash2 size={14} /></button>
                </div>
              </div>
              {openId === r.id && (
                <div className="mt-4 space-y-2 border-t border-[color:var(--border)] pt-4">
                  {(subs[r.id] || []).length === 0 && <p className="text-xs text-[color:var(--muted)]">لا تسليمات بعد</p>}
                  {(subs[r.id] || []).map((sub) => (
                    <div key={sub.id} className="p-3 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-sm">{sub.student_name} <span className="text-[color:var(--muted)] text-xs">({sub.student_no})</span></b>
                        <span className="text-xs text-[color:var(--muted)]">{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('ar-EG') : 'تسليم ورقي'}</span>
                      </div>
                      {sub.content && <p className="text-sm whitespace-pre-line bg-[color:var(--surface-3)] p-3 rounded-lg">{sub.content}</p>}
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="text-xs">الدرجة (من {r.max_score})
                          <input type="number" min={0} max={Number(r.max_score)} className="w-24" value={gradeDraft[sub.id]?.score ?? (sub.score ?? '')} onChange={(e) => setGradeDraft((p) => ({ ...p, [sub.id]: { score: e.target.value, feedback: p[sub.id]?.feedback ?? sub.feedback ?? '' } }))} />
                        </label>
                        <label className="text-xs flex-1 min-w-48">الملاحظات
                          <input value={gradeDraft[sub.id]?.feedback ?? sub.feedback ?? ''} onChange={(e) => setGradeDraft((p) => ({ ...p, [sub.id]: { score: p[sub.id]?.score ?? String(sub.score ?? ''), feedback: e.target.value } }))} placeholder="ملاحظة للطالب..." />
                        </label>
                        <button className="primary !min-h-0 py-1.5 px-3 text-xs" disabled={busy} onClick={() => saveGrade(r.id, sub)}>حفظ الدرجة</button>
                        {sub.graded_at && <span className="badge success">مُصححة</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
