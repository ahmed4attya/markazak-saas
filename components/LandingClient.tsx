"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Users, BookOpen, CalendarCheck, Wallet, FileBadge, BarChart3, Brain, ShieldCheck,
  ArrowLeft, FileCheck, TrendingUp, ChevronDown,
  Star, Send, MonitorSmartphone, Lock, Clock, GraduationCap, CheckCircle2, Video, MessageCircle,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import HeroCanvas from "@/components/HeroCanvas";
import Spotlight from "@/components/magicui/spotlight";
import AnimatedGradientText from "@/components/magicui/animated-gradient-text";
import ShimmerButton from "@/components/magicui/shimmer-button";
import Marquee from "@/components/magicui/marquee";

const MODULES = [
  { Icon: Users, title: "إدارة الطلاب", desc: "ملفات كاملة بأنواعها: سنتر وأونلاين، مع القيد في المجموعات وفترات الاشتراك.", accent: "blue" },
  { Icon: Brain, title: "بنك أسئلة ذكي", desc: "أسئلة مصنفة مجال/موضوع/مهارة/صعوبة مع شرح يغذي تحليل (لماذا أخطأت؟) بالذكاء الاصطناعي.", accent: "rose" },
  { Icon: FileCheck, title: "امتحانات محاكية", desc: "مؤقت حي، تنقل بين الأسئلة، حفظ تلقائي، وتصحيح فوري بتحليل كل خطأ.", accent: "gold" },
  { Icon: Video, title: "مكتبة فيديو محمية", desc: "بث بعلامة مائية عبر بروكسي جلسة — المحتوى لا يُسرَّب ولا يُشارك.", accent: "gold" },
  { Icon: CalendarCheck, title: "الحضور والغياب", desc: "تسجيل يومي سريع وإحصائيات مباشرة ووصول ولي الأمر لحظياً.", accent: "warning" },
  { Icon: Wallet, title: "الفواتير والأكواد", desc: "فواتير وتحصيل، وأكواد تفعيل تمنح اشتراكات مؤقتة بنموذج البيع.", accent: "indigo" },
  { Icon: FileBadge, title: "الشهادات والدرجات", desc: "سجل درجات مجمّع وشهادات برقم تحقق علني.", accent: "violet" },
  { Icon: ShieldCheck, title: "أمان ثلاثي الطبقات", desc: "عزل مستأجرين، صلاحيات لكل دور، سجل تدقيق، ورؤوس أمان HSTS.", accent: "blue" },
];

const STEPS = [
  { Icon: BookOpen, title: "أنشئ دوراتك", desc: "كتالوج القدرات والتحصيلي بمجموعات وجداول ومحتوى ملفات وفيديو محمي." },
  { Icon: Brain, title: "ابنِ بنك الأسئلة", desc: "تأليف يدوي أو استيراد CSV — مصنف بالمهارات والصعوبات مع مراجعة جودة." },
  { Icon: FileCheck, title: "شغّل الامتحانات", desc: "محاكاة الاختبار الحقيقي بمؤقت وحفظ تلقائي وتصحيح فوري وتحليل أخطاء." },
  { Icon: TrendingUp, title: "تابع النتائج", desc: "سجل درجات وتحليلات أداء للطالب والمجموعة وتنبيهات لحظية لولي الأمر." },
];

const STAT_LABELS: { key: string; label: string }[] = [
  { key: "centers", label: "مراكز تستخدم المنصة" },
  { key: "students", label: "طالب مسجل" },
  { key: "questions", label: "سؤال في بنك الأسئلة" },
  { key: "exams", label: "اختبار في المنصة" },
];

const TESTIMONIALS = [
  { name: "أ. عبدالله المطيري", role: "مدير مركز تدريب", text: "أخيراً نظام عربي كامل — الطلاب يدخلون من جوالاتهم والولي يتابع الحضور والدرجات بلا مكالمات.", initials: "ع.م" },
  { name: "أ. نورة الشمري", role: "مشرفة أكاديمية", text: "بنك الأسئلة المصنف بالمهارات وشرح (لماذا أخطأت) رفع مستوى مراجعاتنا قبل الاختبار.", initials: "ن.ش" },
  { name: "أ. فهد العتيبي", role: "معلم قدرات كمي", text: "الامتحانات المحاكاة بالمؤقت الحقيقي أقرب شيئ لجو الاختبار الفعلي — النتائج تتحدث لحظياً.", initials: "ف.ع" },
];

