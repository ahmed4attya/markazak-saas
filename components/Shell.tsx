'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers, FolderOpen, CalendarCheck,
  Wallet, FileBadge, BarChart3, Brain, UserCog, Settings, LogOut, Search, MonitorPlay,
  Bell, Building2, ChevronDown, Menu, ClipboardList, CreditCard, HelpCircle, NotebookPen, KeyRound, BookMarked,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import InstallPWA from './InstallPWA';
import { isAdminRole } from '@/lib/roles';
import QuickContact from './QuickContact';
type NavItem = [string, string, any];
type NavGroup = { title: string; items: NavItem[] };
const groups: NavGroup[] = [
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
      ['/questions', 'بنك الأسئلة', HelpCircle],
      ['/exams', 'الامتحانات', ClipboardList],
      ['/lessons', 'الدروس', BookMarked],
      ['/assignments', 'الواجبات', NotebookPen],
      ['/gradebook', 'سجل الدرجات', ClipboardList],
      ['/finance', 'الفواتير والمدفوعات', Wallet],
      ['/certificates', 'الشهادات', FileBadge],
    ],
  },
  {
    title: 'التواصل السريع',
    items: [
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
      ['/activation-codes', 'أكواد التفعيل', KeyRound],
      ['/audit', 'سجل التدقيق', ClipboardList],
    ],
  },
];

// Items visible only to admin/owner/manager (DEC-062 isolation + owner sidebar spec)
const ADMIN_ONLY: string[] = ['/finance', '/users', '/settings', '/plans', '/audit', '/reports', '/certificates', '/activation-codes', '/ai'];

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
  const [collapsed, setCollapsed] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const [role, setRole] = useState('');
  const [tenantName, setTenantName] = useState('سنتر الخوارزمي');

  useEffect(() => {
    setCollapsed(localStorage.getItem('mkz-sidebar-collapsed') === '1');
    setDateStr(new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }));
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && d.role) setRole(String(d.role)); if (d && d.tenantName) setTenantName(String(d.tenantName)); }).catch(() => {});
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem('mkz-sidebar-collapsed', v ? '0' : '1');
      return !v;
    });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const isAdmin = isAdminRole(role);

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const href = item[0];
        if (isAdmin) return true;
        if (role === 'teacher') {
          if (ADMIN_ONLY.indexOf(href) >= 0) return false;
        }
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 bg-[color:var(--surface)] border-l border-[color:var(--border)] transition-all duration-300 ease-in-out',
          collapsed ? 'w-72 lg:w-20' : 'w-72',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-xl font-bold shadow-[0_10px_26px_rgba(245,158,11,0.3)]">
              خ
            </div>
            <div className={cn('flex flex-col min-w-0', collapsed && 'lg:hidden')}>
              <span className="text-lg font-bold text-[color:var(--text)] leading-tight truncate">{tenantName}</span>
              <span className="text-[11px] text-[color:var(--muted)] font-medium uppercase tracking-wider">Al-Khwarizmi Center</span>
            </div>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex mr-auto w-7 h-7 shrink-0 items-center justify-center rounded-lg text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] transition-colors"
              title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
              aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
            >
              <ChevronDown size={15} className={cn('transition-transform duration-300', collapsed ? '-rotate-90' : 'rotate-90')} />
            </button>
          </div>

          <div className={cn('flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--text-soft)] text-xs font-medium mb-2 cursor-pointer hover:bg-[color:var(--surface-3)] transition-colors', collapsed && 'lg:hidden')}>
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[color:var(--muted-dim)]" />
              <span>{tenantName}</span>
            </div>
            <ChevronDown size={14} />
          </div>

          <div className={cn('flex items-center gap-2 p-2 rounded-xl bg-[color:var(--gold-soft)] border border-[color:var(--gold-border)] text-[color:var(--gold)] text-[11px] font-bold mb-4', collapsed && 'lg:hidden')}>
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
            <span>اشتراك نشط — خطة الاحترافية</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto nav-scroll">
            {visibleGroups.map((g) => (
              <div key={g.title}>
                {g.title === 'التواصل السريع' ? (
                  isAdmin && (
                    <button onClick={() => setQcOpen(true)} className={cn('w-full text-right text-[11px] font-bold text-[color:var(--muted-dim)] uppercase tracking-widest mb-2 px-3 hover:text-[color:var(--gold)] transition-colors cursor-pointer', collapsed && 'lg:hidden')}>{g.title}</button>
                  )
                ) : (
                  <p className={cn('text-[11px] font-bold text-[color:var(--muted-dim)] uppercase tracking-widest mb-2 px-3', collapsed && 'lg:hidden')}>{g.title}</p>
                )}
                <nav className="space-y-1">
                  {g.items.map((item: NavItem) => {
                    const href = item[0]; const label = item[1]; const Icon = item[2];
                    if (href.startsWith('soon:')) {
                      return (
                        <div key={href} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[color:var(--muted-dim)] cursor-default">
                          <Icon size={18} />
                          <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
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
                        title={collapsed ? label : undefined}
                        className={cn(
                          'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                          isActive
                            ? 'text-[color:var(--gold)]'
                            : 'text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]'
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="mkz-nav-pill"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                            className="absolute inset-0 rounded-lg bg-[color:var(--gold-soft)] shadow-sm"
                          />
                        )}
                        <Icon size={18} className={cn('relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110', isActive ? 'text-[color:var(--gold)]' : 'text-[color:var(--muted)] group-hover:text-[color:var(--text)]')} />
                        <span className={cn('relative z-10 whitespace-nowrap', collapsed && 'lg:hidden')}>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <button
            onClick={toggleCollapsed}
            className={cn('hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] transition-colors w-full', collapsed && 'justify-center')}
            title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            <ChevronDown size={15} className={cn('transition-transform duration-300', collapsed ? '-rotate-90' : 'rotate-90')} />
            <span className={cn(collapsed && 'lg:hidden')}>طي القائمة</span>
          </button>

        </div>
      </aside>

      <main className={cn('flex-1 min-h-screen flex flex-col min-w-0 overflow-x-clip transition-[margin] duration-300', collapsed ? 'lg:mr-20' : 'lg:mr-72')}>
        <header className="h-16 bg-[rgba(var(--glass-rgb),0.85)] backdrop-blur-md border-b border-[color:var(--border)] sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <div className="relative group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-dim)] group-focus-within:text-[color:var(--gold)] transition-colors" />
              <input
                className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-full py-2 pr-12 pl-4 text-left text-sm w-64 lg:w-96 focus:ring-2 focus:ring-[rgba(91,155,255,0.25)] focus:bg-[color:var(--surface-3)] transition-all outline-none text-[color:var(--text)] placeholder:text-[color:var(--muted-dim)]"
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
              className="flex items-center gap-1.5 p-2 text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] rounded-full transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
              <span className="hidden xl:inline text-xs font-medium">خروج</span>
            </button>
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-[color:var(--text-soft)]">{role === 'student' ? 'طالب' : role === 'guardian' ? 'ولي أمر' : role === 'teacher' ? 'مدرب' : 'مدير النظام'}</span>
                <span className="text-[11px] text-[color:var(--muted)]">{tenantName}</span>
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
      {isAdmin && <QuickContact open={qcOpen} onClose={() => setQcOpen(false)} />}
    </div>
  );
}
