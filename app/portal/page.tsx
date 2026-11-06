'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import {
  ClipboardList,
  BookOpen,
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
  TrendingUp,
  GraduationCap,
  Sparkle,
} from 'lucide-react';
import SpotlightCard from '@/components/ui/SpotlightCard';
import ShinyText from '@/components/ui/ShinyText';
import AnimatedProgressRing from '@/components/ui/AnimatedProgressRing';

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

const QUICK_ACTIONS = [
  { href: '/portal/training', label: 'تدريب سريع', Icon: Zap, color: '#f59e0b', desc: 'أسئلة عشوائية مخصصة' },
  { href: '/portal/self-challenge', label: 'تحدي ذاتي', Icon: Swords, color: '#ef4444', desc: 'مؤقت وأقسام مخصصة' },
  { href: '/portal/formulas', label: 'القوانين الذهبية', Icon: Sparkles, color: '#eab308', desc: '230+ قانون رياضي' },
  { href: '/portal/calculator', label: 'حاسبة النسبة', Icon: Calculator, color: '#10b981', desc: 'معايير قبول 2026' },
  { href: '/portal/mistakes', label: 'صندوق الأخطاء', Icon: Wrench, color: '#6366f1', desc: 'معالجة الذكاء الاصطناعي' },
  { href: '/portal/badges', label: 'الأوسمة', Icon: Award, color: '#ec4899', desc: 'إنجازاتك وميدالياتك' },
  { href: '/portal/challenge', label: 'حلبة 1v1', Icon: Swords, color: '#06b6d4', desc: 'نافس زملاءك فوراً' },
  { href: '/portal/exams', label: 'امتحاناتي', Icon: ClipboardList, color: '#3b82f6', desc: 'محاكي قياس الكامل' },
  { href: '/portal/courses', label: 'دوراتي', Icon: BookOpen, color: '#14b8a6', desc: 'الحقائب والدروس' },
];

