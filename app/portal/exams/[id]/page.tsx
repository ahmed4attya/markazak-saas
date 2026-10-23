'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, AlertTriangle, CheckCircle2, XCircle, Sparkles, Clock } from 'lucide-react';
import PortalConfetti from '@/components/PortalConfetti';

type Q = { id: string; kind: string; text: string; options: string[] };
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
  perQuestion: Array<{ questionId: string; text: string; chosen: number | null; correctIndex: number; correct: boolean; explanation: string | null }>;
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
      .then((p) => { setPayload(p); setChoices(p.saved.c || {}); })
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

  // MVP anti-cheat: tab-switch visual warning only (documented limit)
  useEffect(() => {
    if (!payload || result) return;
    const onVis = () => { if (document.hidden) setTabSwitches((n) => n + 1); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [payload, result]);

  const answeredCount = useMemo(
    () => (payload ? payload.questions.filter((q) => choices[q.id] !== undefined).length : 0),
    [payload, choices]
  );

  function fmtTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  async function askAi(qid: string) {
    if (!result) return;
    setAiBusy(qid);
    try {
      const r = await fetch('/api/learner/ai-explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attemptId: result.attemptId, questionId: qid }),
      });
      const j = await r.json();
      setAiMap((p) => ({ ...p, [qid]: r.ok ? j.answer : (j.error || 'تعذر التحليل') }));
    } catch {
      setAiMap((p) => ({ ...p, [qid]: 'تعذر التحليل' }));
    } finally {
      setAiBusy('');
    }
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
          <Link href="/portal/exams" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
          <h1 className="font-extrabold mr-4">النتيجة — {result.examTitle}</h1>
        </header>
        <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
          <div className="bento-card p-8 text-center">
            <div className={'text-6xl font-extrabold ' + (good ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]')}>{result.percent}%</div>
            <p className="mt-2 text-[color:var(--muted)]">{result.score} من {result.total} إجابة صحيحة</p>
            <div className="flex gap-2 justify-center mt-5">
              <Link href="/portal/exams" className="ghost">قائمة الامتحانات</Link>
              <button onClick={() => window.location.reload()} className="primary">محاولة جديدة</button>
            </div>
          </div>
          {result.perQuestion.map((pq, i) => (
            <div key={pq.questionId} className="bento-card p-5">
              <div className="flex items-start gap-3">
                {pq.correct ? <CheckCircle2 size={20} className="text-[color:var(--success)] shrink-0 mt-1" /> : <XCircle size={20} className="text-[color:var(--danger)] shrink-0 mt-1" />}
                <div className="flex-1">
                  <p className="font-bold">سؤال {i + 1}: {pq.text}</p>
                  <div className="text-sm mt-2 space-y-1">
                    <p className="text-[color:var(--muted)]">إجابتك: <span className={pq.correct ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}>{pq.chosen === null ? 'لم تجب' : LETTERS[pq.chosen] + ') ' + (payload.questions.find((q) => q.id === pq.questionId)?.options[pq.chosen] ?? '')}</span></p>
                    {!pq.correct && <p className="text-[color:var(--success)]">الصحيحة: {LETTERS[pq.correctIndex]}) {payload.questions.find((q) => q.id === pq.questionId)?.options[pq.correctIndex] ?? ''}</p>}
                  </div>
                  {!pq.correct && (
                    <div className="mt-3">
                      <button onClick={() => askAi(pq.questionId)} disabled={aiBusy === pq.questionId} className="ghost !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1">
                        <Sparkles size={13} /> {aiBusy === pq.questionId ? 'جاري التحليل...' : 'لماذا أخطأت؟'}
                      </button>
                      {aiMap[pq.questionId] && (
                        <div className="mt-2 p-3 rounded-xl text-sm leading-7 bg-[color:var(--surface-2)] border border-[color:var(--border)] whitespace-pre-line">{aiMap[pq.questionId]}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </main>
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
          <Link href="/portal/exams" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> خروج</Link>
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
      <main className="p-4 lg:p-8 max-w-3xl mx-auto">
        <div className="bento-card p-6">
          <p className="text-xs text-[color:var(--muted)] mb-3">سؤال {current + 1} من {payload.questions.length}</p>
          <p className="text-lg font-bold leading-8 mb-6">{q.text}</p>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setChoices((p) => ({ ...p, [q.id]: i }))}
                className={'w-full text-right p-4 rounded-xl border transition-colors ' + (choices[q.id] === i
                  ? 'border-[color:var(--gold)] bg-[color:var(--gold-soft)]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)]')}
              >
                <b className="ml-2 text-[color:var(--gold)]">{LETTERS[i] ?? i + 1})</b> {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 gap-3">
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="ghost disabled:opacity-40">السابق</button>
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
            <button onClick={() => setCurrent((c) => Math.min(payload.questions.length - 1, c + 1))} className="primary">التالي</button>
          ) : (
            <button onClick={() => setConfirming(true)} className="primary">تسليم</button>
          )}
        </div>
        {current === payload.questions.length - 1 && (
          <div className="text-center mt-4">
            <button onClick={() => setConfirming(true)} className="primary">تسليم الامتحان وعرض النتيجة</button>
          </div>
        )}
      </main>
      {confirming && (
        <div className="fixed inset-0 bg-[rgba(2,6,16,0.6)] flex items-center justify-center z-20 p-4" onClick={() => setConfirming(false)}>
          <div className="bento-card p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold">تسليم الامتحان؟</p>
            <p className="text-sm text-[color:var(--muted)] mt-2">أجبت على {answeredCount} من {payload.questions.length} سؤالا. لا يمكن التعديل بعد التسليم.</p>
            <div className="flex gap-2 justify-center mt-5">
              <button onClick={() => setConfirming(false)} className="ghost">متابعة الحل</button>
              <button onClick={() => void submit()} disabled={submitting} className="primary">{submitting ? 'جاري التصحيح...' : 'تسليم نهائي'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
