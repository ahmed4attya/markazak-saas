import Link from "next/link";
import {
  Users, BookOpen, CalendarCheck, Wallet, FileBadge, BarChart3,
  Brain, ShieldCheck, ArrowLeft, Sparkles, Building2, Layers,
} from "lucide-react";

const modules = [
  { Icon: Users, title: "إدارة الطلاب", desc: "ملفات كاملة للطلاب بأنواعهم: سنتر وأونلاين، مع القيد في المجموعات وفترات الاشتراك.", accent: "blue" },
  { Icon: BookOpen, title: "الدورات والمجموعات", desc: "كتالوج الدورات، الفرق والمجموعات بأنماطها (حضوري/أونلاين)، والجدولة.", accent: "success" },
  { Icon: CalendarCheck, title: "الحضور والغياب", desc: "تسجيل يومي سريع، إحصائيات مباشرة، وتقرير ملخص قابل للتصدير.", accent: "warning" },
  { Icon: Wallet, title: "الفواتير والمدفوعات", desc: "إصدار الفواتير، تحصيل جزئي أو كامل، وتكامل دفع عبر Stripe مع Webhooks موثقة.", accent: "indigo" },
  { Icon: FileBadge, title: "الشهادات الموثقة", desc: "إصدار شهادات برقم تحقق فريد يمكن التحقق منه علنياً.", accent: "violet" },
  { Icon: BarChart3, title: "التقارير", desc: "تقارير الحضور والمالية مع تصدير CSV ولوحات مؤشرات حية.", accent: "cyan" },
  { Icon: Brain, title: "المساعد الذكي", desc: "تحليل وتقارير وقرارات مدعومة بمزود AI خارجي.", accent: "rose" },
  { Icon: ShieldCheck, title: "أمان وتعدد مستأجرين", desc: "عزل بيانات كل مركز، صلاحيات RBAC، سجل تدقيق، ومراقبة صحية مستمرة.", accent: "blue" },
];

const accents: Record<string, string> = {
  blue: "text-[color:var(--blue)] bg-[color:var(--blue-soft)]",
  success: "text-[color:var(--success)] bg-[color:var(--success-soft)]",
  warning: "text-[color:var(--warning)] bg-[color:var(--warning-soft)]",
  indigo: "text-[color:var(--indigo)] bg-[color:var(--indigo-soft)]",
  violet: "text-[color:var(--violet)] bg-[color:var(--violet-soft)]",
  cyan: "text-[color:var(--cyan)] bg-[color:var(--cyan-soft)]",
  rose: "text-[color:var(--rose)] bg-[color:var(--rose-soft)]",
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      <header className="sticky top-0 z-40 bg-[rgba(11,15,23,0.85)] backdrop-blur-md border-b border-[color:var(--border)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-lg font-bold shadow-[0_8px_22px_rgba(245,158,11,0.3)]">م</div>
            <div className="flex flex-col">
              <span className="font-bold text-[color:var(--text)] leading-tight">مركزك</span>
              <span className="text-[10px] text-[color:var(--muted)] uppercase tracking-wider">Training Center OS</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[color:var(--muted)]">
            <a href="#modules" className="hover:text-[color:var(--text)] transition-colors">الوحدات</a>
            <a href="#why" className="hover:text-[color:var(--text)] transition-colors">لماذا مركزك</a>
            <Link href="/plans" className="hover:text-[color:var(--text)] transition-colors">الأسعار</Link>
          </nav>
          <Link href="/login" className="primary !min-h-0 py-2 px-4">دخول النظام</Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(900px 480px at 85% -10%, rgba(245,158,11,0.12), transparent 60%), radial-gradient(700px 400px at 10% 110%, rgba(91,155,255,0.07), transparent 55%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28 text-center">
          <span className="badge">v2.0 — منصة SaaS عربية بالكامل</span>
          <h1 className="mt-6 text-4xl lg:text-6xl font-extrabold leading-[1.25]">
            مركزك — نظام تشغيل
            <br />
            <span className="text-[color:var(--gold)]">مراكز التدريب</span> من مكان واحد
          </h1>
          <p className="mt-6 text-lg text-[color:var(--muted)] max-w-2xl mx-auto">
            الطلاب، الدورات، الحضور، الفواتير، الشهادات والتقارير — بواجهة عربية داكنة فاخرة،
            تعدد مستأجرين، وأمان على مستوى الإنتاج.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="primary px-8 py-3">ابدأ الآن <ArrowLeft size={18} /></Link>
            <a href="#modules" className="ghost px-8 py-3">استعرض الوحدات</a>
          </div>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs text-[color:var(--muted)]">
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">8 وحدات تشغيلية</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">تعدد مستأجرين (Multi-tenant)</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">عربي RTL أصيل</span>
            <span className="px-3 py-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)]">مدفوعات Stripe</span>
          </div>
        </div>
      </section>

      <section id="modules" className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <span className="badge">الوحدات</span>
          <h2 className="mt-4 text-3xl font-extrabold">كل ما يحتاجه مركزك… في نظام واحد</h2>
          <p className="mt-3 text-[color:var(--muted)]">وحدات متكاملة تعمل معاً — من تسجيل الطالب حتى إصدار الشهادة.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((m) => (
            <div key={m.title} className="bento-card p-6 hover:-translate-y-1 transition-transform duration-200">
              <div className={"w-11 h-11 rounded-xl flex items-center justify-center mb-4 " + accents[m.accent]}>
                <m.Icon size={22} />
              </div>
              <h3 className="font-bold text-[color:var(--text)]">{m.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="why" className="max-w-6xl mx-auto px-4 py-16">
        <div className="bento-card p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="badge">لماذا مركزك</span>
              <h2 className="mt-4 text-3xl font-extrabold leading-snug">مبني لمراكز التدريب السعودية والخليج</h2>
              <p className="mt-4 text-[color:var(--muted)] leading-relaxed">
                بدل الأنظمة الموروثة والمنصات الأجنبية غير العربية — واجهة RTL أصيلة،
                عملة ريال، تقارير جاهزة، ونشر سحابي سريع على Vercel مع قاعدة Neon المُدارة.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-[color:var(--text-soft)]">
                <li className="flex items-center gap-2"><Layers size={16} className="text-[color:var(--gold)]" /> بنية Multi-tenant بعزل كامل للبيانات</li>
                <li className="flex items-center gap-2"><Building2 size={16} className="text-[color:var(--gold)]" /> لوحة تحكم عربية داكنة مريحة للعمل الطويل</li>
                <li className="flex items-center gap-2"><Sparkles size={16} className="text-[color:var(--gold)]" /> خارطة طريق نشطة: مكتبة ملفات، فيديو آمن، امتحانات إلكترونية</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login" className="primary px-8 py-3">ابدأ الآن <ArrowLeft size={18} /></Link>
                <Link href="/plans" className="ghost px-8 py-3">الباقات والأسعار</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">8</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">وحدات تشغيلية</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">100%</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">واجهة عربية RTL</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">RBAC</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">صلاحيات وسجل تدقيق</div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 text-center">
                <div className="text-3xl font-black text-[color:var(--gold)]">24/7</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">مراقبة /api/health</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[color:var(--border)] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[color:var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center font-bold">م</span>
            <span>مركزك — Training Center OS © 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-[color:var(--text)] transition-colors">تسجيل الدخول</Link>
            <Link href="/plans" className="hover:text-[color:var(--text)] transition-colors">الأسعار</Link>
            <Link href="/verify" className="hover:text-[color:var(--text)] transition-colors">تحقق شهادة</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}