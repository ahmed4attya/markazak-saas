"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wrench, AlertCircle, CheckCircle2, RefreshCw, ChevronRight, ChevronLeft, Trophy, Target } from "lucide-react";
import QuestionCard, { type QuestionCardData } from "@/components/QuestionCard";

type MRow = {
  questionId: string;
  domain?: string;
  subject?: string | null;
  topic?: string | null;
  skill?: string | null;
  difficulty?: number;
  text: string;
  options: string[];
  wrongCount: number;
  lastCorrect: boolean;
  lastAt: string | null;
  studentName?: string;
};

const PAGE_SIZE = 10;

export default function PortalMistakes() {
  const [rows, setRows] = useState<MRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("الكل");
  const [repFilter, setRepFilter] = useState("الكل");
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState<"list" | "resolve">("list");
  const [queue, setQueue] = useState<MRow[]>([]);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verdict, setVerdict] = useState<{ correct: boolean; correctIndex: number; explanation: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/learner/mistakes");
      if (!r.ok) throw new Error("تعذر تحميل صندوق الأخطاء");
      setRows(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const skills = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) { const k = r.skill || r.topic || ""; if (k) set.add(k); }
    return ["الكل", ...[...set].sort()];
  }, [rows]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (r.lastCorrect) return false; // done ones hidden from the active list
    if (skillFilter !== "الكل" && (r.skill || r.topic || "") !== skillFilter) return false;
    if (repFilter === "×2+" && r.wrongCount < 2) return false;
    if (repFilter === "×3+" && r.wrongCount < 3) return false;
    if (repFilter === "×5+" && r.wrongCount < 5) return false;
    return true;
  }), [rows, skillFilter, repFilter]);

  const doneCount = rows.filter((r) => r.lastCorrect).length;
  const activeCount = rows.filter((r) => !r.lastCorrect).length;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function startResolveAll() {
    setQueue([...filtered]);
    setQi(0);
    setChosen(null);
    setRevealed(false);
    setVerdict(null);
    setMode("resolve");
  }

  function startResolveOne(row: MRow) {
    setQueue([row]);
    setQi(0);
    setChosen(null);
    setRevealed(false);
    setVerdict(null);
    setMode("resolve");
  }

  const current = queue[qi];

  async function choose(i: number) {
    if (!current || revealed) return;
    setChosen(i);
    try {
      const r = await fetch("/api/learner/mistakes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: current.questionId, chosen: i }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "تعذر التسجيل");
      setVerdict({ correct: j.correct, correctIndex: j.correctIndex, explanation: j.explanation });
      setRevealed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
  }

  function nextResolve() {
    if (qi + 1 >= queue.length) { setMode("list"); void load(); return; }
    setQi((i) => i + 1);
    setChosen(null);
    setRevealed(false);
    setVerdict(null);
  }

  // ---------- resolve mode ----------
  if (mode === "resolve" && current) {
    const q: QuestionCardData = {
      id: current.questionId, domain: current.domain, subject: current.subject, topic: current.topic,
      skill: current.skill, difficulty: current.difficulty, text: current.text, options: current.options,
    };
    return (
      <main className="p-4 lg:p-8 max-w-2xl mx-auto pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold">إعادة حل الأخطاء ({qi + 1}/{queue.length})</h1>
          <button className="ghost !min-h-0 py-1.5 px-3 text-xs" onClick={() => { setMode("list"); void load(); }}>خروج</button>
        </div>
        <QuestionCard
          q={q}
          chosen={chosen}
          revealed={revealed}
          correctIndex={verdict?.correctIndex}
          explanation={verdict?.explanation}
          onChoose={(i) => void choose(i)}
        >
          {revealed && (
            <button
              onClick={nextResolve}
              className="w-full rounded-2xl bg-[color:var(--gold)] py-3.5 text-lg font-bold text-[#0b0f17] transition-transform active:scale-[0.98]"
            >
              {qi + 1 >= queue.length ? "عرض القائمة" : "التالي"}
            </button>
          )}
        </QuestionCard>
        {error && <div className="error">{error}</div>}
      </main>
    );
  }

  // ---------- list mode ----------
  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto pt-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><Wrench size={24} className="text-[color:var(--gold)]" /> صندوق أخطائي</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bento-card p-5 text-center">
          <div className="text-3xl font-black text-[color:var(--danger)]">{activeCount}</div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">أخطاء نشطة</div>
        </div>
        <div className="bento-card p-5 text-center">
          <div className="text-3xl font-black text-[color:var(--gold)]">{doneCount}</div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">أتممتها</div>
        </div>
      </div>

      {activeCount > 0 && (
        <button onClick={startResolveAll} className="w-full rounded-2xl bg-[color:var(--gold)] py-3.5 text-lg font-bold text-[#0b0f17] transition-transform active:scale-[0.98]">
          إعادة اختبار كل الأخطاء ({activeCount})
        </button>
      )}

      <div className="bento-card p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {skills.map((k) => (
            <button
              key={k}
              onClick={() => { setSkillFilter(k); setPage(1); }}
              className={
                "rounded-full px-3 py-1 text-xs font-bold transition-colors " +
                (skillFilter === k
                  ? "bg-[color:var(--gold)] text-[#0b0f17]"
                  : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--gold-border)]")
              }
            >
              {k}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["الكل", "×2+", "×3+", "×5+"].map((r) => (
            <button
              key={r}
              onClick={() => { setRepFilter(r); setPage(1); }}
              className={
                "rounded-full px-3 py-1 text-xs font-bold transition-colors " +
                (repFilter === r
                  ? "bg-[color:var(--gold)] text-[#0b0f17]"
                  : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--gold-border)]")
              }
            >
              التكرار: {r}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="bento-card p-8 text-center text-[color:var(--muted)]">جاري التحميل...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && pageRows.length === 0 && filtered.length === 0 && (
        <div className="bento-card p-10 text-center space-y-4">
          <Trophy size={44} className="mx-auto text-[color:var(--gold)]" />
          <p className="font-extrabold">لا أخطاء نشطة الآن — عظيم!</p>
          <div className="flex gap-2 justify-center">
            <Link href="/portal/training" className="primary">التدريب اليومي</Link>
            <Link href="/portal/exams" className="ghost">الامتحانات</Link>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pageRows.map((r) => (
          <div key={r.questionId} className="bento-card p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle size={17} className="text-[color:var(--danger)] mt-0.5 shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[color:var(--danger-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--danger)]">{r.skill || r.topic || "عام"}</span>
                <span className="rounded-full bg-[color:var(--danger)] px-2.5 py-0.5 text-[10px] font-bold text-white">أخطأت {r.wrongCount} مرة</span>
                {r.studentName && <span className="text-[10px] text-[color:var(--muted)]">— {r.studentName}</span>}
              </div>
            </div>
            <p className="text-sm line-clamp-2 text-[color:var(--text-soft)]">{r.text}</p>
            <div className="flex gap-2">
              <button onClick={() => startResolveOne(r)} className="ghost !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"><RefreshCw size={12} /> إعادة الحل</button>
              {r.lastCorrect && <span className="badge success !min-h-0 py-1 px-2.5 text-[10px] flex items-center gap-1"><CheckCircle2 size={11} /> أتممته</span>}
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="ghost !min-h-0 py-1.5 px-3 disabled:opacity-40"><ChevronRight size={14} /> السابق</button>
          <span className="text-[color:var(--muted)] text-xs">صفحة {page} من {pageCount}</span>
          <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="ghost !min-h-0 py-1.5 px-3 disabled:opacity-40">التالي <ChevronLeft size={14} /></button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-[color:var(--muted)]">
          <Target size={13} /> الدروس المستفادة تُحسب من أتمامتك — استمر
        </div>
      )}
    </main>
  );
}
