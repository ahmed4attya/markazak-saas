"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flag, Bookmark, Trophy, AlertCircle, RefreshCw } from "lucide-react";
import QuestionCard, { BackLink, type QuestionCardData } from "@/components/QuestionCard";
import MistakeTutor from "@/components/MistakeTutor";

const TOTAL = 10;

export default function PortalTraining() {
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<QuestionCardData[]>([]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verdict, setVerdict] = useState<{ correct: boolean; correctIndex: number; explanation: string | null; options: string[] } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState<{ score: number; total: number; percent: number; best: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/learner/training?count=" + TOTAL);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "تعذر تحميل التدريب");
      setAttemptId(j.attemptId);
      setQuestions(j.questions || []);
      setIndex(0);
      setChosen(null);
      setRevealed(false);
      setVerdict(null);
      setFinished(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function choose(i: number) {
    if (revealed || !questions[index]) return;
    setChosen(i);
    try {
      const r = await fetch("/api/learner/training", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, questionId: questions[index].id, chosen: i }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "تعذر التسجيل");
      setVerdict({ correct: j.correct, correctIndex: j.correctIndex, explanation: j.explanation, options: j.options || [] });
      setRevealed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تسجيل الإجابة");
      setChosen(null);
    }
  }

  async function finish() {
    try {
      const r = await fetch("/api/learner/training", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, finish: true }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "تعذر إكمال التدريب");
      setFinished({ score: j.score, total: j.total, percent: j.percent, best: j.best });
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إكمال التدريب");
    }
  }

  function next() {
    if (index + 1 >= questions.length) { void finish(); return; }
    setIndex((i) => i + 1);
    setChosen(null);
    setRevealed(false);
    setVerdict(null);
  }

  const progressPct = questions.length ? Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100) : 0;
  const current = questions[index];
  const wrongText = verdict && chosen !== null && current ? current.options[chosen] : "";
  const correctText = verdict && current ? current.options[verdict.correctIndex] : "";

  if (loading) {
    return (
      <main className="p-4 lg:p-8 max-w-2xl mx-auto pt-6">
        <div className="bento-card p-10 text-center text-[color:var(--muted)]">جاري تجهيز تدريبك…</div>
      </main>
    );
  }

  if (error && !questions.length) {
    return (
      <main className="p-4 lg:p-8 max-w-2xl mx-auto pt-6">
        <div className="bento-card p-8 text-center space-y-4">
          <p className="text-[color:var(--danger)]">{error}</p>
          <button className="primary" onClick={() => void load()}>إعادة المحاولة</button>
        </div>
      </main>
    );
  }

  if (finished) {
    const good = finished.percent >= 70;
    return (
      <main className="p-4 lg:p-8 max-w-2xl mx-auto pt-6">
        <BackLink href="/portal" label="البورتال" />
        <div className="bento-card mt-3 p-8 text-center space-y-3">
          {good
            ? <Trophy size={44} className="mx-auto text-[color:var(--gold)]" />
            : <AlertCircle size={44} className="mx-auto text-[color:var(--danger)]" />}
          <h1 className="text-2xl font-extrabold">أكملت التدريب اليومي</h1>
          <p className="text-[color:var(--muted)]">{finished.score} صحيحة من {finished.total} ({finished.percent}%)</p>
          {finished.best > 0 && <p className="text-xs text-[color:var(--gold)] font-bold">أفضل نتيجة: {finished.best}/{finished.total}</p>}
          <div className="flex gap-2 justify-center pt-3">
            <button className="primary" onClick={() => void load()}>تدريب جديد</button>
            <Link href="/portal" className="ghost">البورتال</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 lg:p-8 max-w-2xl mx-auto pt-6 space-y-4">
      <BackLink href="/portal" label="البورتال" />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">التدريب اليومي</h1>
        <div className="flex gap-2">
          <button type="button" title="تعليم للمراجعة (قريباً)" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--muted)]"><Flag size={16} /></button>
          <button type="button" title="بطاقة تعلم (قريباً)" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-[color:var(--muted)]"><Bookmark size={16} /></button>
        </div>
      </div>

      <div>
        <div className="h-2 rounded-full bg-[color:var(--surface-3)] overflow-hidden">
          <div className="h-full rounded-full bg-[color:var(--gold)] transition-all duration-300" style={{ width: progressPct + "%" }} />
        </div>
        <p className="mt-2 text-xs font-bold text-[color:var(--muted)]">السؤال {index + 1} من {questions.length}</p>
      </div>

      {current && (
        <QuestionCard
          q={current}
          chosen={chosen}
          revealed={revealed}
          correctIndex={verdict?.correctIndex}
          explanation={verdict?.explanation}
          onChoose={(i) => void choose(i)}
        >
          {revealed && verdict && !verdict.correct && (
            <MistakeTutor
              wrongText={wrongText}
              correctText={correctText}
              explanation={verdict.explanation || ""}
              topic={current.topic || current.skill || current.subject || ""}
            />
          )}
          {revealed && (
            <button
              onClick={next}
              className="w-full rounded-2xl bg-[color:var(--gold)] py-3.5 text-lg font-bold text-[#0b0f17] transition-transform active:scale-[0.98]"
            >
              {index + 1 >= questions.length ? "عرض النتيجة" : "التالي"}
            </button>
          )}
        </QuestionCard>
      )}

      {error && <div className="error">{error}</div>}
    </main>
  );
}
