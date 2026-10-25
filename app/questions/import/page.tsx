'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { FileText, Link2, Sparkles, FileCode, FileType, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

type Opt = { key: string; text: string };
type ExtractedQ = { body: string; options: Opt[]; answerKey?: string };

const TEMPLATE = `1. إذا كان ثمن 3 أقلام 12 ريالاً فما ثمن 7 أقلام؟
أ. 24
ب. 26
ج. 28
د. 30
الإجابة: ج

2. سلك طوله 20 سم شُكّل مربعاً فكم ضلعه؟
أ. 4
ب. 5
ج. 8 (صح)
د. 10`;

export default function QuestionsImportPage() {
  const [tab, setTab] = useState<'text' | 'link' | 'ai' | 'pdf' | 'docx'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [letterless, setLetterless] = useState(false);
  const [domain, setDomain] = useState('quant');
  const [courseId, setCourseId] = useState('');
  const [skill, setSkill] = useState('');
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ext, setExt] = useState<{
    fileName: string;
    questions: ExtractedQ[];
    withAnswer: number;
    withOptions: number;
    garbled?: boolean;
    note?: string;
  } | null>(null);
  const [saved, setSaved] = useState<{ created: number; duplicates: number; fileName: string } | null>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setCourses(d);
      })
      .catch(() => {});
  }, []);

  async function handleExtract() {
    setBusy(true);
    setErr('');
    setExt(null);
    setSaved(null);

    try {
      if (tab === 'text') {
        if (!text.trim()) {
          setErr('الصق النص أولاً');
          setBusy(false);
          return;
        }
        const res = await fetch('/api/questions/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'text', text, letterless }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل الاستخراج');
        setExt(data);
      } else if (tab === 'link') {
        if (!url.trim()) {
          setErr('أدخل رابط النموذج أولاً');
          setBusy(false);
          return;
        }
        const res = await fetch('/api/questions/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'link', url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل سحب النموذج');
        setExt(data);
      } else {
        if (!files[0]) {
          setErr('اختر الملف أولاً');
          setBusy(false);
          return;
        }
        const fd = new FormData();
        fd.append('source', tab === 'docx' ? 'docx' : 'pdf');
        fd.append('file', files[0]);
        const res = await fetch('/api/questions/extract', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'فشل تحليل الملف');
        setExt(data);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'حدث خطأ في الاتصال');
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!ext || ext.questions.length === 0) return;
    setBusy(true);
    setErr('');
    setSaved(null);

    try {
      const res = await fetch('/api/questions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: ext.fileName || 'استيراد جديد',
          domain,
          courseId: courseId || null,
          skill: skill || null,
          questions: ext.questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ المسودات');
      setSaved(data);
      setExt(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'تعذر حفظ الأسئلة');
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    { key: 'text', label: 'لصق نص', icon: FileText },
    { key: 'link', label: 'رابط نموذج', icon: Link2 },
    { key: 'ai', label: 'ذكاء اصطناعي', icon: Sparkles },
    { key: 'pdf', label: 'PDF', icon: FileCode },
    { key: 'docx', label: 'Word', icon: FileType },
  ] as const;

  return (
    <Shell
      title="استيراد الأسئلة"
      subtitle="استيراد سريع للأسئلة من مصادر متعددة — التحقق والمعاينة والحفظ التلقائي كمسودات للمراجعة"
    >
      <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
        {/* Banner */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-sm leading-relaxed text-amber-900 dark:text-amber-300">
          <p>
            <b className="font-bold text-amber-800 dark:text-amber-200">ثلاثة مصادر، مسار واحد:</b> استخراج ← معاينة ← حفظ كمسودات ← مراجعة واعتماد. لن يظهر أي سؤال للطلاب قبل اعتماده.
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          {/* Source Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTab(t.key);
                    setExt(null);
                    setSaved(null);
                    setErr('');
                  }}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                    active
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Text Tab */}
          {tab === 'text' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={letterless}
                  onChange={(e) => setLetterless(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
                <span>الخيارات بلا أحرف (فعّلها عند النسخ من نموذج جوجل)</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={9}
                dir="rtl"
                placeholder={TEMPLATE}
                className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-sm leading-loose outline-none focus:border-amber-500 transition font-mono"
              />
            </div>
          )}

          {/* Link Tab */}
          {tab === 'link' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                رابط نموذج عام (جوجل أو مايكروسوفت)
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  dir="ltr"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  className="mt-1.5 w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-left text-sm outline-none focus:border-amber-500 transition"
                />
              </label>
              <p className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 p-3 text-xs text-blue-800 dark:text-blue-300">
                يدعم نماذج جوجل ومايكروسوفت فورمز — يسحب الأسئلة والخيارات مباشرة. الإجابات الصحيحة تُحدد في المراجعة.
              </p>
            </div>
          )}

          {/* AI Tab */}
          {tab === 'ai' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                ملف PDF أو صور (حتى 40 صفحة)
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  className="mt-1.5 w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
                />
              </label>
              <p className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300">
                استخراج ذكي ومعالجة بصرية للنماذج والصور المصورة.
              </p>
            </div>
          )}

          {/* PDF or Word Tab */}
          {(tab === 'pdf' || tab === 'docx') && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {tab === 'pdf' ? 'ملف PDF (نصي)' : 'ملف Word (.docx)'}
                <input
                  type="file"
                  accept={tab === 'pdf' ? 'application/pdf' : '.docx'}
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 1))}
                  className="mt-1.5 w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm"
                />
              </label>
              <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                {tab === 'pdf'
                  ? 'يتم قراءة النصوص والجداول من ملف PDF مباشرة عبر محرك pdf-parse واستخراج الأسئلة وخياراتها ومفاتيحها.'
                  : 'يتم استخراج النصوص الكاملة من ملف Word (.docx) وتحليلها آلياً.'}
              </p>
            </div>
          )}

          {/* Target Metadata Options */}
          <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              المجال / القسم
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-sm"
              >
                <option value="quant">قدرات كمي</option>
                <option value="verbal">قدرات لفظي</option>
                <option value="achievement">تحصيلي</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              الدورة المرتبطة (اختياري)
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-sm"
              >
                <option value="">بنك عام (للمركز كله)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              المهارة الافتراضية (اختياري)
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="مثال: الحساب الذهني، إكمال الجمل"
                className="mt-1 w-full rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-sm outline-none focus:border-amber-500"
              />
            </label>
          </div>

          {/* Error notice */}
          {err && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{err}</span>
            </div>
          )}

          {/* Success notice */}
          {saved && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  ✓ تم حفظ «{saved.created}» سؤالاً كمسودات بنجاح
                  {saved.duplicates > 0 && ` (${saved.duplicates} سؤال مكرر تم تجاوزه)`}
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                الأسئلة أصبحت جاهزة في بنك الأسئلة بحالة «مراجعة» ولن تظهر للطلاب إلا بعد المراجعة والاعتماد.
              </p>
              <Link
                href="/questions"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                <span>مراجعة بنك الأسئلة</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Preview Table */}
          {ext && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-black text-slate-800 dark:text-white">
                  تم التعرف على {ext.questions.length} سؤالاً من «{ext.fileName}»
                </p>
                <div className="flex gap-2 text-xs font-bold">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                    بإجابة محددة: {ext.withAnswer}
                  </span>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-blue-700 dark:text-blue-300">
                    بخيارات كاملة: {ext.withOptions}
                  </span>
                </div>
              </div>

              {ext.questions.length - ext.withAnswer > 0 && (
                <p className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2.5 text-xs text-blue-800 dark:text-blue-300">
                  {ext.questions.length - ext.withAnswer} سؤالاً بلا مفتاح إجابة مسبق (ستتمكن من تحديد الإجابة الصحيحة أثناء المراجعة).
                </p>
              )}

              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
                <table className="w-full text-xs text-right">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">#</th>
                      <th className="px-3 py-2.5 font-bold">السؤال</th>
                      <th className="px-3 py-2.5 font-bold">الخيارات</th>
                      <th className="px-3 py-2.5 font-bold text-center">الإجابة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {ext.questions.slice(0, 100).map((q, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                        <td className="max-w-md px-3 py-2">
                          <span className="line-clamp-1">{q.body}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold">
                            {q.options?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {q.answerKey ? (
                            <span className="inline-block rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-black text-xs">
                              {q.answerKey}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleExtract}
              disabled={busy}
              className="flex-1 rounded-2xl border-2 border-amber-500 bg-white dark:bg-slate-900 py-3.5 text-base font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {busy ? 'جارٍ العمل…' : '١ — استخراج ومعاينة'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !ext || ext.questions.length === 0}
              className="flex-1 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 py-3.5 text-base font-bold text-white hover:from-amber-600 hover:to-amber-700 transition disabled:opacity-40 cursor-pointer shadow-md shadow-amber-500/20"
            >
              {busy ? 'جارٍ الحفظ…' : `٢ — حفظ كمسودات (${ext?.questions.length ?? 0})`}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
