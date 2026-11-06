"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  ClipboardList,
  NotebookPen,
  BookOpen,
  FolderOpen,
  KeyRound,
  Zap,
  PlayCircle,
  ChevronLeft,
  Flame,
  Calculator,
  Sparkles,
  Swords,
  Award,
  Target,
  Wrench,
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
  role?: string;
  points?: number;
  level?: string;
};

type Streak = { streak: number; lastActive: string | null; todayActive: boolean };

function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = size / 2 - 5;
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
          stroke="var(--surface-3)" strokeWidth="5" fill="transparent"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={col} strokeWidth="5" fill="transparent"
          strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-xs font-black">
        {pct}%
      </span>
    </div>
  );
}

const QUICK = [
  { href: "/portal/training", label: "تدريب سريع", Icon: Zap, tint: "var(--gold)" },
  { href: "/portal/self-challenge", label: "تحدي ذاتي", Icon: Swords, tint: "#ef4444" },
  { href: "/portal/formulas", label: "القوانين الذهبية", Icon: Sparkles, tint: "#f59e0b" },
  { href: "/portal/calculator", label: "حاسبة النسبة", Icon: Calculator, tint: "#10b981" },
  { href: "/portal/mistakes", label: "صندوق الأخطاء", Icon: Wrench, tint: "#6366f1" },
  { href: "/portal/badges", label: "الأوسمة", Icon: Award, tint: "#ec4899" },
  { href: "/portal/challenge", label: "تحدي 1v1", Icon: Swords, tint: "#06b6d4" },
  { href: "/portal/exams", label: "امتحاناتي", Icon: ClipboardList, tint: "var(--blue)" },
  { href: "/portal/courses", label: "دوراتي", Icon: BookOpen, tint: "var(--info)" },
];