const FAQS = [
  { q: "هل يحتاج الطلاب لتطبيق من المتجر؟", a: "لا — المنصة PWA تُثبَّت مباشرة من المتصفح على الجوال واللوحي، وتعمل حتى دون اتصال للصفحات المزارة." },
  { q: "كيف تُحمى فيديوهات الدورات من التسريب؟", a: "الفيديو لا يُفتح برابط مباشر إطلاقاً — يُبَث عبر بروكسي جلسة موثقة بعلامة مائية تحمل اسم الطالب وبريده وتاريخ المشاهدة." },
  { q: "هل يناسب مراكز متعددة الفروع؟", a: "نعم — بنية Multi-tenant تعزل بيانات كل مركز كلياً، مع صلاحيات لكل دور من المدير حتى ولي الأمر." },
  { q: "كيف أضيف أسئلتي الخاصة؟", a: "تأليف مباشر من لوحة المعلم، أو استيراد جماعي من ملف CSV مع فحص جودة تلقائي يحال المشتبه به للمراجعة قبل نشره للطلاب." },
  { q: "ماذا عن المتابعة لأولياء الأمور؟", a: "حساب ولي أمر مرتبط بابنه يرى الحضور والدرجات والواجبات والإشعارات لحظياً من نفس التطبيق." },
  { q: "هل الشهادات موثقة وقابلة للتحقق؟", a: "نعم — كل شهادة صادرة من المنصة تحمل رقماً عاماً تستطيع جهة العمل التحقق منه فوراً من صفحة التحقق دون أي حساب." },
  { q: "كيف أحصل على الدعم عند الحاجة؟", a: "عبر نموذج التواصل في هذه الصفحة أو واتساب الدعم المباشر، إضافة إلى أدلة استخدام داخل النظام لكل دور من أدوار المنصة." },
];

function useInViewOnce() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setSeen(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, seen };
}

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const { ref, seen } = useInViewOnce();
  return (
    <div ref={ref} className="bento-card p-6 text-center">
      <div className="text-4xl font-black text-[color:var(--gold)]">
        <NumberFlow value={seen ? to : 0} />{suffix}
      </div>
    </div>
  );
}

const accents: Record<string, string> = {
  blue: "text-[color:var(--blue)] bg-[color:var(--blue-soft)]",
  warning: "text-[color:var(--warning)] bg-[color:var(--warning-soft)]",
  gold: "text-[color:var(--gold)] bg-[color:var(--gold-soft)]",
  indigo: "text-[color:var(--indigo)] bg-[color:var(--indigo-soft)]",
  violet: "text-[color:var(--violet)] bg-[color:var(--violet-soft)]",
  rose: "text-[color:var(--rose)] bg-[color:var(--rose-soft)]",
};

