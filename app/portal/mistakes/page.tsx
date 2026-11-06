"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wrench,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Layers,
  ArrowRight,
  ShieldAlert,
  Brain,
} from "lucide-react";
import QuestionCard, { type QuestionCardData } from "@/components/QuestionCard";
import MistakeTutor from "@/components/MistakeTutor";

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

  // Leitner Box Filter: urgent (wrong >= 2 & not corrected), learning (wrong 1 & not corrected), mastered (lastCorrect true), "all" = active (not corrected)
  const [leitnerBox, setLeitnerBox] = useState<"urgent" | "learning" | "mastered" | "all">("all");
  const [skillFilter, setSkillFilter] = useState("الكل");
  const [page, setPage] = useState(1);

  // Resolve Mode
  const [mode, setMode] = useState<"list" | "resolve">("list");
  const [queue, setQueue] = useState<MRow[]>([]);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verdict, setVerdict] = useState<{
    correct: boolean;
    correctIndex: number;
    explanation: string | null;
  } | null>(null);

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

  useEffect(() => {
    void load();
  }, [load]);

  // Weakness Matrix: Top skills with mistakes
  const weaknessMatrix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      if (!r.lastCorrect) {
        const skillName = r.skill || r.topic || "مهارة عامة";
        counts.set(skillName, (counts.get(skillName) || 0) + (r.wrongCount || 1));
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [rows]);

  const skills = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const k = r.skill || r.topic || "";
      if (k) set.add(k);
    }
    return ["الكل", ...Array.from(set).sort()];
  }, [rows]);

  // Leitner Box Counts
  const urgentCount = rows.filter((r) => !r.lastCorrect && r.wrongCount >= 2).length;
  const learningCount = rows.filter((r) => !r.lastCorrect && r.wrongCount < 2).length;
  const masteredCount = rows.filter((r) => r.lastCorrect).length;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      // Leitner filter
      if (leitnerBox === "urgent") {
        if (r.lastCorrect || r.wrongCount < 2) return false;
      } else if (leitnerBox === "learning") {
        if (r.lastCorrect || r.wrongCount >= 2) return false;
      } else if (leitnerBox === "mastered") {
        if (!r.lastCorrect) return false;
      } else {
        // "all" active
        if (r.lastCorrect) return false;
      }

      // Skill filter
      if (skillFilter !== "الكل" && (r.skill || r.topic || "") !== skillFilter) {
        return false;
      }

      return true;
    });
  }, [rows, leitnerBox, skillFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function startResolveQueue(items: MRow[]) {
    if (!items.length) return;
    setQueue([...items]);
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
      setVerdict({
        correct: j.correct,
        correctIndex: j.correctIndex,
        explanation: j.explanation,
      });
      setRevealed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ أثناء تسجيل الإجابة");
    }
  }

  function nextResolve() {
    if (qi + 1 >= queue.length) {
      setMode("list");
      void load();
      return;
    }
    setQi((i) => i + 1);
    setChosen(null);
    setRevealed(false);
    setVerdict(null);
  }

  // ================= RESOLVE RUNNER =================
  if (mode === "resolve" && current) {
    const q: QuestionCardData = {
      id: current.questionId,
      domain: current.domain,
      subject: current.subject,
      topic: current.topic,
      skill: current.skill,
      difficulty: current.difficulty,
      text: current.text,
      options: current.options,
    };

    return (
      <main className="max-w-2xl mx-auto pt-2 space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[color:var(--surface-2)] grid place-items-center text-[color:var(--gold)]">
              <RefreshCw size={16} />
            </span>
            <h1 className="text-base font-black">
              إعادة حل الأخطاء ({qi + 1} من {queue.length})
            </h1>
          </div>
          <button
            className="text-xs px-3 py-1.5 rounded-xl bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-white"
            onClick={() => {
              setMode("list");
              void load();
            }}
          >
            خروج
          </button>
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
            <div className="space-y-3 pt-2">
              {!verdict?.correct && (
                <MistakeTutor
                  topic={current.skill || current.topic || "مهارة عامة"}
                  wrongText={chosen !== null ? current.options[chosen] || "" : ""}
                  correctText={
                    verdict ? current.options[verdict.correctIndex] || "" : ""
                  }
                  explanation={verdict?.explanation || ""}
                />
              )}

              <button
                onClick={nextResolve}
                className="w-full rounded-2xl py-3.5 text-sm font-black transition-transform active:scale-[0.98] shadow-md"
                style={{
                  background: "var(--gold-cta)",
                  color: "#3a2b06",
                }}
              >
                {qi + 1 >= queue.length ? "إتمام الجلسة وعرض الصندوق" : "السؤال التالي"}
              </button>
            </div>
          )}
        </QuestionCard>

        {error && <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 text-xs">{error}</div>}
      </main>
    );
  }

  // ================= MAIN MISTAKES LIST =================
  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="w-9 h-9 rounded-xl grid place-items-center bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-white transition-colors"
          >
            <ArrowRight size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <Wrench className="text-[color:var(--gold)]" size={22} />
              صندوق الأخطاء والتكرار المتباعد
            </h1>
            <p className="text-xs text-[color:var(--muted)]">
              نظام لايتنر الذكي: تحويل الأخطاء المتكررة إلى نقاط قوة راسخة
            </p>
          </div>
        </div>
      </div>

      {/* Leitner 3-Boxes Bento Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Box 1: Urgent */}
        <button
          onClick={() => {
            setLeitnerBox("urgent");
            setPage(1);
          }}
          type="button"
          className={[
            "p-3 rounded-2xl border text-center transition-all flex flex-col justify-between min-h-[92px]",
            leitnerBox === "urgent"
              ? "border-red-500 bg-red-500/15 shadow-md shadow-red-500/10"
              : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-red-500/40",
          ].join(" ")}
        >
          <div className="flex items-center justify-center gap-1 text-[11px] text-red-400 font-bold">
            <ShieldAlert size={13} />
            <span>صندوق 1</span>
          </div>
          <div className="text-2xl font-black text-red-400 font-mono my-0.5">
            {urgentCount}
          </div>
          <small className="text-[10px] text-[color:var(--muted)]">مراجعة عاجلة (×2+)</small>
        </button>

        {/* Box 2: Learning */}
        <button
          onClick={() => {
            setLeitnerBox("learning");
            setPage(1);
          }}
          type="button"
          className={[
            "p-3 rounded-2xl border text-center transition-all flex flex-col justify-between min-h-[92px]",
            leitnerBox === "learning"
              ? "border-amber-500 bg-amber-500/15 shadow-md shadow-amber-500/10"
              : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-amber-500/40",
          ].join(" ")}
        >
          <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 font-bold">
            <Layers size={13} />
            <span>صندوق 2</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono my-0.5">
            {learningCount}
          </div>
          <small className="text-[10px] text-[color:var(--muted)]">قيد التثبيت</small>
        </button>

        {/* Box 3: Mastered */}
        <button
          onClick={() => {
            setLeitnerBox("mastered");
            setPage(1);
          }}
          type="button"
          className={[
            "p-3 rounded-2xl border text-center transition-all flex flex-col justify-between min-h-[92px]",
            leitnerBox === "mastered"
              ? "border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10"
              : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-emerald-500/40",
          ].join(" ")}
        >
          <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-bold">
            <CheckCircle2 size={13} />
            <span>صندوق 3</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono my-0.5">
            {masteredCount}
          </div>
          <small className="text-[10px] text-[color:var(--muted)]">تم الإتقان 🏆</small>
        </button>
      </div>

      {/* Weakness Matrix Insight Banner */}
      {weaknessMatrix.length > 0 && (
        <section className="rounded-2xl p-4 bg-[color:var(--surface-2)] border border-[color:var(--gold-border)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <b className="font-bold flex items-center gap-1.5 text-[color:var(--gold)]">
              <Brain size={15} />
              مصفوفة نقاط الضعف الأكثر احتياجاً للتركيز:
            </b>
            <span className="text-[10px] text-[color:var(--muted)]">وفق خوارزمية قياس</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {weaknessMatrix.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setSkillFilter(item.name);
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[color:var(--surface-3)] text-xs font-semibold hover:border-[color:var(--gold-border)] border border-transparent transition-all"
              >
                <span>{item.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono">
                  {item.count} أخطاء
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Action Button: Re-Solve Filtered Mistakes */}
      {filtered.length > 0 && leitnerBox !== "mastered" && (
        <button
          onClick={() => startResolveQueue(filtered)}
          type="button"
          className="w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[color:var(--gold-soft)]"
          style={{
            background: "var(--gold-cta)",
            color: "#3a2b06",
          }}
        >
          <RefreshCw size={17} />
          إعادة حل أسئلة {leitnerBox === "urgent" ? "المراجعة العاجلة" : leitnerBox === "learning" ? "التثبيت" : "الأخطاء النشطة"} ({filtered.length})
        </button>
      )}

      {/* Skill Filters */}
      <div className="bento-card p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
          <span>تصفية حسب المهارة:</span>
          {skillFilter !== "الكل" && (
            <button
              onClick={() => setSkillFilter("الكل")}
              className="text-[10px] text-[color:var(--gold)] hover:underline"
            >
              إلغاء التصفية
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {skills.map((k) => (
            <button
              key={k}
              onClick={() => {
                setSkillFilter(k);
                setPage(1);
              }}
              className={[
                "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                skillFilter === k
                  ? "bg-[color:var(--gold)] text-black"
                  : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--gold-border)]",
              ].join(" ")}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bento-card p-10 text-center text-xs text-[color:var(--muted)]">
          جاري مزامنة صندوق الأخطاء...
        </div>
      )}

      {error && <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-400 text-xs">{error}</div>}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bento-card p-10 text-center space-y-3">
          <Trophy size={44} className="mx-auto text-[color:var(--gold)]" />
          <h2 className="text-base font-bold">
            {leitnerBox === "mastered"
              ? "لم تنتهِ من تثبيت أسئلة بعد — أعد حل أخطائك لنقلها إلى هنا!"
              : "لا توجد أخطاء في هذا الصندوق حالياً — أداء استثنائي!"}
          </h2>
          <div className="flex gap-2 justify-center pt-2">
            <Link
              href="/portal/self-challenge"
              className="px-4 py-2 rounded-xl bg-[color:var(--gold)] text-black font-bold text-xs"
            >
              تحدي ذاتي جديد
            </Link>
            <Link
              href="/portal/formulas"
              className="px-4 py-2 rounded-xl bg-[color:var(--surface-2)] text-[color:var(--muted)] font-bold text-xs"
            >
              مراجعة القوانين
            </Link>
          </div>
        </div>
      )}

      {/* Mistakes Cards Grid */}
      <div className="space-y-3">
        {pageRows.map((r) => (
          <div
            key={r.questionId}
            className="bento-card p-4 space-y-2.5 hover:border-[color:var(--gold-border)] transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[color:var(--surface-2)] px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--gold)]">
                  {r.skill || r.topic || "عام"}
                </span>
                {r.wrongCount >= 2 ? (
                  <span className="rounded-full bg-red-500/20 text-red-400 px-2 py-0.5 text-[10px] font-bold">
                    تكرر {r.wrongCount} مرات
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-[10px] font-bold">
                    خطأ مرة واحدة
                  </span>
                )}
              </div>

              {r.lastCorrect ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} />
                  أتممته
                </span>
              ) : (
                <button
                  onClick={() => startResolveQueue([r])}
                  className="px-3 py-1 rounded-xl bg-[color:var(--surface-3)] text-xs font-bold hover:bg-[color:var(--gold-soft)] hover:text-[color:var(--gold)] transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  إعادة الحل
                </button>
              )}
            </div>

            <p className="text-xs font-medium leading-relaxed text-[color:var(--text)] line-clamp-2">
              {r.text}
            </p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-xl bg-[color:var(--surface-2)] text-xs font-bold disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronRight size={14} />
            السابق
          </button>
          <span className="text-[color:var(--muted)] text-xs font-mono">
            صفحة {page} من {pageCount}
          </span>
          <button
            disabled={page >= pageCount}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-xl bg-[color:var(--surface-2)] text-xs font-bold disabled:opacity-40 flex items-center gap-1"
          >
            التالي
            <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
