"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Award,
  ArrowRight,
  Flame,
  Zap,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  Target,
} from "lucide-react";
import type { BadgeDefinition } from "@/app/api/learner/badges/route";

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/learner/badges")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setBadges(d.badges || []);
          setUnlockedCount(d.unlockedCount || 0);
          setTotalCount(d.totalCount || 0);
          setPoints(d.points || 0);
          setStreak(d.streak || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
              <Award className="text-[color:var(--gold)]" size={22} />
              أوسمة الإنجاز والتحفيز
            </h1>
            <p className="text-xs text-[color:var(--muted)]">
              أوسمة استثنائية توثق رحلة تميزك في اختبارات القدرات والتحصيلي
            </p>
          </div>
        </div>
      </div>

      {/* Hero Stats Card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden border border-[color:var(--gold-border)] text-center"
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

        <div className="flex items-center justify-around py-2">
          <div>
            <p className="text-[11px] text-[color:var(--muted)]">الأوسمة المفتوحة</p>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <NumberFlow
                value={unlockedCount}
                className="text-4xl font-black text-[color:var(--gold)] font-mono"
              />
              <span className="text-xs font-bold text-[color:var(--muted)]">
                / {totalCount}
              </span>
            </div>
          </div>

          <div className="w-px h-10 bg-[color:var(--border)]" />

          <div>
            <p className="text-[11px] text-[color:var(--muted)]">سلسلة الأيام</p>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <Flame size={20} className="text-orange-400" />
              <NumberFlow
                value={streak}
                className="text-3xl font-black text-white font-mono"
              />
              <span className="text-xs font-bold text-[color:var(--muted)]">أيام</span>
            </div>
          </div>

          <div className="w-px h-10 bg-[color:var(--border)]" />

          <div>
            <p className="text-[11px] text-[color:var(--muted)]">رصيد النقاط</p>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <Zap size={18} className="text-[color:var(--gold)]" />
              <NumberFlow
                value={points}
                className="text-3xl font-black text-[color:var(--gold)] font-mono"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Badges Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold flex items-center gap-1.5 text-[color:var(--text)]">
          <Trophy size={16} className="text-[color:var(--gold)]" />
          قائمة الأوسمة الوطنية والمهارية:
        </h2>

        {loading && (
          <div className="bento-card p-10 text-center text-xs text-[color:var(--muted)]">
            جاري فحص سجل إنجازاتك...
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((b, i) => {
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={[
                  "p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between",
                  b.unlocked
                    ? "border-[color:var(--gold)] bg-[color:var(--surface)] shadow-md shadow-[color:var(--gold-soft)]/20"
                    : "border-[color:var(--border)] bg-[color:var(--surface-2)] opacity-85",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        "w-12 h-12 rounded-2xl grid place-items-center text-2xl shrink-0 border",
                        b.unlocked
                          ? "bg-[color:var(--gold-soft)] border-[color:var(--gold-border)]"
                          : "bg-[color:var(--surface-3)] border-[color:var(--border)] grayscale",
                      ].join(" ")}
                    >
                      {b.icon}
                    </span>

                    <div>
                      <b className="text-sm font-black flex items-center gap-1.5">
                        {b.title}
                        {b.unlocked && (
                          <CheckCircle2 size={15} className="text-emerald-400" />
                        )}
                      </b>
                      <p className="text-xs text-[color:var(--muted)] leading-relaxed mt-0.5">
                        {b.description}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[color:var(--gold)] px-2 py-0.5 rounded-full bg-[color:var(--gold-soft)] shrink-0 font-mono">
                    +{b.pointsReward} نقطة
                  </span>
                </div>

                {/* Progress bar towards unlock */}
                <div className="mt-3 pt-2 border-t border-[color:var(--border)] space-y-1">
                  <div className="flex justify-between text-[10px] text-[color:var(--muted)] font-mono">
                    <span>
                      {b.unlocked ? "تم الإنجاز بنجاح 🎉" : `التقدم: ${b.currentValue} / ${b.targetValue} ${b.unit}`}
                    </span>
                    <span>{b.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[color:var(--surface-3)] overflow-hidden">
                    <div
                      style={{ width: `${b.progress}%` }}
                      className={[
                        "h-full rounded-full transition-all duration-700",
                        b.unlocked ? "bg-[color:var(--gold)]" : "bg-blue-500",
                      ].join(" ")}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Motivation Callout */}
      <section className="bento-card p-4 flex items-center justify-between gap-3">
        <div>
          <b className="text-xs block font-bold">جاهز لفتح الوسام القادم؟</b>
          <small className="text-[10px] text-[color:var(--muted)]">
            خض تحدياً ذاتياً سريعاً لرفع رصيدك ونقاطك الآن
          </small>
        </div>
        <Link
          href="/portal/self-challenge"
          className="px-4 py-2 rounded-xl bg-[color:var(--gold)] text-black font-black text-xs shrink-0"
        >
          بدء التحدي
        </Link>
      </section>
    </div>
  );
}
