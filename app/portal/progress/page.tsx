"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Zap,
  KeyRound,
  BookOpen,
  Sparkles,
  Target,
  Calculator,
  Swords,
  TrendingUp,
  Award,
  ChevronLeft,
} from "lucide-react";

type PRow = {
  courseId: string;
  courseName: string;
  studentName?: string;
  total: number;
  done: number;
  pct: number;
  lastVideo: { id: string; title: string } | null;
};

type Me = {
  name: string;
  points?: number;
  level?: string;
  role?: string;
};

type Forecast = {
  totalAnswered: number;
  totalCorrect: number;
  overallPct: number;
  forecastScore: number;
  rangeLow: number;
  rangeHigh: number;
  confidence: string;
  confidenceLevel: "low" | "medium" | "high";
  quantScore: number;
  verbalScore: number;
  advice: string;
};

function BigRing({ pct }: { pct: number }) {
  const size = 120;
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const off = c - (c * pct) / 100;
  const col =
    pct >= 80 ? "var(--success)"
    : pct >= 40 ? "var(--gold)"
    : "var(--blue)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        className="w-full h-full -rotate-90"
        viewBox={"0 0 " + size + " " + size}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="var(--surface-3)" strokeWidth="8" fill="transparent"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={col} strokeWidth="8" fill="transparent"
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.1s ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <b className="text-2xl font-black">{pct}%</b>
      </span>
    </div>
  );
}

