'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  BookOpen,
  Image as ImageIcon,
  ZoomIn,
  X,
  Maximize2,
} from 'lucide-react';
import PortalConfetti from '@/components/PortalConfetti';

type Q = {
  id: string;
  kind: string;
  text: string;
  options: string[];
  passage?: string | null;
  imageUrl?: string | null;
};

type Payload = {
  attemptId: string;
  resumed: boolean;
  exam: { id: string; title: string; kind: string; duration_minutes: number | null };
  questions: Q[];
  saved: { order: string[]; c: Record<string, number> };
  startedAt: string;
};

type Result = {
  attemptId: string;
  examTitle: string;
  score: number;
  total: number;
  percent: number;
  perQuestion: Array<{
    questionId: string;
    text: string;
    chosen: number | null;
    correctIndex: number;
    correct: boolean;
    explanation: string | null;
    passage?: string | null;
    imageUrl?: string | null;
  }>;
};

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export default function TakeExam() {
  const params = useParams<{ id: string }>();
  const examId = (params?.id as string) || '';
  const [payload, setPayload] = useState<Payload | null>(null);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [aiMap, setAiMap] = useState<Record<string, string>>({});
  const [aiBusy, setAiBusy] = useState('');
  const submittedRef = useRef(false);

  // Modals for passage and image zooming
  const [activePassage, setActivePassage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [passageFontSize, setPassageFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    if (!examId) return;
    fetch('/api/learner/attempts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ examId }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'تعذر بدء الامتحان');
        return j as Payload;
      })
      .then((p) => {
        setPayload(p);
        setChoices(p.saved.c || {});
      })
      .catch((e: Error) => setError(e.message || 'خطأ'))
      .finally(() => setLoading(false));
  }, [examId]);

  const submit = useCallback(async () => {
    if (!payload || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const r = await fetch('/api/learner/attempts/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attemptId: payload.attemptId, c: choices }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'تعذر التسليم');
      setResult(j as Result);
    } catch (e) {
      submittedRef.current = false;
      setError(e instanceof Error ? e.message : 'خطأ في التسليم');
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }, [payload, choices]);

  // live timer - auto-submit on expiry
  useEffect(() => {
    if (!payload?.exam.duration_minutes || result) return;
    const end = new Date(payload.startedAt).getTime() + payload.exam.duration_minutes * 60000;
    const tick = () => {
      const rem = Math.max(0, end - Date.now());
      setRemaining(rem);
      if (rem <= 0) void submit();
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [payload, result, submit]);

  // autosave every 12s
  useEffect(() => {
    if (!payload || result) return;
    const iv = setInterval(() => {
      fetch('/api/learner/attempts', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attemptId: payload.attemptId, c: choices }),
      }).catch(() => {});
    }, 12000);
    return () => clearInterval(iv);
  }, [payload, choices, result]);

  // anti-cheat tab-switch detection
  useEffect(() => {
    if (!payload || result) return;
    const handleVis = () => {
      if (document.hidden) setTabSwitches((s) => s + 1);
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [payload, result]);

  async function askAi(questionId: string) {
    if (!result || aiBusy) return;
    setAiBusy(questionId);
    try {
      const r = await fetch('/api/learner/ai-explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attemptId: result.attemptId, questionId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'تعذر التحليل');
      setAiMap((p) => ({ ...p, [questionId]: j.explanation || 'لا يوجد شرح متاح' }));
    } catch (e) {
      setAiMap((p) => ({ ...p, [questionId]: e instanceof Error ? e.message : 'تعذر الاستدعاء' }));
    } finally {
      setAiBusy('');
    }
  }

  const answeredCount = useMemo(() => Object.keys(choices).length, [choices]);

  function fmtTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic'] flex items-center justify-center">
        <p className="text-[color:var(--muted)]">جاري تحضير الامتحان...</p>
      </div>
    );
  }

  if (error && !payload) {
    return (
      <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic'] flex items-center justify-center p-6">
        <div className="bento-card p-8 text-center max-w-md w-full">
          <AlertTriangle className="text-[color:var(--warning)] mx-auto mb-3" size={32} />
          <p>{error}</p>
          <Link href="/portal/exams" className="ghost mt-4 inline-block">رجوع للامتحانات</Link>
        </div>
      </div>
    );
  }

  // ---------------- RESULTS VIEW ----------------
  if (result && payload) {
    const good = result.percent >= 60;
    return (
      <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
        <PortalConfetti fire={!!result} />
        <header className="h-14 flex items-center px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
          <Link href="/portal/exams" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]">
            <ArrowRight size={18} /> رجوع
          </Link>
          <h1 className="font-extrabold mr-4">النتيجة — {result.examTitle}</h1>
        </header>

        <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
          <div className="bento-card p-8 text-center">
            <div className={'text-6xl font-extrabold ' + (good ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]')}>
              {result.percent}%
            </div>
            <p className="mt-2 text-[color:var(--muted)]">{result.score} من {result.total} إجابة صحيحة</p>
            <div className="flex gap-2 justify-center mt-5">
              <Link href="/portal/exams" className="ghost">قائمة الامتحانات</Link>
              <button onClick={() => window.location.reload()} className="primary">محاولة جديدة</button>
            </div>
          </div>

          {result.perQuestion.map((pq, i) => (
            <div key={pq.questionId} className="bento-card p-5 space-y-3">
              <div className="flex items-start gap-3">
                {pq.correct ? (
                  <CheckCircle2 size={20} className="text-[color:var(--success)] shrink-0 mt-1" />
                ) : (
                  <XCircle size={20} className="text-[color:var(--danger)] shrink-0 mt-1" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="font-bold">سؤال {i + 1}: {pq.text}</p>

                  {/* Figure Preview if present */}
                  {pq.imageUrl && (
                    <div className="my-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                      <img
                        src={pq.imageUrl}
                        alt="شكل السؤال"
                        className="mx-auto max-h-48 rounded-lg cursor-pointer"
                        onClick={() => setZoomedImage(pq.imageUrl || null)}
                      />
                    </div>
                  )}

                  {/* Passage Button if present */}
                  {pq.passage && (
                    <button
                      type="button"
                      onClick={() => setActivePassage(pq.passage || null)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-lg hover:bg-amber-100 transition"
                    >
                      <BookOpen size={13} />
                      <span>عرض قطعة القراءة</span>
                    </button>
                  )}

                  <div className="text-sm mt-2 space-y-1">
                    <p className="text-[color:var(--muted)]">
                      إجابتك:{' '}
                      <span className={pq.correct ? 'text-[color:var(--success)] font-bold' : 'text-[color:var(--danger)] font-bold'}>
                        {pq.chosen === null
                          ? 'لم تجب'
                          : `${LETTERS[pq.chosen]}) ${payload.questions.find((q) => q.id === pq.questionId)?.options[pq.chosen] ?? ''}`}
                      </span>
                    </p>
                    {!pq.correct && (
                      <p className="text-[color:var(--success)] font-bold">
                        الصحيحة: {LETTERS[pq.correctIndex]}){' '}
                        {payload.questions.find((q) => q.id === pq.questionId)?.options[pq.correctIndex] ?? ''}
                      </p>
                    )}
                  </div>

                  {!pq.correct && (
                    <div className="mt-3">
                      <button
                        onClick={() => askAi(pq.questionId)}
                        disabled={aiBusy === pq.questionId}
                        className="ghost !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"
                      >
                        <Sparkles size={13} /> {aiBusy === pq.questionId ? 'جاري التحليل...' : 'لماذا أخطأت؟'}
                      </button>
                      {aiMap[pq.questionId] && (
                        <div className="mt-2 p-3 rounded-xl text-sm leading-7 bg-[color:var(--surface-2)] border border-[color:var(--border)] whitespace-pre-line">
                          {aiMap[pq.questionId]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </main>

        {/* Global Passage Modal in Results */}
        {activePassage && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setActivePassage(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                  <BookOpen size={20} />
                  <span>القطعة القرائية — استيعاب المقروء</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePassage(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto py-4 text-slate-800 dark:text-slate-100 leading-loose whitespace-pre-line font-medium text-sm sm:text-base">
                {activePassage}
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-left">
                <button
                  type="button"
                  onClick={() => setActivePassage(null)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox for Figure */}
        {zoomedImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 cursor-pointer"
            onClick={() => setZoomedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
              <img src={zoomedImage} alt="شكل السؤال مكبّراً" className="max-h-[80vh] w-auto object-contain rounded-xl" />
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black text-white rounded-full"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!payload) return null;
  const q = payload.questions[current];
  const urgent = remaining !== null && remaining < 5 * 60000;

  // ---------------- TAKING VIEW ----------------
  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center justify-between px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/portal/exams" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]">
            <ArrowRight size={18} /> خروج
          </Link>
          <h1 className="font-extrabold text-sm lg:text-base">{payload.exam.title}</h1>
          {payload.resumed && <span className="badge partial text-[10px]">استئناف محاولة</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[color:var(--muted)]">{answeredCount}/{payload.questions.length} مجاب</span>
          {payload.exam.duration_minutes && (
            <span className={'flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ' + (urgent ? 'text-[color:var(--danger)]' : 'text-[color:var(--gold)]')}>
              <Clock size={15} /> {remaining !== null ? fmtTime(remaining) : '--:--'}
            </span>
          )}
        </div>
      </header>

      {tabSwitches > 0 && (
        <div className="text-xs text-center py-1.5 bg-[color:var(--warning-soft)] text-[color:var(--warning)] flex items-center justify-center gap-1">
          <AlertTriangle size={13} /> ملاحظة: تم رصد خروجك من الشاشة {tabSwitches}× — التركيز جزء من التدريب
        </div>
      )}

      <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
        {/* Reading Passage Indicator Card */}
        {q.passage && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/30 text-amber-950 dark:text-amber-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-xs font-bold">هذا السؤال مرتبط بقطعة قرائية (استيعاب المقروء)</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/80">انقر لفتح القطعة وقراءتها أثناء الإجابة</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePassage(q.passage || null)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Maximize2 size={13} />
              <span>اقرأ القطعة</span>
            </button>
          </div>
        )}

        <div className="bento-card p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
            <span>سؤال {current + 1} من {payload.questions.length}</span>
            {q.imageUrl && (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                <ImageIcon size={14} /> سؤال ذو شكل/رسم بياني
              </span>
            )}
          </div>

          <p className="text-lg font-bold leading-8">{q.text}</p>

          {/* Quantitative Shape / Figure */}
          {q.imageUrl && (
            <div className="rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-center overflow-hidden">
              <div className="relative inline-block group">
                <img
                  src={q.imageUrl}
                  alt="شكل السؤال الهندسي"
                  className="mx-auto max-h-72 w-auto object-contain rounded-xl shadow-sm transition-transform cursor-zoom-in group-hover:scale-[1.02]"
                  onClick={() => setZoomedImage(q.imageUrl || null)}
                />
                <button
                  type="button"
                  onClick={() => setZoomedImage(q.imageUrl || null)}
                  className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-sm hover:bg-black"
                >
                  <ZoomIn size={12} />
                  <span>تكبير الشكل</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setChoices((p) => ({ ...p, [q.id]: i }))}
                className={'w-full text-right p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ' + (choices[q.id] === i
                  ? 'border-[color:var(--gold)] bg-[color:var(--gold-soft)] shadow-sm'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)]')}
              >
                <span className={'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ' + (choices[q.id] === i
                  ? 'bg-[color:var(--gold)] text-slate-900'
                  : 'bg-slate-200 dark:bg-slate-800 text-[color:var(--muted)]')}>
                  {LETTERS[i] ?? i + 1}
                </span>
                <span className="flex-1 font-semibold">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="ghost disabled:opacity-40"
          >
            السابق
          </button>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {payload.questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setCurrent(i)}
                className={'w-8 h-8 rounded-lg text-xs font-bold border transition-colors ' + (i === current
                  ? 'border-[color:var(--gold)] text-[color:var(--gold)]'
                  : choices[qq.id] !== undefined
                    ? 'border-[color:var(--success)] text-[color:var(--success)]'
                    : 'border-[color:var(--border)] text-[color:var(--muted)]')}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {current < payload.questions.length - 1 ? (
            <button onClick={() => setCurrent((c) => Math.min(payload.questions.length - 1, c + 1))} className="primary">
              التالي
            </button>
          ) : (
            <button onClick={() => setConfirming(true)} className="primary">
              تسليم
            </button>
          )}
        </div>

        {current === payload.questions.length - 1 && (
          <div className="text-center mt-4">
            <button onClick={() => setConfirming(true)} className="primary">
              تسليم الامتحان وعرض النتيجة
            </button>
          </div>
        )}
      </main>

      {/* Interactive Modal for Reading Passage */}
      {activePassage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setActivePassage(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">القطعة القرائية — استيعاب المقروء</h3>
              </div>

              {/* Font Sizer Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setPassageFontSize('normal')}
                    className={`px-2 py-1 rounded-lg ${passageFontSize === 'normal' ? 'bg-white dark:bg-slate-700 shadow-sm font-bold' : 'text-slate-400'}`}
                  >
                    عادي
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassageFontSize('large')}
                    className={`px-2 py-1 rounded-lg ${passageFontSize === 'large' ? 'bg-white dark:bg-slate-700 shadow-sm font-bold' : 'text-slate-400'}`}
                  >
                    كبير
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassageFontSize('xlarge')}
                    className={`px-2 py-1 rounded-lg ${passageFontSize === 'xlarge' ? 'bg-white dark:bg-slate-700 shadow-sm font-bold' : 'text-slate-400'}`}
                  >
                    أكبر
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePassage(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div
              className={`overflow-y-auto py-5 text-slate-800 dark:text-slate-100 leading-loose whitespace-pre-line font-medium ${
                passageFontSize === 'normal'
                  ? 'text-sm sm:text-base'
                  : passageFontSize === 'large'
                    ? 'text-base sm:text-lg'
                    : 'text-lg sm:text-xl'
              }`}
            >
              {activePassage}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">يمكنك فتح هذه النافذة في أي وقت أثناء حل السؤال</span>
              <button
                type="button"
                onClick={() => setActivePassage(null)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20"
              >
                إغلاق ومتابعة الإجابة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Figure */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
            <img src={zoomedImage} alt="شكل السؤال مكبّراً" className="max-h-[80vh] w-auto object-contain rounded-xl" />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black text-white rounded-full"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirming && (
        <div className="fixed inset-0 bg-[rgba(2,6,16,0.6)] flex items-center justify-center z-20 p-4" onClick={() => setConfirming(false)}>
          <div className="bento-card p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold">تسليم الامتحان؟</p>
            <p className="text-sm text-[color:var(--muted)] mt-2">
              أجبت على {answeredCount} من {payload.questions.length} سؤالاً. لا يمكن التعديل بعد التسليم.
            </p>
            <div className="flex gap-2 justify-center mt-5">
              <button onClick={() => setConfirming(false)} className="ghost">متابعة الحل</button>
              <button onClick={() => void submit()} disabled={submitting} className="primary">
                {submitting ? 'جاري التصحيح...' : 'تسليم نهائي'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
