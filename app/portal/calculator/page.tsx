"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Calculator,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Sliders,
  Target,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Building2,
  Share2,
} from "lucide-react";

interface TrackPreset {
  id: string;
  name: string;
  university: string;
  tag: string;
  weights: {
    school: number; // ثانوي
    gat: number; // قدرات
    tahsili: number; // تحصيلي
  };
}

const PRESETS: TrackPreset[] = [
  {
    id: "sci_standard",
    name: "المسار العلمي المعتمد",
    university: "أغلب الجامعات السعودية",
    tag: "علمي عام",
    weights: { school: 30, gat: 30, tahsili: 40 },
  },
  {
    id: "kfupm",
    name: "جامعة الملك فهد للبترول والمعادن",
    university: "KFUPM",
    tag: "هندسة وتقنية",
    weights: { school: 20, gat: 40, tahsili: 40 },
  },
  {
    id: "ksu_health",
    name: "جامعة الملك سعود (الكليات الصحية والعلمية)",
    university: "KSU",
    tag: "صحي وعلمي",
    weights: { school: 30, gat: 30, tahsili: 40 },
  },
  {
    id: "kau_sci",
    name: "جامعة الملك عبدالعزيز (المسار العلمي)",
    university: "KAU",
    tag: "علمي",
    weights: { school: 40, gat: 30, tahsili: 30 },
  },
  {
    id: "iau",
    name: "جامعة الإمام عبدالرحمن بن فيصل",
    university: "IAU",
    tag: "علمي وصحي",
    weights: { school: 30, gat: 30, tahsili: 40 },
  },
  {
    id: "lit_standard",
    name: "المسار الإنساني والأدبي",
    university: "الجامعات الحكومية",
    tag: "أدبي",
    weights: { school: 40, gat: 40, tahsili: 20 },
  },
  {
    id: "pnu_arts",
    name: "جامعة الأميرة نورة (المسار الإنساني)",
    university: "PNU",
    tag: "أدبي وإنساني",
    weights: { school: 50, gat: 25, tahsili: 25 },
  },
  {
    id: "custom",
    name: "أوزان مخصصة",
    university: "حسب رغبتك",
    tag: "مخصص",
    weights: { school: 30, gat: 30, tahsili: 40 },
  },
];