export default function PortalHome() {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<PRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stk, setStk] = useState<Streak | null>(null);
  const [forecastScore, setForecastScore] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/learner/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/learner/progress').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/learner/streak').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/learner/forecast').then((r) => (r.ok ? r.json() : null)),
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
  const overallPct = tot ? Math.min(100, Math.round((done / tot) * 100)) : 0;
  const cont = rows.find((r) => r.lastVideo) || null;
  const firstName = (me?.name || 'طالبنا المتميز').split(' ')[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Welcome Spotlight Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <SpotlightCard
          className="p-6 md:p-8 bg-gradient-to-br from-[color:var(--surface)] via-[color:var(--surface)] to-[color:var(--surface-2)] border-amber-500/20 shadow-lg"
          spotlightColor="rgba(245, 158, 11, 0.15)"
          borderColor="rgba(245, 158, 11, 0.35)"
        >
          {/* Ambient Lighting Orbs */}
          <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl" />

          {/* Top Row: Meta Status and Qiyas Forecast */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[color:var(--surface-2)] border border-[color:var(--border)] text-xs font-medium text-[color:var(--text-soft)] backdrop-blur-md">
                <GraduationCap size={14} className="text-amber-500" />
                <span>بوابة الطالب الذكية</span>
              </span>
              {me?.level && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-500">
                  <Sparkle size={10} />
                  {me.level}
                </span>
              )}
            </div>

            {forecastScore && (
              <Link
                href="/portal/progress"
                className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-emerald-500/15 border border-amber-500/30 text-xs font-bold text-amber-500 hover:border-amber-400/60 transition-all shadow-sm"
              >
                <Target size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                <span>توقع قياس المباشر:</span>
                <ShinyText
                  text={`${forecastScore} نقطة`}
                  className="font-black text-amber-500"
                  shimmerColor="rgba(255, 255, 255, 0.9)"
                />
                <ChevronLeft size={14} className="text-amber-500/70 group-hover:-translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Middle Row: Personalized Welcome & Streak Counter */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div>
              <p className="text-xs font-medium text-[color:var(--muted)]">مرحباً بعودتك،</p>
              <h1 className="text-2xl md:text-3xl font-black text-[color:var(--text)] mt-1 tracking-tight flex items-center gap-2">
                <span>{firstName}</span>
                <span className="text-base font-normal text-[color:var(--muted)]">👋</span>
              </h1>
            </div>

            {stk && stk.streak > 0 && (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 grid place-items-center">
                  <Flame size={18} className="animate-pulse text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-amber-500">سلسلة الستريك</span>
                  </div>
                  <p className="text-sm font-black text-[color:var(--text)]">
                    {stk.streak} {stk.streak === 1 ? 'يوم' : stk.streak === 2 ? 'يومان' : 'أيام متتالية'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row: Stats & Progress Ring */}
          <div className="mt-6 pt-5 border-t border-[color:var(--border)] grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <AnimatedProgressRing pct={overallPct} size={64} strokeWidth={5} />
              <div>
                <p className="text-[11px] font-medium text-[color:var(--muted)]">الإنجاز الكلي</p>
                <p className="text-sm font-black text-[color:var(--text)] mt-0.5">
                  {done} <span className="text-xs font-normal text-[color:var(--muted)]">من {tot} مهمة</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 grid place-items-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[color:var(--muted)]">رصيد النقاط</p>
                <div className="text-xl font-black text-amber-500 font-mono">
                  <NumberFlow value={Number(me?.points || 0)} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 grid place-items-center shrink-0">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[color:var(--muted)]">الدورات الفعالة</p>
                <p className="text-xl font-black text-[color:var(--text)] font-mono">{rows.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 grid place-items-center shrink-0">
                <Target size={20} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[color:var(--muted)]">المحاكي الموصى به</p>
                <Link
                  href="/portal/exams"
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-0.5"
                >
                  بدء الاختبار
                  <ChevronLeft size={14} />
                </Link>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>

      {/* 2. Continue Watching / Learning Spotlight Banner */}
      {cont?.lastVideo && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Link href={'/portal/courses/' + cont.courseId}>
            <SpotlightCard
              className="p-4 md:p-5 flex items-center gap-4 bg-[color:var(--surface)] border-amber-500/30 hover:border-amber-500/50 shadow-md"
              spotlightColor="rgba(245, 158, 11, 0.12)"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 grid place-items-center shrink-0 shadow-lg shadow-amber-500/20">
                <PlayCircle size={26} className="fill-slate-950 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-300">
                    متابعة التعلم
                  </span>
                  <span className="text-xs text-[color:var(--muted)] truncate">{cont.courseName}</span>
                </div>
                <h3 className="text-sm md:text-base font-bold text-[color:var(--text)] mt-1 truncate">
                  {cont.lastVideo.title}
                </h3>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors shrink-0">
                <span>استكمال الدرس</span>
                <ChevronLeft size={14} />
              </div>
            </SpotlightCard>
          </Link>
        </motion.div>
      )}

      {/* 3. Competitive Hub Bento Grid (Neo-Bento Layout) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[color:var(--text)] flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span>حزمة التفوق والمنافسة في قياس:</span>
          </h2>
          <span className="text-xs text-[color:var(--muted)]">أدوات حصرية 2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Formulas Vault Card */}
          <Link href="/portal/formulas" className="group">
            <SpotlightCard
              className="p-5 h-full flex flex-col justify-between border-amber-500/20 hover:border-amber-500/40"
              spotlightColor="rgba(245, 158, 11, 0.15)"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 grid place-items-center group-hover:scale-105 transition-transform">
                  <Sparkles size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono">
                  230+ قانون
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[color:var(--text)] group-hover:text-amber-500 transition-colors">
                  مكتبة القوانين الذهبية
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1 leading-relaxed">
                  بطاقات ذكية تفاعلية لحفظ وتطبيق قوانين الكمي والتحصيلي.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-amber-500/80 group-hover:text-amber-600">
                <span>استعراض البطاقات</span>
                <ChevronLeft size={14} className="mr-0.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </SpotlightCard>
          </Link>

          {/* Self-Challenge Card */}
          <Link href="/portal/self-challenge" className="group">
            <SpotlightCard
              className="p-5 h-full flex flex-col justify-between border-red-500/20 hover:border-red-500/40"
              spotlightColor="rgba(239, 68, 68, 0.15)"
              borderColor="rgba(239, 68, 68, 0.3)"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 grid place-items-center group-hover:scale-105 transition-transform">
                  <Swords size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                  تحدي البرق ⚡
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[color:var(--text)] group-hover:text-red-500 transition-colors">
                  التحدي الذاتي المخصص
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1 leading-relaxed">
                  صمم تدريبك الخاص بضبط الأقسام، عدد الأسئلة والمؤقت الزمني.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-red-500/80 group-hover:text-red-600">
                <span>تخصيص التحدي</span>
                <ChevronLeft size={14} className="mr-0.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </SpotlightCard>
          </Link>

          {/* 1v1 Arena Challenge Card */}
          <Link href="/portal/challenge" className="group">
            <SpotlightCard
              className="p-5 h-full flex flex-col justify-between border-cyan-500/20 hover:border-cyan-500/40"
              spotlightColor="rgba(6, 182, 212, 0.15)"
              borderColor="rgba(6, 182, 212, 0.3)"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 grid place-items-center group-hover:scale-105 transition-transform">
                  <Flame size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500">
                  غرفة مباشرة
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[color:var(--text)] group-hover:text-cyan-500 transition-colors">
                  حلبة التحدي 1v1
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1 leading-relaxed">
                  أنشئ غرفة تحدٍ مباشرة وشارك الرمز لتنافس زملاءك في نفس اللحظة.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-cyan-500/80 group-hover:text-cyan-600">
                <span>دخول الحلبة</span>
                <ChevronLeft size={14} className="mr-0.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </SpotlightCard>
          </Link>

          {/* Weighted Calculator Card */}
          <Link href="/portal/calculator" className="group">
            <SpotlightCard
              className="p-5 h-full flex flex-col justify-between border-emerald-500/20 hover:border-emerald-500/40"
              spotlightColor="rgba(16, 185, 129, 0.15)"
              borderColor="rgba(16, 185, 129, 0.3)"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 grid place-items-center group-hover:scale-105 transition-transform">
                  <Calculator size={20} />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  معايير 2026
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-bold text-[color:var(--text)] group-hover:text-emerald-500 transition-colors">
                  حاسبة النسبة الموزونة
                </h3>
                <p className="text-xs text-[color:var(--muted)] mt-1 leading-relaxed">
                  احسب فرص قبولك في مختلف الجامعات السعودية بدقة متناهية.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-emerald-500/80 group-hover:text-emerald-600">
                <span>حساب النسبة</span>
                <ChevronLeft size={14} className="mr-0.5 group-hover:-translate-x-1 transition-transform" />
              </div>
            </SpotlightCard>
          </Link>
        </div>
      </section>

      {/* 4. Quick Actions Grid with Micro-Interactions */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[color:var(--text)]">الوصول السريع:</h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-9 gap-2.5">
          {QUICK_ACTIONS.map((action, idx) => {
            const Icon = action.Icon;
            return (
              <motion.div
                key={action.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * idx, duration: 0.25 }}
              >
                <Link
                  href={action.href}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] hover:border-amber-500/40 hover:bg-[color:var(--surface-2)] transition-all duration-200 min-h-[82px] text-center"
                >
                  <div
                    className="w-9 h-9 rounded-xl grid place-items-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${action.color}15`, color: action.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-[11px] font-bold text-[color:var(--text-soft)] group-hover:text-amber-500 mt-1.5 line-clamp-1">
                    {action.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 5. Active Courses & Curriculum Progress Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[color:var(--text)] flex items-center gap-2">
            <BookOpen size={16} className="text-teal-500" />
            <span>دوراتك المشترك بها</span>
          </h2>
          <Link
            href="/portal/progress"
            className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1"
          >
            <span>تقرير التقدم الكامل</span>
            <ChevronLeft size={14} />
          </Link>
        </div>

        {loading && (
          <div className="p-8 rounded-3xl bg-[color:var(--surface)] border border-[color:var(--border)] text-center text-xs text-[color:var(--muted)] animate-pulse">
            جارٍ تحميل بيانات دوراتك...
          </div>
        )}

        {!loading && rows.length === 0 && (
          <SpotlightCard className="p-8 text-center border-amber-500/20 bg-[color:var(--surface)]">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 grid place-items-center mx-auto mb-3">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-bold text-[color:var(--text)] mb-1">لا توجد دورات مسجل بها حالياً</h3>
            <p className="text-xs text-[color:var(--muted)] max-w-sm mx-auto mb-4 leading-relaxed">
              قم بتفعيل كود الاشتراك الخاص بك للوصول الفوري إلى بنوك الأسئلة والشروحات المرئية.
            </p>
            <Link
              href="/portal/redeem"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              <span>تفعيل كود دورة</span>
              <ChevronLeft size={14} />
            </Link>
          </SpotlightCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {rows.map((course) => (
            <Link key={course.courseId} href={'/portal/courses/' + course.courseId} className="group">
              <SpotlightCard className="p-4 flex items-center gap-3.5 border-[color:var(--border)] hover:border-amber-500/40 transition-colors">
                <AnimatedProgressRing pct={course.pct} size={54} strokeWidth={4.5} />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-[color:var(--text)] group-hover:text-amber-500 transition-colors truncate">
                    {course.courseName}
                  </h4>
                  <p className="text-xs text-[color:var(--muted)] mt-0.5">
                    {course.done} من {course.total} مهمة مكتملة
                  </p>
                </div>
                <ChevronLeft size={18} className="text-[color:var(--muted)] group-hover:text-amber-500 group-hover:-translate-x-1 transition-all" />
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