export default function PortalProgress() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<PRow[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/learner/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/learner/progress").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/learner/forecast").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([m, p, f]) => {
        setMe(m);
        setRows(Array.isArray(p) ? p : []);
        setForecast(f);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tot = rows.reduce((a, r) => a + Number(r.total || 0), 0);
  const done = rows.reduce((a, r) => a + Number(r.done || 0), 0);
  const pct = tot ? Math.min(100, Math.round((done / tot) * 100)) : 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Overall Progress Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={[
          "rounded-3xl p-5 flex flex-col items-center",
          "border border-[color:var(--gold-border)] relative",
          "overflow-hidden",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
        }}
      >
        <div
          className="absolute -bottom-16 -right-10 w-40 h-40 rounded-full"
          style={{
            background: "var(--gold-soft)",
            filter: "blur(40px)",
          }}
        />
        <h1 className="text-sm font-bold mb-3">تقدمي العام في المنصة</h1>
        <BigRing pct={pct} />
        <p className="text-xs text-[color:var(--muted)] mt-3">
          {done} من {tot} مهمة منجزة عبر دوراتك التدريبية
        </p>
      </motion.section>

      {/* Predicted Qiyas Score Card */}
      {forecast && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="bento-card p-5 relative overflow-hidden space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[color:var(--gold-soft)] text-[color:var(--gold)] grid place-items-center">
                <Target size={16} />
              </span>
              <div>
                <b className="text-sm block">درجة قياس المتوقعة</b>
                <small className="text-[10px] text-[color:var(--muted)]">
                  محاكاة دقيقة مبنية على نتائج إجاباتك
                </small>
              </div>
            </div>

            <span
              className={[
                "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                forecast.confidenceLevel === "high"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : forecast.confidenceLevel === "medium"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-blue-500/10 text-blue-400 border-blue-500/30",
              ].join(" ")}
            >
              مستوى الثقة: {forecast.confidence}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[color:var(--surface-2)] border border-[color:var(--gold-border)] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[color:var(--muted)]">التوقع الحالي</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <NumberFlow
                  value={forecast.forecastScore}
                  className="text-4xl font-black text-[color:var(--gold)] font-mono"
                />
                <span className="text-xs font-bold text-[color:var(--muted)]">
                  نقطة قياس
                </span>
              </div>
              <small className="text-[10px] text-[color:var(--muted-dim)]">
                النطاق المتوقع: {forecast.rangeLow} - {forecast.rangeHigh}
              </small>
            </div>

            <div className="text-left space-y-1.5 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[color:var(--muted)] text-[10px]">كمي:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-[color:var(--surface-3)]">
                  {forecast.quantScore}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[color:var(--muted)] text-[10px]">لفظي:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-[color:var(--surface-3)]">
                  {forecast.verbalScore}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-[color:var(--text-soft)] leading-relaxed bg-[color:var(--surface)] p-3 rounded-xl border border-[color:var(--border)]">
            💡 {forecast.advice}
          </p>
        </motion.section>
      )}

      {/* Points & Level */}
      <section className="bento-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[color:var(--muted)]">
              مجموع نقاطك
            </p>
            <NumberFlow
              value={Number(me?.points || 0)}
              className="text-2xl font-black text-[color:var(--gold)]"
            />
            {me?.level && (
              <span className="text-xs font-semibold text-[color:var(--muted)] block mt-0.5">
                المستوى: {me.level}
              </span>
            )}
          </div>
          <Zap size={30} style={{ color: "var(--gold)" }} />
        </div>
        <p className="text-[11px] text-[color:var(--muted-dim)] mt-3 leading-5">
          اجمع النقاط بمتابعتك دروسك ونجاحك في الاختبارات والتحديات اليومية.
        </p>
      </section>

      {/* Direct Smart Hub Shortcuts */}
      <section className="grid grid-cols-2 gap-2.5">
        <Link
          href="/portal/calculator"
          className="bento-card p-3.5 hover:border-[color:var(--gold-border)] transition-colors flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-[color:var(--gold-soft)] text-[color:var(--gold)] grid place-items-center shrink-0">
            <Calculator size={18} />
          </div>
          <div className="min-w-0">
            <b className="text-xs block truncate">حاسبة النسبة الموزونة</b>
            <small className="text-[10px] text-[color:var(--muted)]">
              أوزان الجامعات السعودية
            </small>
          </div>
        </Link>

        <Link
          href="/portal/self-challenge"
          className="bento-card p-3.5 hover:border-[color:var(--gold-border)] transition-colors flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 grid place-items-center shrink-0">
            <Swords size={18} />
          </div>
          <div className="min-w-0">
            <b className="text-xs block truncate">التحدي الذاتي</b>
            <small className="text-[10px] text-[color:var(--muted)]">
              اختبر دقتك وسرعتك
            </small>
          </div>
        </Link>
      </section>

      {/* Course Breakdown */}
      <section>
        <h2 className="text-sm font-bold mb-2 flex items-center gap-1.5">
          <BookOpen size={16} style={{ color: "var(--blue)" }} />
          التفصيل حسب الدورة
        </h2>
        {loading && (
          <p className="text-xs text-[color:var(--muted)] py-4 text-center">
            جارٍ التحميل...
          </p>
        )}
        {!loading && rows.length === 0 && (
          <div className="bento-card p-5 text-center">
            <p className="text-sm font-semibold mb-3">
              لا توجد دورات مسجل بها بعد
            </p>
            <Link
              href="/portal/redeem"
              className={[
                "inline-flex items-center gap-1.5 text-xs font-bold",
                "px-4 py-2.5 rounded-xl text-[#3a2b06]",
              ].join(" ")}
              style={{ background: "var(--gold-cta)" }}
            >
              <KeyRound size={15} />
              تفعيل كود
            </Link>
          </div>
        )}
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <motion.div
              key={r.courseId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className="bento-card p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <b className="text-sm truncate">
                  {r.courseName}
                  {r.studentName ? " — " + r.studentName : ""}
                </b>
                <span
                  className="text-xs font-black shrink-0"
                  style={{ color: "var(--gold)" }}
                >
                  {r.pct}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "var(--surface-3)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: r.pct + "%",
                    background: "var(--gold-cta)",
                    transition: "width 1s ease",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <small className="text-[11px] text-[color:var(--muted)]">
                  {r.done} من {r.total} مهمة
                </small>
                <Link
                  href={"/portal/courses/" + r.courseId}
                  className="text-[11px] text-[color:var(--gold)]"
                >
                  فتح الدورة
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