export default function CalculatorPage() {
  const [selectedTrack, setSelectedTrack] = useState<string>("sci_standard");
  const [weights, setWeights] = useState({ school: 30, gat: 30, tahsili: 40 });
  const [scores, setScores] = useState({ school: "", gat: "", tahsili: "" });
  const [targetScore, setTargetScore] = useState<string>("");
  const [targetField, setTargetField] = useState<"gat" | "tahsili">("gat");
  const [copied, setCopied] = useState(false);

  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  const parseNum = (v: string) => clamp(Number(v) || 0);

  const schoolScore = parseNum(scores.school);
  const gatScore = parseNum(scores.gat);
  const tahsiliScore = parseNum(scores.tahsili);

  const hasAllScores =
    scores.school.trim() !== "" &&
    scores.gat.trim() !== "" &&
    scores.tahsili.trim() !== "";

  // Composite Score
  const schoolCont = (schoolScore * weights.school) / 100;
  const gatCont = (gatScore * weights.gat) / 100;
  const tahsiliCont = (tahsiliScore * weights.tahsili) / 100;
  const weightedComposite = Math.round((schoolCont + gatCont + tahsiliCont) * 100) / 100;

  // Target Reverse Calculation
  let neededTargetScore: number | null = null;
  if (targetScore.trim() !== "") {
    const target = parseNum(targetScore);
    if (targetField === "gat") {
      if (weights.gat > 0 && scores.school.trim() !== "" && scores.tahsili.trim() !== "") {
        const raw = ((target - schoolCont - tahsiliCont) * 100) / weights.gat;
        neededTargetScore = Math.round(raw * 10) / 10;
      }
    } else {
      if (weights.tahsili > 0 && scores.school.trim() !== "" && scores.gat.trim() !== "") {
        const raw = ((target - schoolCont - gatCont) * 100) / weights.tahsili;
        neededTargetScore = Math.round(raw * 10) / 10;
      }
    }
  }

  const handleSelectTrack = (preset: TrackPreset) => {
    setSelectedTrack(preset.id);
    setWeights({ ...preset.weights });
  };

  const handleCopySummary = () => {
    const trackObj = PRESETS.find((p) => p.id === selectedTrack);
    const summaryText = `🎓 حساب النسبة الموزونة - سنتر الخوارزمي\n\n📌 المسار: ${trackObj?.name || "مخصص"}\n📚 الثانوية (${weights.school}%): ${scores.school || "0"}%\n⚡ القدرات (${weights.gat}%): ${scores.gat || "0"}\n🎯 التحصيلي (${weights.tahsili}%): ${scores.tahsili || "0"}\n\n🏆 النسبة الموزونة الإجمالية: ${hasAllScores ? weightedComposite.toFixed(2) + "%" : "قيد الإدخال"}\n\nتم الحساب عبر بوابة طالب منصة الخوارزمي 🚀`;

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Tier info
  const getTier = (score: number) => {
    if (score >= 90) {
      return {
        label: "فئة النخبة والقمة 🏆",
        desc: "تنافس قوي جداً ومؤهل لكليات الطب وطب الأسنان والهندسة وعلوم الحاسب في أرقى الجامعات.",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      };
    }
    if (score >= 85) {
      return {
        label: "فئة الامتياز ⭐",
        desc: "مؤهل لجميع التخصصات الهندسية، التقنية، الكليات الصحية التطبيقية وإدارة الأعمال.",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      };
    }
    if (score >= 80) {
      return {
        label: "فئة الجيد جداً 📈",
        desc: "فرص ممتازة في معظم الكليات الجامعية العلمية والإنسانية على مستوى المملكة.",
        color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      };
    }
    return {
      label: "في مسار التطوير 🎯",
      desc: "تكثيف التدريب على اختبارات قياس والتركيز على نقاط الضعف يرفع نسبتك سريعاً.",
      color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    };
  };

  const currentTier = getTier(weightedComposite);

  return (
    <div className="space-y-5 pb-6">
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
              <Calculator className="text-[color:var(--gold)]" size={22} />
              حاسبة النسبة الموزونة للجامعات
            </h1>
            <p className="text-xs text-[color:var(--muted)]">
              أوزان القبول المعتمدة للجامعات السعودية لعام 2026 مع حاسبة الهدف العكسية
            </p>
          </div>
        </div>
      </div>

      {/* University & Track Selector Carousel */}
      <section className="space-y-2">
        <p className="text-xs font-bold text-[color:var(--muted)] flex items-center gap-1.5">
          <Building2 size={14} className="text-[color:var(--gold)]" />
          اختر المسار أو الجامعة المستهدفة:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const active = selectedTrack === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectTrack(p)}
                type="button"
                className={[
                  "text-right p-3 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[78px]",
                  active
                    ? "border-[color:var(--gold)] bg-[color:var(--gold-soft)] shadow-md shadow-[color:var(--gold-soft)]/20"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--gold-border)]",
                ].join(" ")}
              >
                <div>
                  <span className="text-[10px] font-bold text-[color:var(--gold)] block">
                    {p.tag}
                  </span>
                  <p className="text-xs font-black line-clamp-1 mt-0.5">{p.name}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[color:var(--muted)] font-mono mt-1">
                  <span>{p.weights.school}%</span>•<span>{p.weights.gat}%</span>•
                  <span>{p.weights.tahsili}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom Weights Slider if Custom Selected */}
      {selectedTrack === "custom" && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl p-4 bg-[color:var(--surface-2)] border border-[color:var(--border)] space-y-3"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1">
              <Sliders size={14} className="text-[color:var(--gold)]" />
              توزيع الأوزان المخصصة (المجموع يجب أن يساوي 100%)
            </span>
            <span
              className={[
                "font-bold font-mono px-2 py-0.5 rounded-full text-[10px]",
                weights.school + weights.gat + weights.tahsili === 100
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400",
              ].join(" ")}
            >
              المجموع: {weights.school + weights.gat + weights.tahsili}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-[color:var(--muted)] block mb-1">
                وزن الثانوية: {weights.school}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.school}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, school: Number(e.target.value) }))
                }
                className="w-full accent-[color:var(--gold)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[color:var(--muted)] block mb-1">
                وزن القدرات: {weights.gat}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.gat}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, gat: Number(e.target.value) }))
                }
                className="w-full accent-[color:var(--gold)]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[color:var(--muted)] block mb-1">
                وزن التحصيلي: {weights.tahsili}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weights.tahsili}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, tahsili: Number(e.target.value) }))
                }
                className="w-full accent-[color:var(--gold)]"
              />
            </div>
          </div>
        </motion.section>
      )}

      {/* Scores Input Grid */}
      <section className="bento-card p-5 space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <GraduationCap size={16} className="text-[color:var(--gold)]" />
          أدخل درجاتك الحالية أو المتوقعة:
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* School */}
          <div className="rounded-2xl bg-[color:var(--surface-2)] p-3 border border-[color:var(--border)]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span>نسبة الثانوية</span>
              <span className="text-[10px] text-[color:var(--gold)] font-mono">
                {weights.school}%
              </span>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              inputMode="decimal"
              value={scores.school}
              onChange={(e) => setScores({ ...scores, school: e.target.value })}
              placeholder="مثال: 98.5"
              className="w-full bg-transparent text-center text-xl font-black outline-none placeholder:text-[color:var(--muted-dim)]"
            />
            <small className="block text-center text-[10px] text-[color:var(--muted-dim)] mt-0.5">
              مساهمتها: {schoolCont.toFixed(1)}%
            </small>
          </div>

          {/* GAT */}
          <div className="rounded-2xl bg-[color:var(--surface-2)] p-3 border border-[color:var(--border)]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span>درجة القدرات العامة</span>
              <span className="text-[10px] text-[color:var(--gold)] font-mono">
                {weights.gat}%
              </span>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              inputMode="decimal"
              value={scores.gat}
              onChange={(e) => setScores({ ...scores, gat: e.target.value })}
              placeholder="مثال: 88"
              className="w-full bg-transparent text-center text-xl font-black outline-none placeholder:text-[color:var(--muted-dim)]"
            />
            <small className="block text-center text-[10px] text-[color:var(--muted-dim)] mt-0.5">
              مساهمتها: {gatCont.toFixed(1)}%
            </small>
          </div>

          {/* Tahsili */}
          <div className="rounded-2xl bg-[color:var(--surface-2)] p-3 border border-[color:var(--border)]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span>درجة التحصيلي</span>
              <span className="text-[10px] text-[color:var(--gold)] font-mono">
                {weights.tahsili}%
              </span>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              inputMode="decimal"
              value={scores.tahsili}
              onChange={(e) => setScores({ ...scores, tahsili: e.target.value })}
              placeholder="مثال: 85"
              className="w-full bg-transparent text-center text-xl font-black outline-none placeholder:text-[color:var(--muted-dim)]"
            />
            <small className="block text-center text-[10px] text-[color:var(--muted-dim)] mt-0.5">
              مساهمتها: {tahsiliCont.toFixed(1)}%
            </small>
          </div>
        </div>

        {/* Visual Weighted Stack Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-[11px] text-[color:var(--muted)]">
            <span>مخطط المساهمة في النسبة المركبة:</span>
            <span className="font-mono">{hasAllScores ? weightedComposite.toFixed(2) + "%" : "0%"}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-[color:var(--surface-3)] overflow-hidden flex">
            <div
              style={{ width: `${Math.min(100, schoolCont)}%` }}
              className="bg-emerald-500 transition-all duration-500"
              title={`الثانوية: ${schoolCont.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.min(100, gatCont)}%` }}
              className="bg-[color:var(--gold)] transition-all duration-500"
              title={`القدرات: ${gatCont.toFixed(1)}%`}
            />
            <div
              style={{ width: `${Math.min(100, tahsiliCont)}%` }}
              className="bg-sky-500 transition-all duration-500"
              title={`التحصيلي: ${tahsiliCont.toFixed(1)}%`}
            />
          </div>
          <div className="flex justify-center gap-4 text-[10px] text-[color:var(--muted)] pt-0.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              ثانوية ({schoolCont.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[color:var(--gold)] inline-block" />
              قدرات ({gatCont.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
              تحصيلي ({tahsiliCont.toFixed(1)}%)
            </span>
          </div>
        </div>
      </section>

      {/* Main Result Card */}
      <section
        className={[
          "rounded-3xl p-6 relative overflow-hidden border border-[color:var(--gold-border)] text-center",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
        }}
      >
        <div
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full"
          style={{
            background: "var(--gold-soft)",
            filter: "blur(50px)",
          }}
        />

        <p className="text-xs font-bold text-[color:var(--muted)] flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-[color:var(--gold)]" />
          النسبة الموزونة المركبة
        </p>

        <div className="my-3">
          {hasAllScores ? (
            <div className="flex items-baseline justify-center gap-1">
              <NumberFlow
                value={weightedComposite}
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="text-6xl font-black text-[color:var(--gold)] tracking-tight font-mono"
              />
              <span className="text-2xl font-bold text-[color:var(--gold)]">%</span>
            </div>
          ) : (
            <div className="text-5xl font-black text-[color:var(--muted-dim)] font-mono">
              --.-- %
            </div>
          )}
          {!hasAllScores && (
            <p className="text-xs text-[color:var(--muted)] mt-1">
              أدخل درجاتك الثلاث لحساب النسبة بدقة متناهية
            </p>
          )}
        </div>

        {/* University Tier Feedback */}
        {hasAllScores && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3.5 rounded-2xl border text-right ${currentTier.color}`}
          >
            <b className="block text-xs font-bold">{currentTier.label}</b>
            <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">
              {currentTier.desc}
            </p>
          </motion.div>
        )}

        {/* Action Share / Copy */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={handleCopySummary}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[color:var(--surface-3)] hover:bg-[color:var(--surface)] transition-colors border border-[color:var(--border)]"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                تم نسخ النتيجة بنجاح!
              </>
            ) : (
              <>
                <Copy size={14} />
                نسخ ملخص النسبة
              </>
            )}
          </button>
        </div>
      </section>

      {/* Target Forecaster (Reverse Calculator) */}
      <section className="bento-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Target size={16} className="text-[color:var(--gold)]" />
            حاسبة الهدف العكسية (ماذا لو استهدفت نسبة معينة؟)
          </h2>
          <div className="flex bg-[color:var(--surface-2)] p-0.5 rounded-xl border border-[color:var(--border)] text-[10px]">
            <button
              onClick={() => setTargetField("gat")}
              type="button"
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                targetField === "gat"
                  ? "bg-[color:var(--gold)] text-black"
                  : "text-[color:var(--muted)]"
              }`}
            >
              أحتاج بالقدرات؟
            </button>
            <button
              onClick={() => setTargetField("tahsili")}
              type="button"
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                targetField === "tahsili"
                  ? "bg-[color:var(--gold)] text-black"
                  : "text-[color:var(--muted)]"
              }`}
            >
              أحتاج بالتحصيلي؟
            </button>
          </div>
        </div>

        <p className="text-xs text-[color:var(--muted)]">
          حدد النسبة الموزونة التي تريدها لتخصص أحلامك، وسنحسب لك الدرجة الدقيقة المطلوبة في{" "}
          {targetField === "gat" ? "اختبار القدرات" : "اختبار التحصيلي"}.
        </p>

        <div className="flex gap-2">
          <input
            type="number"
            min="50"
            max="100"
            inputMode="decimal"
            value={targetScore}
            onChange={(e) => setTargetScore(e.target.value)}
            placeholder="النسبة المستهدفة (مثال: 92.5)"
            className="flex-1 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[color:var(--gold)] transition-colors"
          />
        </div>

        {neededTargetScore !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--gold-border)]"
          >
            {neededTargetScore > 100 ? (
              <div className="flex items-start gap-3 text-red-400">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                  <b className="block font-bold">الهدف يتجاوز 100%!</b>
                  <p className="mt-0.5 text-[color:var(--muted)]">
                    بهذه المعطيات تحتاج {neededTargetScore}% في{" "}
                    {targetField === "gat" ? "القدرات" : "التحصيلي"}. جرّب رفع
                    درجاتك الأخرى للوصول إلى هذا الهدف.
                  </p>
                </div>
              </div>
            ) : neededTargetScore <= 0 ? (
              <div className="flex items-start gap-3 text-emerald-400">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <div className="text-xs">
                  <b className="block font-bold">تهانينا! هدفك مضمون بالفعل 🎉</b>
                  <p className="mt-0.5 text-[color:var(--muted)]">
                    درجاتك الحالية كافية لتجاوز النسبة المستهدفة حتى لو حصلت على 0
                    في {targetField === "gat" ? "القدرات" : "التحصيلي"}!
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-xs text-[color:var(--muted)]">
                  للوصول إلى نسبة موزونة{" "}
                  <b className="text-white font-mono">{targetScore}%</b> تحتاج:
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-xs font-bold text-[color:var(--muted)]">
                    درجة لا تقل عن
                  </span>
                  <NumberFlow
                    value={neededTargetScore}
                    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                    className="text-4xl font-black text-[color:var(--gold)] font-mono mx-1"
                  />
                  <span className="text-xs font-bold text-[color:var(--muted)]">
                    في {targetField === "gat" ? "القدرات العامة" : "التحصيلي"}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 font-semibold pt-1">
                  ⚡ سنتر الخوارزمي معك خطوة بخطوة للوصول إليها وتجاوزها!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* Quick Links Back to Practice */}
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/portal/formulas"
          className="bento-card p-3.5 hover:border-[color:var(--gold-border)] transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl grid place-items-center bg-[color:var(--gold-soft)] text-[color:var(--gold)] shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <b className="text-xs block font-bold">مكتبة القوانين</b>
            <small className="text-[10px] text-[color:var(--muted)]">
              230+ قانون واختصار ذكي
            </small>
          </div>
        </Link>
        <Link
          href="/portal/training"
          className="bento-card p-3.5 hover:border-[color:var(--gold-border)] transition-colors flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl grid place-items-center bg-sky-500/10 text-sky-400 shrink-0">
            <Target size={18} />
          </div>
          <div>
            <b className="text-xs block font-bold">ابدأ التدريب الآن</b>
            <small className="text-[10px] text-[color:var(--muted)]">
              ارفع درجتك بسلاسة
            </small>
          </div>
        </Link>
      </section>
    </div>
  );
}
