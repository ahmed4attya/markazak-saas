'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Save, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Question = { id: string; text: string; options: string[]; domain: string; topic: string | null; position: number };
type Attempt = { id: string; title: string; duration_minutes: number | null; started_at: string; finished_at: string | null; score: number | null; total: number | null };
type Review = { question_id: string; correct_index: number; answer: number | null };

export default function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [attemptId, setAttemptId] = useState('');
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [review, setReview] = useState<Review[] | undefined>();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async (id: string) => {
    const response = await fetch('/api/attempts/' + id);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'تعذر تحميل المحاولة');
    setAttempt(body.attempt); setQuestions(body.questions || []); setReview(body.review);
    setAnswers(body.attempt.answers || {});
    if (body.attempt.duration_minutes && !body.attempt.finished_at) {
      const end = new Date(body.attempt.started_at).getTime() + body.attempt.duration_minutes * 60 * 1000;
      setRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    }
  }, []);

  useEffect(() => { params.then(({ id }) => { setAttemptId(id); load(id).catch((e) => setMessage(e instanceof Error ? e.message : 'تعذر التحميل')); }); }, [load, params]);
  useEffect(() => {
    if (remaining === null || attempt?.finished_at) return;
    const timer = window.setInterval(() => setRemaining((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [remaining, attempt?.finished_at]);
  useEffect(() => {
    if (remaining === 0 && attemptId && !attempt?.finished_at) save(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const current = questions[index];
  const formattedTime = useMemo(() => remaining === null ? '—' : `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`, [remaining]);

  async function save(submit = false) {
    if (!attemptId || busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/attempts/' + attemptId, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answers, submit }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'تعذر حفظ الإجابات');
      if (submit) { setAttempt(body.saved); setReview(body.review); setMessage('تم التسليم وحُفظت النتيجة'); }
      else setMessage('تم الحفظ تلقائياً');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  }

  if (!attempt || !current) return <main dir="rtl" className="min-h-screen bg-[color:var(--bg)] p-6 text-[color:var(--text)]"><div className="mx-auto max-w-3xl panel">{message || 'جاري تحميل الامتحان...'}</div></main>;
  const finished = Boolean(attempt.finished_at);

  return <main dir="rtl" className="min-h-screen bg-[color:var(--bg)] p-4 text-[color:var(--text)] lg:p-8">
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-xs text-[color:var(--gold)]"><ShieldCheck size={15} /> محاولة آمنة ومخصصة لحسابك</div><h1 className="mt-2 text-xl font-bold">{attempt.title}</h1><p className="text-sm text-[color:var(--muted)]">السؤال {index + 1} من {questions.length}</p></div><div className="flex items-center gap-3"><span className="flex items-center gap-2 rounded-full bg-[color:var(--surface-2)] px-3 py-2 text-sm"><Clock3 size={16} className="text-[color:var(--gold)]" />{finished ? 'تم التسليم' : formattedTime}</span>{finished && <span className="font-bold text-[color:var(--success)]">النتيجة: {attempt.score}/{attempt.total}</span>}</div></header>
      {message && <div className="success">{message}</div>}
      <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
        <section className="panel space-y-6"><div><span className="text-xs text-[color:var(--gold)]">{current.domain} · {current.topic || 'عام'}</span><h2 className="mt-3 text-xl font-bold leading-relaxed">{current.text}</h2></div><div className="space-y-3">{current.options.map((option, optionIndex) => <button key={optionIndex} disabled={finished} onClick={() => setAnswers((value) => ({ ...value, [current.id]: optionIndex }))} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-right transition-colors ${answers[current.id] === optionIndex ? 'border-[color:var(--gold)] bg-[color:var(--gold-soft)]' : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:bg-[color:var(--surface-3)]'}`}><span className="font-bold text-[color:var(--gold)]">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></button>)}</div><div className="flex flex-wrap justify-between gap-2 border-t border-[color:var(--border)] pt-4"><button className="ghost" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowRight size={16} /> السابق</button>{!finished && <button className="ghost" disabled={busy} onClick={() => save(false)}><Save size={16} /> حفظ الآن</button>}{index < questions.length - 1 ? <button className="primary" onClick={() => setIndex((value) => value + 1)}>التالي <ArrowLeft size={16} /></button> : !finished && <button className="primary" disabled={busy} onClick={() => { if (window.confirm('تسليم المحاولة الآن؟')) save(true); }}><CheckCircle2 size={16} /> تسليم المحاولة</button>}</div></section>
        <aside className="panel h-fit space-y-3"><h3 className="font-bold">خريطة الأسئلة</h3><div className="grid grid-cols-5 gap-2">{questions.map((question, questionIndex) => <button key={question.id} onClick={() => setIndex(questionIndex)} className={`h-9 rounded-lg text-sm ${questionIndex === index ? 'bg-[color:var(--gold)] text-[#0b0f17]' : answers[question.id] !== undefined ? 'bg-[color:var(--success-soft)] text-[color:var(--success)]' : 'bg-[color:var(--surface-2)] text-[color:var(--muted)]'}`}>{questionIndex + 1}</button>)}</div>{finished && review && <div className="space-y-2 border-t border-[color:var(--border)] pt-3 text-sm"><h4 className="font-bold">مراجعة النتيجة</h4><p className="text-[color:var(--muted)]">يمكنك مراجعة إجاباتك بعد التسليم.</p></div>}<button className="ghost w-full" onClick={() => router.push('/portal')}>العودة للبوابة</button></aside>
      </div>
    </div>
  </main>;
}
