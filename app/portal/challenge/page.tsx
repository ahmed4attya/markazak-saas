"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Swords,
  Share2,
  Copy,
  Check,
  ArrowRight,
  Flame,
  Trophy,
  Users,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Award,
} from "lucide-react";

interface Question {
  id: string;
  domain: string;
  topic?: string;
  skill?: string;
  text: string;
  options: string[];
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  total: number;
  durationSec: number;
  isMe: boolean;
}

function ChallengeContent() {
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get("code") || "").trim().toUpperCase();

  const [code, setCode] = useState(initialCode);
  const [inputCode, setInputCode] = useState("");
  const [domain, setDomain] = useState("all");
  const [copied, setCopied] = useState(false);

  // Match State
  const [state, setState] = useState<"lobby" | "playing" | "leaderboard">("lobby");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenOption, setChosenOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [verdict, setVerdict] = useState<{ correct: boolean; correctIndex: number; explanation: string | null } | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myScore, setMyScore] = useState<number | null>(null);

  // Auto-join if code is in URL
  useEffect(() => {
    if (initialCode) {
      void handleJoinMatch(initialCode);
    }
  }, [initialCode]);

  // Create Challenge
  const handleCreateChallenge = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/learner/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", domain }),
      });
      const data = await r.json();
      if (!r.ok || !data.code) throw new Error(data.error || "تعذر إنشاء التحدي");

      setCode(data.code);
      void handleJoinMatch(data.code);
    } catch (err: any) {
      setError(err.message || "خطأ أثناء إنشاء التحدي");
      setLoading(false);
    }
  };

  // Join Match by Code
  const handleJoinMatch = async (targetCode: string) => {
    setLoading(true);
    setError("");
    try {
      const cleanCode = targetCode.trim().toUpperCase();
      const r = await fetch(`/api/learner/challenge?code=${cleanCode}`);
      const data = await r.json();

      if (!r.ok) throw new Error(data.error || "تعذر العثور على هذا التحدي");

      setCode(data.code);
      setAttemptId(data.attemptId);
      setQuestions(data.questions || []);
      setLeaderboard(data.leaderboard || []);

      if (data.isFinished) {
        setMyScore(data.myScore);
        setState("leaderboard");
      } else {
        setCurrentIndex(0);
        setChosenOption(null);
        setRevealed(false);
        setVerdict(null);
        setState("playing");
      }
    } catch (err: any) {
      setError(err.message || "كود التحدي غير صحيح");
    } finally {
      setLoading(false);
    }
  };

  // Answer a Question
  const handleAnswer = async (optIdx: number) => {
    if (revealed || !questions[currentIndex]) return;
    setChosenOption(optIdx);

    try {
      const r = await fetch("/api/learner/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          attemptId,
          questionId: questions[currentIndex].id,
          chosen: optIdx,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "تعذر تسجيل الإجابة");

      setVerdict({
        correct: data.correct,
        correctIndex: data.correctIndex,
        explanation: data.explanation,
      });
      setRevealed(true);
    } catch (err: any) {
      setError(err.message || "خطأ أثناء تسجيل الإجابة");
    }
  };

  // Next or Finish
  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setChosenOption(null);
      setRevealed(false);
      setVerdict(null);
    } else {
      // Finish
      setLoading(true);
      try {
        const r = await fetch("/api/learner/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "finish", attemptId }),
        });
        const data = await r.json();
        setMyScore(data.score ?? null);

        // Refresh leaderboard
        const r2 = await fetch(`/api/learner/challenge?code=${code}`);
        const d2 = await r2.json();
        if (d2.leaderboard) setLeaderboard(d2.leaderboard);

        setState("leaderboard");
      } catch {
        setState("leaderboard");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/portal/challenge?code=${code}`;
    const shareText = `⚔️ أتحدّاك في جولة قياس (5 أسئلة) عبر سنتر الخوارزمي!\n\n📌 كود التحدي: ${code}\n🔗 رابط الدخول المباشر: ${shareUrl}`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareViaWhatsApp = () => {
    const shareUrl = `${window.location.origin}/portal/challenge?code=${code}`;
    const shareText = encodeURIComponent(
      `⚔️ أتحدّاك في جولة قياس (5 أسئلة) عبر سنتر الخوارزمي!\n\n📌 كود التحدي: ${code}\n🔗 الرابط: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${shareText}`, "_blank");
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-5 pb-8">
      {/* ================= LOBBY ================= */}
      {state === "lobby" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
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
                  تحدي الأصدقاء 1v1
                </h1>
                <p className="text-xs text-[color:var(--muted)]">
                  أنشئ جولة تحدٍّ من 5 أسئلة وشارك الكود مع صديقك للمنافسة المباشرة!
                </p>
              </div>
            </div>
          </div>

          {/* Join with Code Card */}
          <section className="bento-card p-5 space-y-3">
            <h2 className="text-xs font-bold flex items-center gap-1.5 text-[color:var(--gold)]">
              <Users size={15} />
              هل استلمت كود تحدٍّ من صديق؟
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="أدخل الكود (مثال: KZ-7A4B)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-2xl px-4 py-3 text-center text-sm font-mono font-bold tracking-widest outline-none focus:border-[color:var(--gold)]"
              />
              <button
                onClick={() => handleJoinMatch(inputCode)}
                disabled={loading || !inputCode.trim()}
                type="button"
                className="px-5 py-3 rounded-2xl font-bold text-xs bg-[color:var(--gold)] text-black disabled:opacity-40"
              >
                دخول
              </button>
            </div>
          </section>

          <div className="text-center text-xs text-[color:var(--muted)] font-semibold">— أو —</div>

          {/* Create New Challenge Card */}
          <section className="bento-card p-5 space-y-4">
            <h2 className="text-xs font-bold flex items-center gap-1.5 text-[color:var(--text)]">
              <Flame size={16} className="text-orange-400" />
              إنشاء غرفة تحدٍّ جديدة:
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "شامل قياس" },
                { id: "quant", label: "كمي فقط" },
                { id: "verbal", label: "لفظي فقط" },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDomain(d.id)}
                  type="button"
                  className={[
                    "py-2.5 rounded-xl text-xs font-bold border transition-all text-center",
                    domain === d.id
                      ? "border-[color:var(--gold)] bg-[color:var(--gold-soft)] text-[color:var(--gold)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)]",
                  ].join(" ")}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateChallenge}
              disabled={loading}
              type="button"
              className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md"
              style={{
                background: "var(--gold-cta)",
                color: "#3a2b06",
              }}
            >
              <Swords size={18} />
              {loading ? "جاري إنشاء الغرفة..." : "أنشئ غرفة التحدي الآن"}
            </button>
          </section>

          {error && <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-400 text-xs text-center">{error}</div>}
        </motion.div>
      )}

      {/* ================= PLAYING ARENA ================= */}
      {state === "playing" && currentQ && (
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Header Bar */}
          <div className="bento-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[color:var(--muted)]">
                السؤال {currentIndex + 1} من {questions.length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--surface-3)] font-mono text-[color:var(--gold)]">
                كود: {code}
              </span>
            </div>
            <button
              onClick={shareViaWhatsApp}
              className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-xl"
            >
              <Share2 size={12} />
              دعوة صديق
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1">
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

          {/* Question Text & Options */}
          <div className="bento-card p-6 space-y-4">
            <p className="text-base font-bold leading-relaxed">{currentQ.text}</p>

            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = chosenOption === optIdx;
                const isCorrect = verdict && verdict.correctIndex === optIdx;
                const isWrong = verdict && isSelected && !verdict.correct;

                let btnStyle = "border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text)]";

                if (revealed) {
                  if (isCorrect) btnStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold";
                  else if (isWrong) btnStyle = "border-red-500 bg-red-500/15 text-red-300 font-bold";
                  else btnStyle = "border-transparent bg-[color:var(--surface-2)] opacity-40";
                } else if (isSelected) {
                  btnStyle = "border-[color:var(--gold)] bg-[color:var(--gold-soft)] text-white";
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswer(optIdx)}
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

                    {revealed && isCorrect && <CheckCircle2 size={18} className="text-emerald-400" />}
                    {revealed && isWrong && <XCircle size={18} className="text-red-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation & Next */}
          <AnimatePresence>
            {revealed && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {verdict?.explanation && (
                  <div className="rounded-2xl p-4 bg-[color:var(--surface-2)] border border-[color:var(--gold-border)] text-xs space-y-1">
                    <b className="font-bold text-[color:var(--gold)] flex items-center gap-1">
                      <Lightbulb size={14} /> الشرح السريع:
                    </b>
                    <p className="text-[color:var(--text-soft)] leading-relaxed">{verdict.explanation}</p>
                  </div>
                )}

                <button
                  onClick={handleNext}
                  type="button"
                  className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md"
                  style={{ background: "var(--gold-cta)", color: "#3a2b06" }}
                >
                  {currentIndex + 1 < questions.length ? "السؤال التالي" : "عرض قائمة المتصدرين 🏆"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ================= LEADERBOARD PODIUM ================= */}
      {state === "leaderboard" && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center">
          <section
            className="rounded-3xl p-6 relative overflow-hidden border border-[color:var(--gold-border)]"
            style={{
              background: "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
            }}
          >
            <div className="w-14 h-14 rounded-2xl mx-auto grid place-items-center mb-3 text-3xl shadow-lg" style={{ background: "var(--gold-cta)" }}>
              ⚔️
            </div>

            <h1 className="text-xl font-black">نتائج التحدي: {code}</h1>
            <p className="text-xs text-[color:var(--muted)] mt-1">
              {myScore !== null ? `أحرزت ${myScore} من 5 إجابات صحيحة!` : "قائمة المتنافسين"}
            </p>

            {/* Share Code Card */}
            <div className="mt-4 p-3 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--border)] flex items-center justify-between gap-2">
              <span className="font-mono text-base font-black text-[color:var(--gold)] tracking-wider">
                {code}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-1.5 rounded-xl bg-[color:var(--surface-3)] text-xs font-bold hover:text-white transition-colors flex items-center gap-1"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                >
                  <Share2 size={14} />
                  <span>واتساب</span>
                </button>
              </div>
            </div>
          </section>

          {/* Leaderboard Table */}
          <section className="bento-card p-4 space-y-3 text-right">
            <h2 className="text-xs font-bold text-[color:var(--gold)] flex items-center gap-1.5">
              <Trophy size={14} />
              ترتيب المتنافسين في هذه الجولة:
            </h2>

            {leaderboard.length === 0 ? (
              <p className="text-xs text-[color:var(--muted)] text-center py-4">
                شارك الكود مع صديقك ليظهر ترتيبكما هنا فور إنهائه للتحدي!
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, idx) => (
                  <div
                    key={entry.userId}
                    className={[
                      "p-3 rounded-2xl border flex items-center justify-between",
                      entry.isMe
                        ? "border-[color:var(--gold)] bg-[color:var(--gold-soft)]"
                        : "border-[color:var(--border)] bg-[color:var(--surface-2)]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[color:var(--surface-3)] grid place-items-center text-xs font-bold font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <b className="text-xs block">
                          {entry.userName} {entry.isMe && "(أنت)"}
                        </b>
                        <small className="text-[10px] text-[color:var(--muted)]">
                          في {entry.durationSec} ثانية
                        </small>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-sm font-black text-[color:var(--gold)]">
                        {entry.score}
                      </span>
                      <span className="text-xs text-[color:var(--muted)]"> / {entry.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Action Back */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setState("lobby");
                setInputCode("");
              }}
              type="button"
              className="flex-1 py-3.5 rounded-2xl text-xs font-bold bg-[color:var(--surface-2)] border border-[color:var(--border)]"
            >
              تحدٍّ جديد
            </button>
            <Link
              href="/portal"
              className="flex-1 py-3.5 rounded-2xl text-xs font-black text-center bg-[color:var(--gold)] text-black"
            >
              لوحة التحكم
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ChallengePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[color:var(--muted)]">جاري تحميل ميدان التحدي...</div>}>
      <ChallengeContent />
    </Suspense>
  );
}