export default function LandingClient({ stats }: { stats: Record<string, number> | null }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadMsg, setLeadMsg] = useState("");
  const [leadState, setLeadState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [leadError, setLeadError] = useState("");

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadState("busy");
    setLeadError("");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: leadName, email: leadEmail, message: leadMsg }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "تعذر الإرسال");
      setLeadState("done");
      setLeadName(""); setLeadEmail(""); setLeadMsg("");
    } catch (err) {
      setLeadState("error");
      setLeadError(err instanceof Error ? err.message : "تعذر الإرسال");
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      <style>{`@keyframes goldShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } @keyframes goldPulse { 0%,100% { box-shadow: 0 0 18px rgba(245,158,11,0.35); } 50% { box-shadow: 0 0 34px rgba(245,158,11,0.6); } }`}</style>

      {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? (
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent("مرحباً، أرغب بالتعرف على منصة الخوارزمي")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل عبر واتساب"
          className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.45)] hover:scale-105 transition-transform"
        >
          <MessageCircle size={26} />
        </a>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "منصة الخوارزمي",
            alternateName: "Al-Khwarizmi Platform",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            inLanguage: "ar",
            description: "منصة تدريب القدرات العامة والتحصيلي — بنك أسئلة، امتحانات محاكية، مكتبة محمية، ومتابعة لحظية لولي الأمر.",
          }),
        }}
      />

      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-40 bg-[rgba(var(--glass-2-rgb),0.85)] backdrop-blur-md border-b border-[color:var(--border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-lg font-bold shadow-[0_8px_22px_rgba(245,158,11,0.3)]">خ</div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight">منصة الخوارزمي</span>
              <span className="text-[11px] text-[color:var(--muted)] uppercase tracking-wider">Al-Khwarizmi Platform</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[color:var(--muted)]">
            <a href="#features" className="hover:text-[color:var(--text)] transition-colors">المميزات</a>
            <a href="#how" className="hover:text-[color:var(--text)] transition-colors">كيف تعمل</a>
            <a href="#faq" className="hover:text-[color:var(--text)] transition-colors">الأسئلة</a>
            <Link href="/plans" className="hover:text-[color:var(--text)] transition-colors">الأسعار</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="primary !min-h-0 py-2 px-4">دخول النظام</Link>
          </div>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <HeroCanvas className="absolute inset-0 w-full h-full pointer-events-none" />
        <Spotlight color="rgba(245,158,11,0.10)" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(900px 480px at 85% -10%, rgba(245,158,11,0.12), transparent 60%), radial-gradient(700px 400px at 10% 110%, rgba(91,155,255,0.07), transparent 55%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 lg:py-32 text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="badge inline-block"><AnimatedGradientText>v2.0 — منصة تدريب SaaS عربية بالكامل</AnimatedGradientText></motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="mt-6 text-4xl lg:text-6xl font-extrabold leading-[1.25]">
            منصة الخوارزمي
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(90deg, #fbbf24, #f59e0b, #fcd34d, #fbbf24)", backgroundSize: "200% 100%", animation: "goldShift 5s ease infinite" }}
            >
              قدراتك واختباراتك — بإتقان رقمي
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="mt-6 text-lg text-[color:var(--muted)] max-w-2xl mx-auto leading-relaxed">
            منصة تدريب القدرات العامة والتحصيلي — الذكاء، الإدارة، النتائج: بنك أسئلة متخصص،
            امتحانات بمحاكاة الاختبار الحقيقي، مكتبة محمية، ومتابعة لحظية لولي الأمر.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="primary px-8 py-3 text-base" style={{ animation: "goldPulse 2.4s ease-in-out infinite" }}>
              ابدأ التجربة المجانية <ArrowLeft size={18} className="inline" />
            </Link>
            <a href="#features" className="ghost px-8 py-3 text-base">استعرض المنصة</a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs text-[color:var(--muted)]">
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] inline-flex items-center gap-1.5"><MonitorSmartphone size={13} /> PWA بلا تثبيت</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] inline-flex items-center gap-1.5"><Lock size={13} /> عزل ثلاثي الطبقات</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] inline-flex items-center gap-1.5"><ShieldCheck size={13} /> رؤوس أمان HSTS</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] inline-flex items-center gap-1.5"><Users size={13} /> متعدد الأدوار</span>
          </motion.div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="badge">المميزات</span>
          <h2 className="mt-4 text-3xl font-extrabold">كل ما يحتاجه مركزك… في نظام واحد</h2>
          <p className="mt-3 text-[color:var(--muted)]">وحدات متكاملة تعمل معاً — من تسجيل الطالب حتى شهادة الإتمام.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 4) * 0.08 }}
              className="bento-card p-6 hover:-translate-y-1 transition-transform duration-200"
            >
              <div className={"w-11 h-11 rounded-xl flex items-center justify-center mb-4 " + (accents[m.accent] || accents.blue)}>
                <m.Icon size={22} />
              </div>
              <h3 className="font-bold">{m.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="badge">كيف تعمل</span>
          <h2 className="mt-4 text-3xl font-extrabold">أربع خطوات من التأسيس إلى النتائج</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12 }}
              className="relative bento-card p-6"
            >
              <div className="absolute -top-3 right-5 w-7 h-7 rounded-full bg-[color:var(--gold)] text-[#0b0f17] text-xs font-black flex items-center justify-center">{i + 1}</div>
              <s.Icon size={26} className="text-[color:var(--gold)] mb-3" />
              <h3 className="font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && <ArrowLeft size={16} className="hidden md:block absolute top-1/2 -left-3.5 text-[color:var(--gold)] opacity-60" />}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- GALLERY (device frames) ---------- */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="badge">داخل المنصة</span>
          <h2 className="mt-4 text-3xl font-extrabold">واجهات تعمل من الجوال إلى اللوحة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end" style={{ perspective: "1200px" }}>
          {[
            { label: "لوحة المدير", tilt: "rotateY(8deg)", w: "max-w-sm" },
            { label: "بوابة الطالب (PWA)", tilt: "none", w: "max-w-xs" },
            { label: "الامتحان المحاكي", tilt: "rotateY(-8deg)", w: "max-w-sm" },
          ].map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12 }}
              className={"mx-auto w-full " + d.w}
              style={{ transform: d.tilt }}
            >
              <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl overflow-hidden">
                <div className="h-6 bg-[color:var(--surface-2)] flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[color:var(--danger)] opacity-70" />
                  <span className="w-2 h-2 rounded-full bg-[color:var(--warning)] opacity-70" />
                  <span className="w-2 h-2 rounded-full bg-[color:var(--success)] opacity-70" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-2.5 w-24 rounded bg-[color:var(--gold)] opacity-80" />
                    <div className="h-2.5 w-12 rounded bg-[color:var(--surface-3)]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-12 rounded-lg bg-[color:var(--blue-soft)] border border-[color:var(--blue)]/20 flex items-center justify-center"><BookOpen size={16} className="text-[color:var(--blue)]" /></div>
                    <div className="h-12 rounded-lg bg-[color:var(--gold-soft)] border border-[color:var(--gold)]/20 flex items-center justify-center"><Brain size={16} className="text-[color:var(--gold)]" /></div>
                    <div className="h-12 rounded-lg bg-[color:var(--violet-soft)] border border-[color:var(--violet)]/20 flex items-center justify-center"><FileCheck size={16} className="text-[color:var(--violet)]" /></div>
                  </div>
                  <div className="h-16 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] flex items-end gap-1 p-2">
                    {[40, 65, 30, 80, 55, 70, 45].map((hh, k) => (
                      <div key={k} className="flex-1 rounded-t bg-gradient-to-t from-[#f59e0b] to-[#fbbf24] opacity-80" style={{ height: hh + "%" }} />
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 rounded bg-[color:var(--surface-3)] w-full" />
                    <div className="h-2 rounded bg-[color:var(--surface-3)] w-4/5" />
                    <div className="h-2 rounded bg-[color:var(--surface-3)] w-3/5" />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[color:var(--muted)]">{d.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- STATS (real server-side DB counters) ---------- */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_LABELS.map((s, i) => (
            <motion.div key={s.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              {stats ? (
                <Counter to={stats[s.key] ?? 0} suffix="" />
              ) : (
                <div className="bento-card p-6 text-center"><div className="text-4xl font-black text-[color:var(--gold)]">…</div></div>
              )}
              <div className="mt-1 text-xs text-[color:var(--muted)] text-center">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- TESTIMONIALS (marquee) ---------- */}
      <section className="py-16 overflow-hidden">
        <div className="text-center mb-12 max-w-6xl mx-auto px-4">
          <span className="badge">آراء العملاء</span>
          <h2 className="mt-4 text-3xl font-extrabold">ماذا يقول من جرب؟</h2>
        </div>
        <Marquee speed={45}>
          {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div key={i} dir="rtl" className="bento-card p-6 w-[320px] shrink-0">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, k) => (<Star key={k} size={14} className="text-[color:var(--gold)] fill-[color:var(--gold)]" />))}
              </div>
              <p className="text-sm leading-relaxed text-[color:var(--text-soft)]">{t.text}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-xs font-black">{t.initials}</div>
                <div><div className="text-sm font-bold">{t.name}</div><div className="text-xs text-[color:var(--muted)]">{t.role}</div></div>
              </div>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <span className="badge">الأسئلة الشائعة</span>
          <h2 className="mt-4 text-3xl font-extrabold">أسئلة يسألها كل مركز قبل البدء</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="bento-card overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-3 p-4 text-right font-bold"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              >
                <span>{f.q}</span>
                <ChevronDown size={18} className={"shrink-0 text-[color:var(--gold)] transition-transform duration-200 " + (faqOpen === i ? "rotate-180" : "")} />
              </button>
              <AnimatePresence initial={false}>
                {faqOpen === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <p className="px-4 pb-4 text-sm text-[color:var(--muted)] leading-relaxed">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- FINAL CTA + LEAD FORM ---------- */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bento-card p-8 lg:p-10">
          <div className="text-center mb-6">
            <GraduationCap size={36} className="mx-auto text-[color:var(--gold)] mb-3" />
            <h2 className="text-2xl font-extrabold">جاهز ترفع مستوى مركزك؟</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">اترك بياناتك وفريقنا يتواصل معك لتفعيل تجربة مجانية لمركزك.</p>
          </div>
          {leadState === "done" ? (
            <div className="text-center p-4 rounded-xl bg-[color:var(--success-soft)] text-[color:var(--success)] text-sm flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> تم استلام طلبك — سنتواصل معك قريباً
            </div>
          ) : (
            <form onSubmit={submitLead} className="formGrid">
              <label>الاسم<input value={leadName} onChange={(e) => setLeadName(e.target.value)} required minLength={2} placeholder="اسمك الكريم" /></label>
              <label>البريد الإلكتروني<input type="email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} required placeholder="you@example.com" /></label>
              <label className="md:col-span-2">رسالتك (اختياري)<textarea value={leadMsg} onChange={(e) => setLeadMsg(e.target.value)} rows={3} maxLength={2000} placeholder="أخبرنا عن مركزك واحتياجك..." /></label>
              {leadState === "error" && <div className="error md:col-span-2">{leadError}</div>}
              <div className="md:col-span-2 flex justify-center">
                <ShimmerButton type="submit" disabled={leadState === "busy"} className={"px-8 py-3 " + (leadState === "busy" ? "opacity-60 cursor-not-allowed" : "")}>
                  <Send size={16} className="inline ml-1" /> {leadState === "busy" ? "جاري الإرسال..." : "أرسل طلب التجربة"}
                </ShimmerButton>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="border-t border-[color:var(--border)] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-[color:var(--muted)]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center font-bold">خ</span>
              <span className="font-bold text-[color:var(--text)]">منصة الخوارزمي</span>
            </div>
            <p className="leading-relaxed">منصة تدريب القدرات العامة والتحصيلي — عربياً بالكامل، بمعايير SaaS عالمية.</p>
          </div>
          <div>
            <div className="font-bold text-[color:var(--text)] mb-3">المنصة</div>
            <div className="space-y-2">
              <Link href="/plans" className="block hover:text-[color:var(--text)] transition-colors">الباقات والأسعار</Link>
              <Link href="/login" className="block hover:text-[color:var(--text)] transition-colors">تسجيل الدخول</Link>
              <Link href="/verify" className="block hover:text-[color:var(--text)] transition-colors">التحقق من شهادة</Link>
              <a href="#faq" className="block hover:text-[color:var(--text)] transition-colors">الأسئلة الشائعة</a>
            </div>
          </div>
          <div>
            <div className="font-bold text-[color:var(--text)] mb-3">الثقة والتقنية</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Lock size={13} className="text-[color:var(--gold)]" /> عزل بيانات ثلاثي الطبقات</div>
              <div className="flex items-center gap-2"><Clock size={13} className="text-[color:var(--gold)]" /> PWA تعمل 24/7</div>
              <div className="flex items-center gap-2"><GraduationCap size={13} className="text-[color:var(--gold)]" /> مبنية للقدرات والتحصيلي</div>
            </div>
          </div>
        </div>
        <div className="border-t border-[color:var(--border)] py-4 text-center text-xs text-[color:var(--muted)] flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span>منصة الخوارزمي — Al-Khwarizmi Platform &copy; 2026 — جميع الحقوق محفوظة</span>
          <Link href="/privacy" className="hover:text-[color:var(--text)] transition-colors">سياسة الخصوصية</Link>
          <Link href="/terms" className="hover:text-[color:var(--text)] transition-colors">الشروط والأحكام</Link>
        </div>
      </footer>
    </div>
  );
}