export default function PortalHome() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<PRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stk, setStk] = useState<Streak | null>(null);
  const [forecastScore, setForecastScore] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/learner/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/learner/progress").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/learner/streak").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/learner/forecast").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([m, p, sk, fc]) => {
        setMe(m);
        setRows(Array.isArray(p) ? p : []);
        setStk(sk as Streak | null);
        if (fc && fc.forecastScore) setForecastScore(fc.forecastScore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const tot = rows.reduce((a, r) => a + Number(r.total || 0), 0);
  const done = rows.reduce((a, r) => a + Number(r.done || 0), 0);
  const pct = tot ? Math.min(100, Math.round((done / tot) * 100)) : 0;
  const cont = rows.find((r) => r.lastVideo) || null;
  const firstName = (me?.name || "طالبنا").split(" ")[0];

  return (
    <div className="space-y-5 pb-8">
      {/* Hero Welcome Card */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={[
          "rounded-3xl p-5 relative overflow-hidden",
          "border border-[color:var(--gold-border)]",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
        }}
      >
        <div
          className="absolute -top-16 -left-16 w-44 h-44 rounded-full"
          style={{
            background: "var(--gold-soft)",
            filter: "blur(40px)",
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-[color:var(--muted)]">
            أهلاً بك في بوابة الطالب
          </p>
          {forecastScore && (
            <Link
              href="/portal/progress"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--gold-soft)] border border-[color:var(--gold-border)] text-[10px] font-bold text-[color:var(--gold)]"
            >
              <Target size={12} />
              <span>توقع قياس: {forecastScore} نقطة</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-xl font-black">{firstName}</h1>
          {me?.level && (
            <span
              className={[
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                "border border-[color:var(--gold-border)]",
              ].join(" ")}
              style={{
                background: "var(--gold-soft)",
                color: "var(--gold)",
              }}
            >
              {me.level}
            </span>
          )}
          {stk && stk.streak > 0 && (
            <span
              className={[
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                "border border-[color:var(--gold-border)]",
                "inline-flex items-center gap-1",
              ].join(" ")}
              style={{ background: "var(--gold-soft)", color: "var(--gold)" }}
            >
              <Flame size={11} />
              سلسلة {stk.streak} يوم
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Ring pct={pct} size={78} />
          <div>
            <p className="text-[11px] text-[color:var(--muted)]">نقاطك</p>
            <NumberFlow
              value={Number(me?.points || 0)}
              className="text-2xl font-black text-[color:var(--gold)] font-mono"
            />
            <p className="text-[11px] text-[color:var(--muted)] mt-1">
              {done} من {tot} مهمة منجزة
            </p>
          </div>
        </div>
      </motion.section>

      {/* Continue Watching Video Banner */}
      {cont?.lastVideo && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
        >
          <Link
            href={"/portal/courses/" + cont.courseId}
            className={[
              "bento-card p-4 flex items-center gap-3",
              "hover:border-[color:var(--gold-border)]",
              "transition-colors",
            ].join(" ")}
          >
            <span
              className={[
                "w-11 h-11 rounded-xl grid place-items-center shrink-0",
              ].join(" ")}
              style={{
                background: "var(--gold-soft)",
                color: "var(--gold)",
              }}
            >
              <PlayCircle size={22} />
            </span>
            <span className="min-w-0">
              <b className="block text-sm truncate">
                أكمل المشاهدة: {cont.courseName}
              </b>
              <small className="block text-xs text-[color:var(--muted)] truncate">
                {cont.lastVideo.title}
              </small>
            </span>
            <div className="flex-1" />
            <ChevronLeft size={18} className="text-[color:var(--muted-dim)]" />
          </Link>
        </motion.section>
      )}

      {/* Featured Competitive Hub Bento Row */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-[color:var(--muted)] flex items-center gap-1.5">
          <Sparkles size={14} className="text-[color:var(--gold)]" />
          أدوات التفوق والمنافسة في قياس:
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Formulas Vault */}
          <Link
            href="/portal/formulas"
            className="bento-card p-4 hover:border-[color:var(--gold-border)] transition-all flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 grid place-items-center">
                <Sparkles size={18} />
              </span>
              <span className="text-[10px] font-bold text-[color:var(--gold)] font-mono">
                230+ قانون
              </span>
            </div>
            <div>
              <b className="text-xs block font-bold mt-2">مكتبة القوانين الذهبية</b>
              <small className="text-[10px] text-[color:var(--muted)] block">
                بطاقات ذكية للحفظ السريع
              </small>
            </div>
          </Link>

          {/* Calculator */}
          <Link
            href="/portal/calculator"
            className="bento-card p-4 hover:border-[color:var(--gold-border)] transition-all flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 grid place-items-center">
                <Calculator size={18} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400">
                2026 معتمد
              </span>
            </div>
            <div>
              <b className="text-xs block font-bold mt-2">حاسبة النسبة الموزونة</b>
              <small className="text-[10px] text-[color:var(--muted)] block">
                أوزان الجامعات السعودية
              </small>
            </div>
          </Link>

          {/* Self Challenge */}
          <Link
            href="/portal/self-challenge"
            className="bento-card p-4 hover:border-[color:var(--gold-border)] transition-all flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 grid place-items-center">
                <Swords size={18} />
              </span>
              <span className="text-[10px] font-bold text-red-400">
                تحدي البرق ⚡
              </span>
            </div>
            <div>
              <b className="text-xs block font-bold mt-2">التحدي الذاتي المخصص</b>
              <small className="text-[10px] text-[color:var(--muted)] block">
                حدد القسم والمؤقت واختبر
              </small>
            </div>
          </Link>

          {/* 1v1 Challenge */}
          <Link
            href="/portal/challenge"
            className="bento-card p-4 hover:border-[color:var(--gold-border)] transition-all flex flex-col justify-between min-h-[110px]"
          >
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 grid place-items-center">
                <Flame size={18} />
              </span>
              <span className="text-[10px] font-bold text-cyan-400">
                غرفة مباشرة
              </span>
            </div>
            <div>
              <b className="text-xs block font-bold mt-2">تحدي الأصدقاء 1v1</b>
              <small className="text-[10px] text-[color:var(--muted)] block">
                شارك الكود ونافس زملاءك
              </small>
            </div>
          </Link>
        </div>
      </section>

      {/* Grid of Quick Action Buttons */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-[color:var(--muted)]">الوصول السريع:</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {QUICK.map((q, i) => {
            const Icon = q.Icon;
            return (
              <motion.div
                key={q.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03, duration: 0.2 }}
              >
                <Link
                  href={q.href}
                  className={[
                    "bento-card p-3 flex flex-col items-center",
                    "justify-center gap-1.5 min-h-[76px]",
                    "hover:border-[color:var(--gold-border)]",
                    "transition-colors",
                  ].join(" ")}
                >
                  <Icon size={20} style={{ color: q.tint }} />
                  <span className="text-[11px] font-semibold">{q.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Course Progress Section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold">تقدم دوراتك</h2>
          <Link
            href="/portal/progress"
            className="text-xs text-[color:var(--gold)] flex items-center gap-0.5"
          >
            عرض التفاصيل
            <ChevronLeft size={14} />
          </Link>
        </div>
        {loading && (
          <p className="text-xs text-[color:var(--muted)] py-4 text-center">
            جارٍ التحميل...
          </p>
        )}
        {!loading && rows.length === 0 && (
          <div className="bento-card p-5 text-center">
            <p className="text-sm font-semibold mb-1">
              لا توجد دورات مسجل بها بعد
            </p>
            <p className="text-xs text-[color:var(--muted)] mb-3">
              فعّل كود اشتراك للانضمام إلى دوراتك
            </p>
            <Link
              href="/portal/redeem"
              className={[
                "inline-block text-xs font-bold px-4 py-2.5",
                "rounded-xl text-[#3a2b06] min-h-[44px]",
                "leading-[44px]",
              ].join(" ")}
              style={{ background: "var(--gold-cta)" }}
            >
              تفعيل كود
            </Link>
          </div>
        )}
        <div className="space-y-2">
          {rows.slice(0, 3).map((r) => (
            <Link
              key={r.courseId}
              href={"/portal/courses/" + r.courseId}
              className={[
                "bento-card p-3 flex items-center gap-3",
                "hover:border-[color:var(--gold-border)]",
                "transition-colors",
              ].join(" ")}
            >
              <Ring pct={r.pct} size={54} />
              <span className="min-w-0">
                <b className="block text-sm truncate">{r.courseName}</b>
                <small className="block text-xs text-[color:var(--muted)]">
                  {r.done} من {r.total} مهمة
                </small>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
