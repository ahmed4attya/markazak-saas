"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Swords,
  Timer,
  Zap,
  ArrowRight,
  Flame,
  CheckCircle2,
  XCircle,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  ChevronLeft,
  Lightbulb,
  Check,
} from "lucide-react";

interface Question {
  id: string;
  domain: string;
  subject?: string;
  topic?: string;
  skill?: string;
  difficulty?: number;
  kind?: string;
  text: string;
  options: string[];
}

const DOMAINS = [
  { id: "quant", label: "قدرات كمي", desc: "جبر، هندسة، حساب، وإحصاء", icon: "📐" },
  { id: "verbal", label: "قدرات لفظي", desc: "تناظر، سياقي، واستيعاب مقروء", icon: "📖" },
  { id: "achievement", label: "تحصيلي علمي", desc: "رياضيات، فيزياء، وكيمياء", icon: "🔬" },
  { id: "all", label: "تحدي شامل", desc: "مختلط من كافة الأقسام", icon: "⚡" },
];

const SKILLS_MAP: Record<string, string[]> = {
  quant: ["الكل", "جبر", "هندسة", "حساب", "إحصاء", "حركة وسرعة", "نسب مئوية"],
  verbal: ["الكل", "تناظر لفظي", "إكمال الجمل", "الخطأ السياقي", "استيعاب المقروء", "المفردة الشاذة"],
  achievement: ["الكل", "رياضيات", "فيزياء", "كيمياء", "أحياء"],
  all: ["الكل"],
};

const COUNTS = [5, 10, 15, 20];
const TIMES = [
  { sec: 180, label: "3 دقائق (تحدي البرق ⚡)" },
  { sec: 300, label: "5 دقائق (قياسي ⏱️)" },
  { sec: 600, label: "10 دقائق (مريح 🧘)" },
  { sec: 0, label: "بدون توقيت (تدريب حر 🎯)" },
];

