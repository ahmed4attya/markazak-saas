'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import {
  FileText,
  Link2,
  Sparkles,
  FileCode,
  FileType,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Image as ImageIcon,
  X,
  Edit3,
} from 'lucide-react';

type Opt = { key: string; text: string };
type ExtractedQ = {
  body: string;
  options: Opt[];
  answerKey?: string;
  passage?: string;
  imageUrl?: string;
  hasFigure?: boolean;
};

const TEMPLATE = `[القطعة: التجارة الإلكترونية هي نظام يتيح بيع وشراء السلع عبر الإنترنت. وقد حققت نمواً ملحوظاً في المملكة مع انتشار المدفوعات الرقمية والدعم اللوجستي المتطور.]
1. ما العامل الأساسي الذي ساهم في نمو التجارة الإلكترونية وفق النص؟
أ. زيادة الإعلانات الورقية
ب. انتشار المدفوعات الرقمية والدعم اللوجستي
ج. تراجع استخدام الإنترنت
د. غياب المنافسة
الإجابة: ب

2. في الشكل المجاور مثلث قائم الزاوية طول وتره 10 سم وأحد أضلاعه 6 سم، فكم طول الضلع الآخر؟
أ. 6 سم
ب. 8 سم (صح)
ج. 9 سم
د. 12 سم`;

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
    withPassage?: number;
    withFigures?: number;
    garbled?: boolean;
    note?: string;
  } | null>(null);
  const [saved, setSaved] = useState<{
    created: number;
    duplicates: number;
    withPassage?: number;
    withImage?: number;
    fileName: string;
  } | null>(null);

  // Modals
  const [modalPassage, setModalPassage] = useState<{ title: string; text: string } | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [editingPreviewQ, setEditingPreviewQ] = useState<{
    index: number;
    body: string;
    options: Opt[];
    answerKey?: string;
  } | null>(null);

  function saveEditingPreviewQ() {
    if (!editingPreviewQ || !ext) return;
    const updated = [...ext.questions];
    updated[editingPreviewQ.index] = {
      ...updated[editingPreviewQ.index],
      body: editingPreviewQ.body,
      options: editingPreviewQ.options,
      answerKey: editingPreviewQ.answerKey,
    };
    const withAnswer = updated.filter((q) => Boolean(q.answerKey)).length;
    setExt({ ...ext, questions: updated, withAnswer });
    setEditingPreviewQ(null);
  }

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

  function attachImageToQuestion(idx: number, imgUrl: string) {
    if (!ext) return;
    const updated = [...ext.questions];
    updated[idx] = { ...updated[idx], imageUrl: imgUrl.trim() || undefined, hasFigure: Boolean(imgUrl.trim()) };
    const withFigures = updated.filter((q) => q.imageUrl || q.hasFigure).length;
    setExt({ ...ext, questions: updated, withFigures });
    setEditingImageIdx(null);
    setTempImageUrl('');
  }

  function setQuestionAnswerKey(idx: number, key: string | undefined) {
    if (!ext) return;
    const updated = [...ext.questions];
    updated[idx] = { ...updated[idx], answerKey: key };
    const withAnswer = updated.filter((q) => Boolean(q.answerKey)).length;
    setExt({ ...ext, questions: updated, withAnswer });
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
      subtitle="استيراد ذكي يدعم القطع القرائية (استيعاب المقروء اللفظي) والأشكال الهندسية والرسوم (الكمي) — استخراج ومعاينة وحفظ كمسودات"
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
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${
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
              <p className="text-xs text-slate-400">
                💡 تلميح: يمكنك وضع علامة [القطعة: نص القطعة...] قبل الأسئلة ليتم ربطها آلياً بقطعة استيعاب المقروء.
              </p>
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
                يدعم نماذج جوجل ومايكروسوفت فورمز — يسحب نصوص الأسئلة والخيارات، وقطع استيعاب المقروء اللفظية، وأشكال ورسوم الأسئلة الكمية مباشرة!
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
                استخراج ذكي ومعالجة بصرية للنماذج والصور والأشكال الهندسية.
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
                  ? 'يتم قراءة النصوص والجداول من ملف PDF مباشرة عبر محرك pdf-parse واستخراج الأسئلة وخياراتها ومفاتيحها والقطع المرتبطة.'
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
                <option value="quant">قدرات كمي (معادلات وأشكال)</option>
                <option value="verbal">قدرات لفظي (استيعاب المقروء وتناظر)</option>
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
                placeholder="مثال: استيعاب المقروء، هندسة المثلثات"
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
                {saved.withPassage ? ` تم ربط ${saved.withPassage} سؤالاً بقطع استيعاب المقروء.` : ''}
                {saved.withImage ? ` تم تضمين ${saved.withImage} شكلاً ورسماً بيانياً.` : ''}
              </p>
              <Link
                href="/questions?status=review"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                <span>الانتقال لمراجعة وتعديل الأسئلة في بنك الأسئلة</span>
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
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-emerald-700 dark:text-emerald-300">
                    بإجابة محددة: {ext.withAnswer}
                  </span>
                  <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-blue-700 dark:text-blue-300">
                    بخيارات كاملة: {ext.withOptions}
                  </span>
                  {Boolean(ext.withPassage) && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <BookOpen size={12} />
                      بقطعة استيعاب: {ext.withPassage}
                    </span>
                  )}
                  {Boolean(ext.withFigures) && (
                    <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <ImageIcon size={12} />
                      بأشكال/رسوم: {ext.withFigures}
                    </span>
                  )}
                </div>
              </div>

              {ext.questions.length - ext.withAnswer > 0 && (
                <p className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2.5 text-xs text-blue-800 dark:text-blue-300">
                  {ext.questions.length - ext.withAnswer} سؤالاً بلا مفتاح إجابة مسبق (ستتمكن من تحديد الإجابة الصحيحة أثناء المراجعة).
                </p>
              )}

              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner">
                <table className="w-full text-xs text-right">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 font-bold">#</th>
                      <th className="px-3 py-2.5 font-bold">السؤال والخيارات</th>
                      <th className="px-3 py-2.5 font-bold text-center">الخيارات</th>
                      <th className="px-3 py-2.5 font-bold text-center min-w-[140px]">الإجابة الصحيحة (اختر / عدّل)</th>
                      <th className="px-3 py-2.5 font-bold text-center">الملحقات (القطعة/الشكل)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {ext.questions.slice(0, 100).map((q, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                        <td className="max-w-md px-3 py-2 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              onClick={() =>
                                setEditingPreviewQ({
                                  index: i,
                                  body: q.body,
                                  options: [...(q.options || [])],
                                  answerKey: q.answerKey,
                                })
                              }
                              className="line-clamp-2 font-medium text-slate-900 dark:text-slate-100 hover:text-amber-600 cursor-pointer transition"
                              title="انقر لتعديل نص السؤال وخياراته"
                            >
                              {q.body}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingPreviewQ({
                                  index: i,
                                  body: q.body,
                                  options: [...(q.options || [])],
                                  answerKey: q.answerKey,
                                })
                              }
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded cursor-pointer shrink-0"
                              title="تعديل نص السؤال وخياراته"
                            >
                              <Edit3 size={11} />
                              <span>تعديل</span>
                            </button>
                          </div>
                          {q.imageUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={q.imageUrl}
                              alt="معاينة شكل السؤال"
                              className="h-10 w-auto rounded border border-slate-200 cursor-pointer"
                              onClick={() => setModalImage(q.imageUrl || null)}
                            />
                          )}
                          {/* Interactive options list */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {q.options?.map((opt, optIdx) => {
                              const isCorrect = q.answerKey === opt.key;
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => setQuestionAnswerKey(i, isCorrect ? undefined : opt.key)}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    isCorrect
                                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black ring-1 ring-emerald-500/30'
                                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                                  }`}
                                  title={`انقر لاختيار [${opt.key}] كإجابة صحيحة`}
                                >
                                  <strong className="font-bold">{opt.key}:</strong>
                                  <span className="truncate max-w-[130px]">{opt.text}</span>
                                  {isCorrect && <span className="text-emerald-500 font-black">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold">
                            {q.options?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-1.5 min-w-[130px]">
                            {/* Dropdown Selector */}
                            <select
                              value={q.answerKey || ''}
                              onChange={(e) => setQuestionAnswerKey(i, e.target.value || undefined)}
                              className={`w-full px-2 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                q.answerKey
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black'
                                  : 'bg-slate-50 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-amber-500'
                              }`}
                              title="حدد الخيار الصحيح لهذا السؤال"
                            >
                              <option value="">— حدد الإجابة —</option>
                              {q.options?.map((opt, optIdx) => (
                                <option key={opt.key || optIdx} value={opt.key}>
                                  {opt.key}: {opt.text.slice(0, 32)}
                                </option>
                              ))}
                            </select>

                            {/* Quick 1-click pills */}
                            <div className="flex items-center gap-1 flex-wrap justify-center">
                              {q.options?.map((opt, optIdx) => {
                                const isSelected = q.answerKey === opt.key;
                                return (
                                  <button
                                    key={opt.key || optIdx}
                                    type="button"
                                    onClick={() => setQuestionAnswerKey(i, isSelected ? undefined : opt.key)}
                                    className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400 font-black scale-105'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-500/20 hover:text-amber-600'
                                    }`}
                                    title={`تعيين [${opt.key}] كإجابة صحيحة: "${opt.text}"`}
                                  >
                                    {opt.key}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {q.passage && (
                              <button
                                type="button"
                                onClick={() => setModalPassage({ title: `القطعة للسؤال ${i + 1}`, text: q.passage || '' })}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <BookOpen size={11} />
                                <span>القطعة</span>
                              </button>
                            )}

                            {q.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => setModalImage(q.imageUrl || null)}
                                className="px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <ImageIcon size={11} />
                                <span>الشكل</span>
                              </button>
                            ) : q.hasFigure ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingImageIdx(i);
                                  setTempImageUrl('');
                                }}
                                className="px-2 py-0.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <AlertCircle size={11} />
                                <span>أضف شكلاً</span>
                              </button>
                            ) : null}
                          </div>
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

        {/* Modal: Preview Passage */}
        {modalPassage && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setModalPassage(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                  <BookOpen size={18} />
                  <span>{modalPassage.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalPassage(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto py-4 text-slate-800 dark:text-slate-100 leading-loose whitespace-pre-line text-sm font-medium">
                {modalPassage.text}
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-left">
                <button
                  type="button"
                  onClick={() => setModalPassage(null)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Preview Image */}
        {modalImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer"
            onClick={() => setModalImage(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh] p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <img src={modalImage} alt="شكل السؤال" className="max-h-[75vh] w-auto object-contain rounded-xl" />
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black text-white rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Modal: Attach Image URL */}
        {editingImageIdx !== null && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingImageIdx(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">إرفاق رابط الشكل للسؤال {editingImageIdx + 1}</h4>
                <button onClick={() => setEditingImageIdx(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                أدخل رابط صورة الشكل الهندسي أو الرسم البياني (URL مباشر):
              </p>
              <input
                type="url"
                value={tempImageUrl}
                onChange={(e) => setTempImageUrl(e.target.value)}
                dir="ltr"
                placeholder="https://example.com/triangle.png"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs outline-none focus:border-amber-500"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingImageIdx(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => attachImageToQuestion(editingImageIdx, tempImageUrl)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600"
                >
                  حفظ الشكل
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal: Edit Extracted Question Preview */}
        {editingPreviewQ && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingPreviewQ(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <Edit3 size={16} />
                  <span>تعديل السؤال #{editingPreviewQ.index + 1} قبل الحفظ</span>
                </div>
                <button onClick={() => setEditingPreviewQ(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1 pl-1 text-xs">
                <label className="block space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">نص السؤال</span>
                  <textarea
                    value={editingPreviewQ.body}
                    onChange={(e) => setEditingPreviewQ({ ...editingPreviewQ, body: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 outline-none focus:border-amber-500 font-medium"
                  />
                </label>

                <div className="space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300">خيارات الإجابة</span>
                  <div className="space-y-2">
                    {editingPreviewQ.options.map((opt, optIdx) => {
                      const isCorrect = editingPreviewQ.answerKey === opt.key;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setEditingPreviewQ({ ...editingPreviewQ, answerKey: opt.key })}
                            className={`h-6 w-6 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center cursor-pointer ${
                              isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                            }`}
                            title="تحديد كإجابة صحيحة"
                          >
                            {opt.key}
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const updated = [...editingPreviewQ.options];
                              updated[optIdx] = { ...updated[optIdx], text: e.target.value };
                              setEditingPreviewQ({ ...editingPreviewQ, options: updated });
                            }}
                            className="w-full bg-transparent outline-none text-xs"
                          />
                          {isCorrect && <span className="text-emerald-500 font-bold">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPreviewQ(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={saveEditingPreviewQ}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 cursor-pointer"
                >
                  حفظ التعديل
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
