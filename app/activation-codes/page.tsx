'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Copy, Power } from 'lucide-react';
import Shell from '@/components/Shell';

type CRow = {
  id: string; code: string; duration_days: number; max_uses: number; used_count: number;
  active: boolean; course_name: string | null; redemption_count: number;
};

export default function ActivationCodes() {
  const [rows, setRows] = useState<CRow[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [courseId, setCourseId] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [maxUses, setMaxUses] = useState(1);
  const [count, setCount] = useState(1);
  const [generated, setGenerated] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch('/api/activation-codes');
    if (r.ok) setRows(await r.json()); else setError('تعذر تحميل الأكواد');
  }, []);

  useEffect(() => { load().catch(() => setError('تعذر التحميل')); }, [load]);
  useEffect(() => {
    fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setCourses(d); }).catch(() => {});
  }, []);

  async function onCreate() {
    setBusy(true); setError(''); setOk(''); setGenerated([]);
    try {
      const r = await fetch('/api/activation-codes', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseId, durationDays, maxUses, count }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'فشل التوليد');
      setGenerated(j.codes || []);
      setOk('تم توليد ' + (j.codes || []).length + ' كوداً');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل التوليد'); }
    finally { setBusy(false); }
  }

  async function toggle(row: CRow) {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/activation-codes/' + row.id, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ active: !row.active }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'فشل التعديل'); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل التعديل'); }
    finally { setBusy(false); }
  }

  function copyAll() {
    void navigator.clipboard.writeText(generated.join('\n'));
    setOk('نُسخت الأكواد إلى الحافظة');
  }

  return (
    <Shell title="أكواد التفعيل" subtitle="نموذج البيع: كود يمنح الطالب اشتراكاً في دورة لمدة محددة">
      <div className="space-y-6">
        <div className="toolbar">
          <span className="text-sm text-[color:var(--muted)]">{rows.length} كوداً</span>
        </div>
        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}

        <div className="panel space-y-4">
          <h3 className="font-extrabold">توليد أكواد جديدة</h3>
          <div className="formGrid">
            <label>الدورة
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">— اختر الدورة —</option>
                {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </label>
            <label>المدة (أيام)<input type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} /></label>
            <label>حد الاستخدام<input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} /></label>
            <label>عدد الأكواد<input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
          </div>
          <div className="flex gap-2">
            <button className="primary" disabled={busy || !courseId} onClick={onCreate}><Plus size={16} /> توليد</button>
            {generated.length > 0 && <button className="ghost" onClick={copyAll}><Copy size={16} /> نسخ الكل</button>}
          </div>
          {generated.length > 0 && (
            <div className="p-3 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--gold-border)] font-mono text-sm leading-7" dir="ltr">
              {generated.map((c) => (<div key={c}>{c}</div>))}
            </div>
          )}
        </div>

        <div className="panel tablePanel">
          <div className="tableWrap">
            <table className="dataTable">
              <thead><tr><th>الكود</th><th>الدورة</th><th>المدة</th><th>الاستخدام</th><th>الحالة</th><th></th></tr></thead>
              <tbody>
                {rows.length === 0 && (<tr><td className="tableEmpty" colSpan={6}>لا أكواد بعد</td></tr>)}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono" dir="ltr">{r.code}</td>
                    <td>{r.course_name || '—'}</td>
                    <td>{r.duration_days} يوم</td>
                    <td>{r.used_count}/{r.max_uses}</td>
                    <td><span className={'badge ' + (r.active ? 'success' : 'unpaid')}>{r.active ? 'نشط' : 'معطل'}</span></td>
                    <td><button className="ghost !min-h-0 py-1.5 px-3" onClick={() => toggle(r)} disabled={busy}><Power size={14} /> {r.active ? 'تعطيل' : 'تفعيل'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
