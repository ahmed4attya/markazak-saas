'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, HelpCircle, Upload, BookOpen, Image as ImageIcon, X } from 'lucide-react';
import Shell from '@/components/Shell';

type Question = {
  id: string;
  course_id: string | null;
  domain: string;
  subject: string | null;
  topic: string | null;
  skill: string | null;
  difficulty: number;
  kind: string;
  text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  passage?: string | null;
  image_url?: string | null;
  status?: string;
  created_at: string;
};

type Course = { id: string; name: string };

const DOMAIN_LABELS: Record<string, string> = { quant: 'قدرات كمي', verbal: 'قدرات لفظي', achievement: 'تحصيلي' };
const EMPTY = {
  courseId: '',
  domain: 'quant',
  subject: '',
  topic: '',
  skill: '',
  difficulty: 3,
  text: '',
  passage: '',
  imageUrl: '',
  o1: '',
  o2: '',
  o3: '',
  o4: '',
  correctIndex: 0,
  explanation: '',
};

export default function Questions() {
  const [rows, setRows] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState<typeof EMPTY>({ ...EMPTY });
  const [previewPassage, setPreviewPassage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        body: JSON.stringify({
          courseId: f.courseId || null,
          domain: f.domain,
          subject: f.subject,
          topic: f.topic,
          skill: f.skill,
          difficulty: Number(f.difficulty),
          kind: 'mcq',
          text: f.text,
          passage: f.passage.trim() || null,
          imageUrl: f.imageUrl.trim() || null,
          options,
          correctIndex: f.correctIndex,
          explanation: f.explanation,
        }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'فشل الحفظ'); }
      setOk('تم حفظ السؤال بنجاح'); setF({ ...EMPTY }); setShowForm(false);
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

  async function toggleStatus(row: Question) {
    const next = row.status === 'active' ? 'disabled' : 'active';
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/questions', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: row.id, status: next }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'فشل التحديث'); }
      setOk(next === 'active' ? 'تم تفعيل السؤال — سيظهر للطلاب' : 'تم تعطيل السؤال — لن يظهر في الامتحانات');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل التحديث'); }
    finally { setBusy(false); }
  }

  function setOpt(i: number, v: string) {
    const key = ('o' + (i + 1)) as 'o1' | 'o2' | 'o3' | 'o4';
    setF((p) => ({ ...p, [key]: v }));
  }

  return (
    <Shell title="بنك الأسئلة" subtitle="أسئلة القدرات والتحصيلي — مصنفة بالـ المجال/الموضوع/المهارة/القطع والأشكال">
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
          <Link href="/questions/import" className="ghost">
            <Upload size={16} /> استيراد الأسئلة (نماذج / PDF / Word / AI)
          </Link>
          <button className="primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> سؤال جديد</button>
        </div>

        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}

        {showForm && (
          <div className="panel space-y-4">
            <h3 className="font-extrabold text-[color:var(--text)]">إضافة سؤال جديد</h3>
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
              <label>الموضوع<input value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="النسب المئوية / استيعاب المقروء..." /></label>
              <label>المهارة<input value={f.skill} onChange={(e) => setF({ ...f, skill: e.target.value })} placeholder="الحساب الذهني / استنتاج المعنى..." /></label>
              <label>الصعوبة (1-5)<input type="number" min={1} max={5} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) })} /></label>
            </div>

            <label className="block">
              القطعة المقروءة (اختياري — لأسئلة استيعاب المقروء اللفظي)
              <textarea
                value={f.passage}
                onChange={(e) => setF({ ...f, passage: e.target.value })}
                rows={3}
                placeholder="ألصق نص القطعة هنا إن كان السؤال يعتمد على قراءة نص..."
              />
            </label>

            <label className="block">
              رابط الشكل الهندسي / الصورة (اختياري — لأسئلة الكمي والهندسة)
              <input
                value={f.imageUrl}
                onChange={(e) => setF({ ...f, imageUrl: e.target.value })}
                placeholder="https://... رابط صورة الشكل التوضيحي"
              />
            </label>

            <label className="block">نص السؤال
              <textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} rows={3} placeholder="اكتب نص السؤال هنا..." />
            </label>

            <div className="formGrid">
              {[0, 1, 2, 3].map((i) => {
                const optKey = ('o' + (i + 1)) as 'o1' | 'o2' | 'o3' | 'o4';
                return (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" checked={f.correctIndex === i} onChange={() => setF({ ...f, correctIndex: i })} className="w-4 h-4" />
                    <input value={f[optKey]} onChange={(e) => setOpt(i, e.target.value)} placeholder={'الخيار ' + (i + 1) + (f.correctIndex === i ? ' ✓ الصحيحة' : '')} />
                  </label>
                );
              })}
            </div>

            <label className="block">شرح الحل (يغذي &quot;لماذا أخطأت؟&quot;)
              <textarea value={f.explanation} onChange={(e) => setF({ ...f, explanation: e.target.value })} rows={2} placeholder="شرح طريقة الحل الصحيحة خطوة بخطوة..." />
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
              <thead>
                <tr>
                  <th>السؤال والمرفقات</th>
                  <th>المجال</th>
                  <th>الموضوع</th>
                  <th>الصعوبة</th>
                  <th>الحالة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (<tr><td className="tableEmpty" colSpan={6}>بنك الأسئلة فارغ — أضف أول سؤال أو استورد أسئلة</td></tr>)}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-md">
                      <div className="flex flex-col gap-1 py-1">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <HelpCircle size={15} className="text-[color:var(--blue)] shrink-0" />
                          <span className="truncate">{r.text}</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {r.passage && (
                            <button
                              type="button"
                              onClick={() => setPreviewPassage(r.passage || '')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-500/20 transition-colors"
                              title="عرض القطعة المقروءة"
                            >
                              <BookOpen size={11} /> قطعة مقروءة
                            </button>
                          )}
                          {r.image_url && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(r.image_url || '')}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-500/20 transition-colors"
                              title="عرض الشكل الهندسي"
                            >
                              <ImageIcon size={11} /> شكل هندسي
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{DOMAIN_LABELS[r.domain] || r.domain}</td>
                    <td>{r.topic || '—'}</td>
                    <td>{'★'.repeat(r.difficulty || 3)}</td>
                    <td><span className={'badge ' + (r.status === 'active' ? 'success' : r.status === 'review' ? 'pending' : 'unpaid')}>{r.status === 'active' ? 'نشط' : r.status === 'review' ? 'مراجعة' : 'معطل'}</span></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleStatus(r)} disabled={busy} className="ghost !min-h-0 py-1.5 px-3">
                          {r.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={() => onDelete(r)} disabled={busy} className="ghost !min-h-0 py-1.5 px-3">
                          <Trash2 size={14} /> حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for passage preview */}
      {previewPassage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPassage(null)}
        >
          <div
            className="bg-[color:var(--surface)] text-[color:var(--text)] border border-[color:var(--border)] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="text-amber-600" size={20} />
                <h3 className="font-extrabold text-lg">القطعة المقروءة المرتبطة بالسؤال</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPassage(null)}
                className="p-1 rounded-lg hover:bg-[color:var(--surface-hover)] text-[color:var(--muted)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 leading-relaxed whitespace-pre-line text-sm text-[color:var(--text)] p-4 bg-[color:var(--bg)] rounded-xl border border-[color:var(--border)]">
              {previewPassage}
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" className="primary !min-h-0 py-2 px-5" onClick={() => setPreviewPassage(null)}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for image preview */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-[color:var(--surface)] p-2 rounded-2xl overflow-hidden border border-[color:var(--border)] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="شكل هندسي"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </Shell>
  );
}
