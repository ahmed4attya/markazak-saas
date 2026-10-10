'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers, FolderOpen, CalendarCheck,
  Wallet, FileBadge, BarChart3, Brain, UserCog, Settings, LogOut, Search, MonitorPlay,
  Bell, Building2, ChevronDown, Menu, TrendingUp, ClipboardList, CreditCard,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import InstallPWA from './InstallPWA';

const groups = [
  { title: 'الرئيسية', items: [['/dashboard', 'لوحة التحكم', LayoutDashboard]] },
  {
    title: 'العمليات',
    items: [
      ['/students', 'الطلاب', Users],
      ['/teachers', 'المعلمون', GraduationCap],
      ['/courses', 'الدورات', BookOpen],
      ['/groups', 'المجموعات', Layers],
      ['/attendance', 'الحضور والغياب', CalendarCheck],
           ['/library', 'مكتبة الملفات', FolderOpen],
		   ['/videos', 'مكتبة الفيديو', MonitorPlay],
      ['/finance', 'الفواتير والمدفوعات', Wallet],
      ['/certificates', 'الشهادات', FileBadge],
    ],
  },
  {
    title: 'التواصل السريع',
    items: [
      ['soon:analytics', 'التحليلات', TrendingUp],
      ['/reports', 'التقارير', BarChart3],
      ['/ai', 'المساعد الذكي', Brain],
    ],
  },
  {
    title: 'الإدارة',
    items: [
      ['/users', 'المستخدمون والصلاحيات', UserCog],
      ['/settings', 'إعدادات المركز', Settings],
      ['/plans', 'الاشتراك', CreditCard],
      ['soon:audit', 'سجل التدقيق', ClipboardList],
    ],
  },
] as const;

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Shell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-72 bg-[color:var(--surface)] border-l border-[color:var(--border)] transition-transform duration-300 ease-in-out',open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-xl font-bold shadow-[0_10px_26px_rgba(245,158,11,0.3)]">
              خ
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[color:var(--text)] leading-tight">سنتر الخوارزمي</span>
              <span className="text-[11px] text-[color:var(--muted)] font-medium uppercase tracking-wider">Al-Khwarizmi Center</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--text-soft)] text-xs font-medium mb-2 cursor-pointer hover:bg-[color:var(--surface-3)] transition-colors">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[color:var(--muted-dim)]" />
              <span>سنتر الخوارزمي</span>
            </div>
            <ChevronDown size={14} />
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-[color:var(--gold-soft)] border border-[color:var(--gold-border)] text-[color:var(--gold)] text-[11px] font-bold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
            <span>اشتراك نشط — خطة الاحترافية</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto nav-scroll">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="text-[11px] font-bold text-[color:var(--muted-dim)] uppercase tracking-widest mb-2 px-3">{g.title}</p>
                <nav className="space-y-1">
                  {g.items.map(([href, label, Icon]) => {
                    if (href.startsWith('soon:')) {
                      return (
                        <div key={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[color:var(--muted-dim)] cursor-default">
                          <Icon size={18} />
                          <span>{label}</span>
                          <span className="mr-auto text-[11px] px-1.5 py-0.5 rounded-md bg-[color:var(--surface-3)] text-[color:var(--muted)]">قريباً</span>
                        </div>
                      );
                    }
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                          isActive
                            ? 'bg-[color:var(--gold-soft)] text-[color:var(--gold)] shadow-sm'
                            : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]'
                        )}
                      >
                        <Icon size={18} className={cn(isActive ? 'text-[color:var(--gold)]' : 'text-[color:var(--muted)] group-hover:text-[color:var(--text)]')} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

        </div>
      </aside>

      <main className="flex-1 lg:mr-72 min-h-screen flex flex-col min-w-0 overflow-x-clip">
        <header className="h-16 bg-[rgba(var(--glass-rgb),0.85)] backdrop-blur-md border-b border-[color:var(--border)] sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <div className="relative group">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-dim)] group-focus-within:text-[color:var(--gold)] transition-colors" />
              <input
                className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-full py-2 pr-10 pl-4 text-sm w-56 lg:w-80 focus:ring-2 focus:ring-[rgba(91,155,255,0.25)] focus:bg-[color:var(--surface-3)] transition-all outline-none text-[color:var(--text)] placeholder:text-[color:var(--muted-dim)]"
                placeholder="ابحث عن طالب، دورة، فاتورة..."
              />
            </div>
            <span className="hidden md:block text-xs text-[color:var(--muted)] font-medium">{dateStr}</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
			<InstallPWA />
            <button className="p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[color:var(--surface)]"></span>
            </button>
            <div className="h-8 w-[1px] bg-[color:var(--border-strong)] mx-1"></div>
            <button
              onClick={logout}
              title="تسجيل الخروج"
              className="p-2 text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] rounded-full transition-colors"
            >
              <LogOut size={18} />
            </button>
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-[color:var(--text-soft)]">مدير النظام</span>
                <span className="text-[11px] text-[color:var(--muted)]">سنتر الخوارزمي</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[color:var(--gold)] text-[#0b0f17] flex items-center justify-center font-bold text-sm shadow-sm">خ</div>
            </div>
          </div>
        </header>

        <section className="p-4 lg:p-8 flex-1 min-w-0">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-[color:var(--text)] leading-tight">{title}</h1>
            {subtitle && <p className="text-[color:var(--muted)] text-sm mt-1">{subtitle}</p>}
          </div>
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-[rgba(2,6,16,0.5)] backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}