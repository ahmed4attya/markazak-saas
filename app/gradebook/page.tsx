'use client';

import { useCallback, useEffect, useState } from 'react';
import Shell from '@/components/Shell';

type GRow = { studentId: string; name: string; exams: number; examAvg: number | null; assignments: number; hwAvg: number | null; overall: number | null };
type Detail = {
  student: { id: string; name: string };
  exams: Array<{ title: string; score: number | null; total: number | null; pct: number | null; finished_at: string }>;
  assignments: Array<{ title: string; score: number | null; max_score: number | string; pct: number | null; graded_at: string; feedback: string | null }>;
};

export default function Gradebook() {
  const [groups, setGroups] = useState<{ id: string; name: string; course_name?: string }[]>([]);
  const [groupId, setGroupId] = useState('');
  const [rows, setRows] = useState<GRow[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/groups').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setGroups(d); }).catch(() => {});
  }, []);

  const loadGroup = useCallback(async (id: string) => {
    if (!id) { setRows([]); setDetail(null); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/gradebook?groupId=' + id);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'تعذر التحميل');
      setRows(j.rows || []);
      setDetail(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر التحميل'); }
    finally { setLoading(false); }
  }, []);

  async function openDetail(studentId: string) {
    setError('');
    try {
      const r = await fetch('/api/gradebook?studentId=' + studentId);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'تعذر التحميل');
      setDetail(j);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر التحميل'); }
  }

  function pctColor(p: number | null): string {
    if (p === null) return 'text-[color:var(--muted)]';
    if (p >= 85) return 'text-[color:var(--success)]';
    if (p >= 60) return 'text-[color:var(--gold)]';
    return 'text-[color:var(--danger)]';
  }

  return (
    <Shell title="سجل الدرجات" subtitle="الأداء المجمّع: الامتحانات + الواجبات لكل مجموعة وطالب">
      <div className="space-y-6">
        <div className="toolbar">
          <select value={groupId} onChange={(e) => { setGroupId(e.target.value); void loadGroup(e.target.value); }} className="w-72">
            <option value="">— اختر المجموعة —</option>
            {groups.map((g) => (<option key={g.id} value={g.id}>{g.name}{g.course_name ? ' — ' + g.course_name : ''}</option>))}
          </select>
        </div>
        {error && <div className="error">{error}</div>}

        {loading && <p className="text-[color:var(--muted)]">جاري الحساب...</p>}

        {!loading && rows.length > 0 && (
          <div className="panel tablePanel">
            <div className="tableWrap">
              <table className="dataTable">
                <thead><tr><th>الطالب</th><th>امتحانات</th><th>متوسط الامتحانات</th><th>واجبات</th><th>متوسط الواجبات</th><th>المؤشر العام</th><th></th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.studentId}>
                      <td><b>{r.name}</b></td>
                      <td>{r.exams}</td>
                      <td className={pctColor(r.examAvg)}>{r.examAvg === null ? '—' : r.examAvg + '%'}</td>
                      <td>{r.assignments}</td>
                      <td className={pctColor(r.hwAvg)}>{r.hwAvg === null ? '—' : r.hwAvg + '%'}</td>
                      <td className={'font-bold ' + pctColor(r.overall)}>{r.overall === null ? '—' : r.overall + '%'}</td>
                      <td><button className="ghost !min-h-0 py-1.5 px-3" onClick={() => openDetail(r.studentId)}>التفصيل</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!loading && groupId && rows.length === 0 && <div className="panel p-8 text-center text-[color:var(--muted)]">لا طلاب نشطون في هذه المجموعة</div>}

        {detail && (
          <div className="panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">التفصيل — {detail.student.name}</h3>
              <button className="ghost !min-h-0 py-1.5 px-3" onClick={() => setDetail(null)}>إغلاق</button>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2 text-[color:var(--gold)]">الامتحانات</h4>
              {detail.exams.length === 0 && <p className="text-xs text-[color:var(--muted)]">لا محاولات بعد</p>}
              <div className="space-y-1">
                {detail.exams.map((x, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-[color:var(--surface-2)]">
                    <span>{x.title}</span>
                    <span className={pctColor(x.pct)}>{x.score}/{x.total} ({x.pct === null ? '—' : x.pct + '%'})</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-2 text-[color:var(--gold)]">الواجبات المُصححة</h4>
              {detail.assignments.length === 0 && <p className="text-xs text-[color:var(--muted)]">لا واجبات مصححة بعد</p>}
              <div className="space-y-1">
                {detail.assignments.map((x, i) => (
                  <div key={i} className="text-sm p-2 rounded-lg bg-[color:var(--surface-2)]">
                    <div className="flex items-center justify-between">
                      <span>{x.title}</span>
                      <span className={pctColor(x.pct)}>{x.score}/{x.max_score} ({x.pct === null ? '—' : x.pct + '%'})</span>
                    </div>
                    {x.feedback && <p className="text-xs text-[color:var(--muted)] mt-1">{x.feedback}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