export default function SelfChallengePage() {
  const [stage, setStage] = useState<"setup" | "running" | "result">("setup");

  // Setup options
  const [domain, setDomain] = useState("quant");
  const [skill, setSkill] = useState("الكل");
  const [count, setCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(300); // 5 min
  const [difficulty, setDifficulty] = useState(0);

  // Challenge runtime state
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenOption, setChosenOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verdict, setVerdict] = useState<{
    correct: boolean;
    correctIndex: number;
    explanation: string | null;
  } | null>(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Result state
  const [resultData, setResultData] = useState<{
    score: number;
    total: number;
    percent: number;
    pointsEarned: number;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer runner
  useEffect(() => {
    if (stage !== "running" || timeLimit === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          void handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, timeLimit]);

  const handleStartChallenge = async () => {
    setLoading(true);
    setError("");
    try {
      const qParams = new URLSearchParams({
        count: String(count),
        domain: domain === "all" ? "" : domain,
        skill: skill === "الكل" ? "" : skill,
        difficulty: String(difficulty),
      });

      const r = await fetch(`/api/learner/self-challenge?${qParams.toString()}`);
      const data = await r.json();

      if (!r.ok || !data.questions || data.questions.length === 0) {
        throw new Error(data.error || "لم تتوفر أسئلة كافية لهذا المسار حالياً");
      }

      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setScore(0);
      setChosenOption(null);
      setRevealed(false);
      setVerdict(null);
      setTimeLeft(timeLimit);
      setTimeSpent(0);
      setStage("running");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء بدء التحدي");
    } finally {
      setLoading(false);
    }
  };

  const handleChooseOption = async (optionIndex: number) => {
    if (revealed || !questions[currentIndex]) return;
    setChosenOption(optionIndex);

    try {
      const r = await fetch("/api/learner/self-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId: questions[currentIndex].id,
          chosen: optionIndex,
        }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "تعذر التحقق من الإجابة");

      setVerdict({
        correct: data.correct,
        correctIndex: data.correctIndex,
        explanation: data.explanation,
      });

      if (data.correct) {
        setScore((prev) => prev + 1);
      }
      setRevealed(true);
    } catch (err: any) {
      setError(err.message || "خطأ أثناء تسجيل الإجابة");
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setChosenOption(null);
      setRevealed(false);
      setVerdict(null);
    } else {
      void handleFinishChallenge();
    }
  };

  const handleTimeUp = async () => {
    await handleFinishChallenge();
  };

  const handleFinishChallenge = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLoading(true);

    try {
      const r = await fetch("/api/learner/self-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          finish: true,
          timeSpentSeconds: timeSpent,
        }),
      });

      const data = await r.json();
      if (r.ok) {
        setResultData({
          score: data.score,
          total: data.total || questions.length,
          percent: data.percent,
          pointsEarned: data.pointsEarned || 20,
        });
      } else {
        // Fallback computation
        setResultData({
          score,
          total: questions.length,
          percent: Math.round((score / Math.max(1, questions.length)) * 100),
          pointsEarned: score * 5 + 10,
        });
      }
      setStage("result");
    } catch {
      setResultData({
        score,
        total: questions.length,
        percent: Math.round((score / Math.max(1, questions.length)) * 100),
        pointsEarned: score * 5,
      });
      setStage("result");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-5 pb-8">
      {/* ================= STAGE 1: SETUP ================= */}
      {stage === "setup" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
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
                  <Swords className="text-[color:var(--gold)]" size={22} />
                  التحدي الذاتي المخصص
                </h1>
                <p className="text-xs text-[color:var(--muted)]">
                  خصص تحديك بنفسك: اختر القسم والمهارة وسرعة الإجابة واختبر جاهزيتك
                </p>
              </div>
            </div>
          </div>

          {/* Domain Picker */}
          <section className="space-y-2">
            <label className="text-xs font-bold text-[color:var(--muted)] block">
              1. اختر مسار التحدي:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {DOMAINS.map((d) => {
                const active = domain === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDomain(d.id);
                      setSkill("الكل");
                    }}
                    type="button"
                    className={[
                      "p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3",
                      active
                        ? "border-[color:var(--gold)] bg-[color:var(--gold-soft)] shadow-md shadow-[color:var(--gold-soft)]/20"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--gold-border)]",
                    ].join(" ")}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">{d.icon}</span>
                    <div className="min-w-0">
                      <b className="block text-xs font-bold">{d.label}</b>
                      <small className="block text-[10px] text-[color:var(--muted)] truncate mt-0.5">
                        {d.desc}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Skill Filter Chips */}
          <section className="space-y-2">
            <label className="text-xs font-bold text-[color:var(--muted)] block">
              2. المهارة المستهدفة:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(SKILLS_MAP[domain] || ["الكل"]).map((s) => {
                const active = skill === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSkill(s)}
                    type="button"
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                      active
                        ? "bg-[color:var(--gold)] text-black font-bold shadow-sm"
                        : "bg-[color:var(--surface-2)] text-[color:var(--muted)] border border-[color:var(--border)] hover:border-[color:var(--gold-border)]",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question Count & Time Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bento-card p-4 space-y-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Zap size={14} className="text-[color:var(--gold)]" />
                عدد الأسئلة:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCount(c)}
                    className={[
                      "py-2 rounded-xl text-xs font-bold border transition-all text-center",
                      count === c
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-black"
                        : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)]",
                    ].join(" ")}
                  >
                    {c} أسئلة
                  </button>
                ))}
              </div>
            </div>

            <div className="bento-card p-4 space-y-2">
              <label className="text-xs font-bold flex items-center gap-1.5">
                <Timer size={14} className="text-[color:var(--gold)]" />
                المهلة الزمنية:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TIMES.map((t) => (
                  <button
                    key={t.sec}
                    type="button"
                    onClick={() => setTimeLimit(t.sec)}
                    className={[
                      "py-2 px-2 rounded-xl text-[10px] font-bold border transition-all text-center truncate",
                      timeLimit === t.sec
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)] text-black"
                        : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)]",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Launch Button */}
          <button
            onClick={handleStartChallenge}
            disabled={loading}
            type="button"
            className="w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-[color:var(--gold-soft)]"
            style={{
              background: "var(--gold-cta)",
              color: "#3a2b06",
            }}
          >
            {loading ? (
              <span>جاري تجهيز بنك الأسئلة...</span>
            ) : (
              <>
                <Flame size={20} />
                انطلق في التحدي الآن ({count} أسئلة)
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* ================= STAGE 2: RUNNING ARENA ================= */}
      {stage === "running" && currentQuestion && (
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {/* Top HUD Bar */}
          <div className="bento-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[color:var(--muted)]">
                السؤال {currentIndex + 1} من {questions.length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--surface-3)] font-mono text-[color:var(--gold)]">
                {currentQuestion.skill || currentQuestion.domain}
              </span>
            </div>

            {/* Timer HUD */}
            {timeLimit > 0 && (
              <div
                className={[
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all",
                  timeLeft <= 30
                    ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/50"
                    : "bg-[color:var(--surface-2)] text-[color:var(--gold)] border border-[color:var(--border)]",
                ].join(" ")}
              >
                <Timer size={14} />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            {/* Live Score */}
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
              <Trophy size={14} />
              <span>{score} صحيحة</span>
            </div>
          </div>

          {/* Progress Tracker Dots */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-1.5 flex-1 rounded-full transition-all",
                  i === currentIndex
                    ? "bg-[color:var(--gold)]"
                    : i < currentIndex
                    ? "bg-emerald-500"
                    : "bg-[color:var(--surface-3)]",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Question Text */}
          <div className="bento-card p-6 space-y-4">
            <p className="text-base font-bold leading-relaxed text-[color:var(--text)]">
              {currentQuestion.text}
            </p>

            {/* Options */}
            <div className="space-y-2.5 pt-2">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = chosenOption === optIdx;
                const isCorrect = verdict && verdict.correctIndex === optIdx;
                const isWrong = verdict && isSelected && !verdict.correct;

                let btnStyle = "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text)] hover:border-[color:var(--gold-border)]";

                if (revealed) {
                  if (isCorrect) {
                    btnStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold";
                  } else if (isWrong) {
                    btnStyle = "border-red-500 bg-red-500/15 text-red-300 font-bold";
                  } else {
                    btnStyle = "border-transparent bg-[color:var(--surface-2)] opacity-40";
                  }
                } else if (isSelected) {
                  btnStyle = "border-[color:var(--gold)] bg-[color:var(--gold-soft)] text-white";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleChooseOption(optIdx)}
                    disabled={revealed}
                    type="button"
                    className={`w-full p-4 rounded-2xl border text-right text-sm transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[color:var(--surface-3)] grid place-items-center text-xs font-mono font-bold shrink-0">
                        {["أ", "ب", "ج", "د"][optIdx] || optIdx + 1}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {revealed && isCorrect && (
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    )}
                    {revealed && isWrong && (
                      <XCircle size={18} className="text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation if Revealed */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                {verdict?.explanation && (
                  <div className="rounded-2xl p-4 bg-[color:var(--surface-2)] border border-[color:var(--gold-border)] space-y-1.5">
                    <b className="text-xs font-bold text-[color:var(--gold)] flex items-center gap-1.5">
                      <Lightbulb size={15} />
                      الشرح وطريقة الحل الذكية:
                    </b>
                    <p className="text-xs text-[color:var(--text-soft)] leading-relaxed">
                      {verdict.explanation}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleNextQuestion}
                  type="button"
                  className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                  style={{
                    background: "var(--gold-cta)",
                    color: "#3a2b06",
                  }}
                >
                  {currentIndex + 1 < questions.length ? (
                    <>
                      السؤال التالي
                      <ChevronLeft size={18} />
                    </>
                  ) : (
                    <>
                      <Trophy size={18} />
                      إنهاء التحدي وعرض التتويج
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ================= STAGE 3: RESULT & PODIUM ================= */}
      {stage === "result" && resultData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5 text-center"
        >
          {/* Trophy Header Card */}
          <section
            className="rounded-3xl p-6 relative overflow-hidden border border-[color:var(--gold-border)]"
            style={{
              background:
                "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
            }}
          >
            <div
              className="absolute -top-16 -left-16 w-52 h-52 rounded-full"
              style={{
                background: "var(--gold-soft)",
                filter: "blur(60px)",
              }}
            />

            <div className="w-16 h-16 rounded-2xl mx-auto grid place-items-center mb-3 text-3xl shadow-lg" style={{ background: "var(--gold-cta)" }}>
              🏆
            </div>

            <h1 className="text-2xl font-black mb-1">اكتمل التحدي الذاتي!</h1>
            <p className="text-xs text-[color:var(--muted)]">
              أداء رائع ومحاولة مميزة في طريق الوصول لدرجة 95+ في قياس
            </p>

            {/* Score Ring / Numbers */}
            <div className="my-5 flex items-center justify-center gap-8">
              <div>
                <p className="text-[11px] text-[color:var(--muted)]">النسبة المئوية</p>
                <div className="flex items-baseline justify-center gap-0.5">
                  <NumberFlow
                    value={resultData.percent}
                    className="text-5xl font-black text-[color:var(--gold)] font-mono"
                  />
                  <span className="text-xl font-bold text-[color:var(--gold)]">%</span>
                </div>
              </div>
              <div className="w-px h-12 bg-[color:var(--border)]" />
              <div>
                <p className="text-[11px] text-[color:var(--muted)]">الأسئلة الصحيحة</p>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  {resultData.score} / {resultData.total}
                </div>
              </div>
            </div>

            {/* Points Award Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[color:var(--gold-soft)] border border-[color:var(--gold-border)] text-[color:var(--gold)] text-xs font-bold">
              <Award size={15} />
              <span>+{resultData.pointsEarned} نقطة أُضيفت إلى رصيدك!</span>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStage("setup")}
              type="button"
              className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-[color:var(--surface-2)] border border-[color:var(--border)] hover:border-[color:var(--gold-border)] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              تحدي جديد
            </button>

            <Link
              href="/portal/formulas"
              className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-[color:var(--surface-2)] border border-[color:var(--border)] hover:border-[color:var(--gold-border)] transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="text-[color:var(--gold)]" />
              مراجعة القوانين
            </Link>
          </div>

          <Link
            href="/portal"
            className="block w-full py-3.5 rounded-2xl font-black text-xs text-center border border-[color:var(--gold-border)] bg-[color:var(--gold-soft)] text-[color:var(--gold)]"
          >
            العودة إلى لوحة تحكم الطالب
          </Link>
        </motion.div>
      )}
    </div>
  );
}
