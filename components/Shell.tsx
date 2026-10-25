"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers, FolderOpen, CalendarCheck,
  Wallet, FileBadge, BarChart3, Brain, UserCog, Settings, LogOut, Search, MonitorPlay,
  Bell, Building2, ChevronDown, Menu, ClipboardList, CreditCard, HelpCircle, NotebookPen, KeyRound, BookMarked,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import InstallPWA from './InstallPWA';
import { isAdminRole } from '@/lib/roles';
import QuickContact from './QuickContact';
import { PAGE_ACCESS, AccessRole } from '@/config/access';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers, FolderOpen, CalendarCheck,
  Wallet, FileBadge, BarChart3, Brain, UserCog, Settings, LogOut, Search, MonitorPlay,
  Bell, Building2, ChevronDown, Menu, ClipboardList, CreditCard, HelpCircle, NotebookPen, KeyRound, BookMarked,
};

type NavItem = { href: string; label: string; icon: any };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS_SCHEMA = [
  { title: 'الرئيسية', paths: ['/dashboard'] },
  {
    title: 'العمليات',
    paths: [
      '/students', '/teachers', '/courses', '/groups', '/attendance', 
      '/library', '/videos', '/questions', '/exams', '/lessons', 
      '/assignments', '/gradebook', '/finance', '/certificates'
    ],
  },
  {
    title: 'التواصل السريع',
    paths: ['/reports', '/ai'],
  },
  {
    title: 'الإدارة',
    paths: ['/users', '/settings', '/plans', '/activation-codes', '/audit'],
  },
];

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
  const [role, setRole] = useState<AccessRole>('staff');
  const [tenantName, setTenantName] = useState('منصة الخوارزمي');

  useEffect(() => {
    setCollapsed(localStorage.getItem('mkz-sidebar-collapsed') === '1');
    setDateStr(new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }));
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { 
      if (d && d.role) setRole(d.role as AccessRole); 
      if (d && d.tenantName) setTenantName(String(d.tenantName)); 
    }).catch(() => {});
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

  const visibleGroups: NavGroup[] = GROUPS_SCHEMA.map(group => {
    const items = group.paths
      .map(path => {
        const config = PAGE_ACCESS.find(p => p.path === path);
        if (!config) return null;
        if (!config.public && !config.roles.includes(role)) return null;
        
        const labelMap: Record<string, string> = {
          '/dashboard': 'لوحة التحكم', '/students': 'الطلاب', '/teachers': 'المعلمون', 
          '/courses': 'الدورات', '/groups': 'المجموعات', '/attendance': 'الحضور والغياب',
          '/library': 'مكتبة الملفات', '/videos': 'مكتبة الفيديو', '/questions': 'بنك الأسئلة',
          '/exams': 'الامتحانات', '/lessons': 'الدروس', '/assignments': 'الواجبات',
          '/gradebook': 'سجل الدرجات', '/finance': 'الفواتير والمدفوعات', '/certificates': 'الشهادات',
          '/reports': 'التقارير', '/ai': 'المساعد الذكي', '/users': 'المستخدمون والصلاحيات',
          '/settings': 'إعدادات المركز', '/plans': 'الاشتراك', '/activation-codes': 'أكواد التفعيل',
          '/audit': 'سجل التدقيق',
        };
        const iconMap: Record<string, string> = {
          '/dashboard': 'LayoutDashboard', '/students': 'Users', '/teachers': 'GraduationCap',
          '/courses': 'BookOpen', '/groups': 'Layers', '/attendance': 'CalendarCheck',
          '/library': 'FolderOpen', '/videos': 'MonitorPlay', '/questions': 'HelpCircle',
          '/exams': 'ClipboardList', '/lessons': 'BookMarked', '/assignments': 'NotebookPen',
          '/gradebook': 'ClipboardList', '/finance': 'Wallet', '/certificates': 'FileBadge',
          '/reports': 'BarChart3', '/ai': 'Brain', '/users': 'UserCog',
          '/settings': 'Settings', '/plans': 'CreditCard', '/activation-codes': 'KeyRound',
          '/audit': 'ClipboardList',
        };

        return {
          href: path,
          label: labelMap[path] || path,
          icon: ICON_MAP[iconMap[path] || ''],
        };
      })
      .filter(Boolean) as { href: string; label: string; icon: any }[];

    return { title: group.title, items };
  }).filter(g => g.items.length > 0);

  return (
    <div className="flex min-h-screen bg-[color:var(--bg)] font-sans text-right" dir="rtl">
      <aside className={cn(
        "fixed top-0 right-0 z-50 h-screen transition-transform duration-300 border-l border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] flex flex-col shadow-2xl lg:shadow-none",
        collapsed ? "w-20" : "w-64",
        open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b border-[color:var(--border)] flex items-center justify-between">
          {!collapsed && <b className="text-lg font-bold truncate">{tenantName}</b>}
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 text-[color:var(--muted)] hover:text-[color:var(--text)] rounded-lg hover:bg-[color:var(--surface-2)]">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {visibleGroups.map((group, i) => (
            <div key={i}>
              {!collapsed && <span className="text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider block mb-3 px-2">{group.title}</span>}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group",
                      pathname === item.href ? "bg-[color:var(--blue-soft)] text-[color:var(--blue)] font-bold" : "hover:bg-[color:var(--surface-2)] text-[color:var(--text-soft)] hover:text-[color:var(--text)]"
                    )}
                  >
                    <item.icon size={20} className={cn("transition-colors", pathname === item.href ? "text-[color:var(--blue)]" : "group-hover:text-[color:var(--text)]")} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-[color:var(--border)] space-y-2">
          <button onClick={toggleCollapsed} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[color:var(--text-soft)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] transition-all">
            <Menu size={20} />
            {!collapsed && <span className="text-sm">طي القائمة</span>}
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={20} />
            {!collapsed && <span className="text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen w-full min-w-0",
        collapsed ? "lg:mr-20 mr-0" : "lg:mr-64 mr-0"
      )}>
        <header className="sticky top-0 z-30 h-16 border-b border-[color:var(--border)] bg-[color:var(--surface)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 text-[color:var(--text)] hover:bg-[color:var(--surface-2)] rounded-lg">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-[color:var(--muted)]">
              <span>{dateStr}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <InstallPWA />
            <div className="h-8 w-px bg-[color:var(--border)] mx-2" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[color:var(--text)] leading-none">{tenantName}</p>
                <p className="text-[10px] text-[color:var(--muted)] leading-none mt-1">{role}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[color:var(--blue)] to-[color:var(--violet)] border border-[color:var(--border)]" />
            </div>
          </div>
        </header>
        <section className="p-4 sm:p-6 lg:p-8 flex-1 min-w-0">
          <div className="mb-6 sm:mb-8">
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>
      {isAdmin && <QuickContact open={qcOpen} onClose={() => setQcOpen(false)} />}
    </div>
  );
}
