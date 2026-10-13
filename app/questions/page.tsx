'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, HelpCircle, Upload } from 'lucide-react';
import Shell from '@/components/Shell';

type Question = { id: string; course_id: string | null; domain: string; subject: string | null; topic: string | null; skill: string | null; difficulty: number; kind: string; text: string; options: string[]; correct_index: number; explanation: string | null; created_at: string };
type Course = { id: string; name: string };

const DOMAIN_LABELS: Record<string, string> = { quant: 'قدرات كمي', verbal: 'قدرات لفظي', achievement: 'تحصيلي' };
const EMPTY = { courseId: '', domain: 'quant', subject: '', topic: '', skill: '', difficulty: 3, text: '', o1: '', o2: '', o3: '', o4: '', correctIndex: 0, explanation: '' };

export default function Questions() {
  const [rows, setRows] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState<typeof EMPTY>({ ...EMPTY });
  const [showImport, setShowImport] = useState(false); const [importCsv, setImportCsv] = useState(''); const [importCourseId, setImportCourseId] = useState(''); const [importBusy, setImportBusy] = useState(false); const [importResult, setImportResult] = useState('');

  const load = useCallback(async () => {
    const qs = domain ? '?domain=' + domain : '';
    const r = await fetch('/api/questions' + qs);
    if (r.ok) setRows(await r.json()); else setError('تعذر تحميل بنك الأسئلة');
  }, [domain]);

  useEffect(() => { load().catch(() => setError('تعذر التحميل')); }, [load]);
  useEffect(() => {
    fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setCourses(d); }).catch(() => {});
  }, []);

  async function onSave() {
    setBusy(true); setError(''); setOk('');
    try {
      const options = [f.o1, f.o2, f.o3, f.o4].map((x) => x.trim()).filter(Boolean);
      const r = await fetch('/api/questions', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseId: f.courseId || null, domain: f.domain, subject: f.subject, topic: f.topic, skill: f.skill, difficulty: Number(f.difficulty), kind: 'mcq', text: f.text, options, correctIndex: f.correctIndex, explanation: f.explanation }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'فشل الحفظ'); }
      setOk('تم حفظ السؤال'); setF({ ...EMPTY }); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل الحفظ'); }
    finally { setBusy(false); }
  }

  async function onDelete(row: Question) {
    if (!window.confirm('حذف السؤال؟')) return;
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/questions?id=' + row.id, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'فشل الحذف'); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل الحذف'); }
    finally { setBusy(false); }
  }

  async function runImport(apply: boolean) {
    setImportBusy(true); setError(''); setOk(''); setImportResult('');
    try {
      const r = await fetch(apply ? '/api/questions/import/apply' : '/api/questions/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ csv: importCsv, courseId: importCourseId || null }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || 'تعذر تنفيذ الاستيراد');
      if (apply) { setOk(`تم استيراد ${body.inserted} سؤال، وتعطيل ${body.disabled} صف`); setImportCsv(''); await load(); }
      else setImportResult(`الإجمالي: ${body.total} · صالح: ${body.ready} · معطّل: ${body.disabled}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تنفيذ الاستيراد'); }
    finally { setImportBusy(false); }
  }

  function setOpt(i: number, v: string) {
    setF((p) => ({ ...p, ['o' + (i + 1)]: v } as typeof EMPTY));
  }

  return (
    <Shell title="بنك الأسئلة" subtitle="أسئلة القدرات والتحصيلي — مصنفة ب المجال/الموضوع/المهارة/الصعوبة">
      <div className="space-y-6">
        <div className="toolbar">
          <div className="flex items-center gap-2">
            <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-52">
              <option value="">كل المجالات</option>
              <option value="quant">قدرات كمي</option>
              <option value="verbal">قدرات لفظي</option>
              <option value="achievement">تحصيلي</option>
            </select>
          </div>
          <div className="flex gap-2"><button className="secondary" onClick={() => setShowImport(!showImport)}><Upload size={16} /> استيراد CSV</button><button className="primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> سؤال جديد</button></div>
        </div>

        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}

        {showImport && <div className="panel space-y-4"><h3 className="font-extrabold text-[color:var(--text)]">استيراد أسئلة CSV</h3><p className="text-sm text-[color:var(--muted)]">الأعمدة: domain,text,options,correctIndex,difficulty,subject,topic,skill,explanation,courseId. الخيارات تفصل بعلامة |. الصفوف غير السليمة لا تُحذف؛ تُعطّل وتظهر في الفحص.</p><label>الدورة الافتراضية للصفوف التي لا تحتوي courseId<select value={importCourseId} onChange={(e) => setImportCourseId(e.target.value)}><option value="">سؤال عام (للمدير فقط)</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><textarea value={importCsv} onChange={(e) => setImportCsv(e.target.value)} rows={8} dir="ltr" placeholder="domain,text,options,correctIndex,difficulty\nquant,ما قيمة 2+2؟,3|4|5,1,1" /><div className="flex flex-wrap gap-2"><button className="secondary" disabled={importBusy || !importCsv.trim()} onClick={() => runImport(false)}>فحص فقط</button><button className="primary" disabled={importBusy || !importCsv.trim()} onClick={() => runImport(true)}>تطبيق السليم فقط</button></div>{importResult && <div className="success">{importResult}</div>}</div>}

        {showForm && (
          <div className="panel space-y-4">
            <h3 className="font-extrabold text-[color:var(--text)]">سؤال جديد</h3>
            <div className="formGrid">
              <label>الدورة (اختياري — اتركها فارغة لسؤال عام)
                <select value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })}>
                  <option value="">سؤال عام</option>
                  {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </label>
              <label>المجال
                <select value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })}>
                  <option value="quant">قدرات كمي</option>
                  <option value="verbal">قدرات لفظي</option>
                  <option value="achievement">تحصيلي</option>
                </select>
              </label>
              <label>المادة<input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="رياضيات / لغة عربية..." /></label>
              <label>الموضوع<input value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="النسب المئوية..." /></label>
              <label>المهارة<input value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value })} placeholder="الحساب الذهني..." /></label>
              <label>الصعوبة (1-5)<input type="number" min={1} max={5} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) })} /></label>
            </div>
            <label className="block">نص السؤال
              <textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} rows={3} />
            </label>
            <div className="formGrid">
              {[0, 1, 2, 3].map((i) => (
                <label key={i} className="flex items-center gap-2">
                  <input type="radio" name="correct" checked={f.correctIndex === i} onChange={() => setF({ ...f, correctIndex: i })} className="w-4 h-4" />
                  <input value={(f as any)['o' + (i + 1)]} onChange={(e) => setOpt(i, e.target.value)} placeholder={'الخيار ' + (i + 1) + (f.correctIndex === i ? ' ✓ الصحيحة' : '')} />
                </label>
              ))}
            </div>
            <label className="block">شرح الحل (يغذي "لماذا أخطأت؟")
              <textarea value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} rows={2} />
            </label>
            <div className="flex gap-2">
              <button className="primary" disabled={busy} onClick={onSave}>حفظ السؤال</button>
              <button className="ghost" onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        )}

        <div className="panel tablePanel">
          <div className="tableWrap">
            <table className="dataTable">
              <thead><tr><th>السؤال</th><th>المجال</th><th>الموضوع</th><th>الصعوبة</th><th></th></tr></thead>
              <tbody>
                {rows.length === 0 && (<tr><td className="tableEmpty" colSpan={5}>بنك الأسئلة فارغ — أضف أول سؤال</td></tr>)}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-md truncate"><span className="inline-flex items-center gap-2"><HelpCircle size={15} className="text-[color:var(--blue)]" /> {r.text}</span></td>
                    <td>{DOMAIN_LABELS[r.domain] || r.domain}</td>
                    <td>{r.topic || '—'}</td>
                    <td>{'★'.repeat(r.difficulty || 3)}</td>
                    <td><button onClick={() => onDelete(r)} disabled={busy} className="ghost !min-h-0 py-1.5 px-3"><Trash2 size={14} /> حذف</button></td>
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
