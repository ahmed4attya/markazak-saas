'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import {
  Home,
  ClipboardList,
  Wrench,
  TrendingUp,
  UserRound,
  Bell,
  Sparkles,
  Calculator,
  Swords,
  BookOpen,
} from 'lucide-react';

const TABS = [
  { href: '/portal', label: 'الرئيسية', Icon: Home },
  { href: '/portal/exams', label: 'اختباراتي', Icon: ClipboardList },
  { href: '/portal/courses', label: 'دوراتي', Icon: BookOpen },
  { href: '/portal/mistakes', label: 'أخطائي', Icon: Wrench },
  { href: '/portal/progress', label: 'تقدمي', Icon: TrendingUp },
  { href: '/portal/account', label: 'حسابي', Icon: UserRound },
];

type Note = {
  id: string;
  title: string;
  created_at: string;
  read_at?: string | null;
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const immersive = pathname.startsWith('/portal/exams/');
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [tenantName, setTenantName] = useState('منصة الخوارزمي');
  const [notes, setNotes] = useState<Note[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/learner/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.name) setMe(d);
      })
      .catch(() => {});
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.tenantName) setTenantName(String(d.tenantName));
      })
      .catch(() => {});
    fetch('/api/learner/notifications')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const rows: Note[] = Array.isArray(d) ? d : [];
        setNotes(rows.slice(0, 8));
        setUnread(rows.filter((x) => !x.read_at).length);
      })
      .catch(() => {});
  }, []);

  const initial = (me?.name || 'ط').trim().charAt(0);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic',sans-serif] selection:bg-amber-500/30 selection:text-amber-300 transition-colors duration-200"
    >
      {/* 1. Universal Top Navigation Bar */}
      {!immersive && (
        <header className="fixed top-0 inset-x-0 z-40 bg-[rgba(var(--glass-rgb),0.85)] backdrop-blur-xl border-b border-[color:var(--border)] transition-all">
          <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
            {/* Logo & Tenant Identity */}
            <Link href="/portal" className="flex items-center gap-3 min-w-0 group">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xl grid place-items-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
                خ
              </span>
              <div className="leading-tight min-w-0">
                <span className="block text-sm font-black text-[color:var(--text)] group-hover:text-amber-500 transition-colors truncate">
                  بوابة الطالب الذكية
                </span>
                <span className="block text-[11px] text-[color:var(--muted)] font-medium truncate">
                  {tenantName}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-[color:var(--surface-2)]/80 p-1.5 rounded-2xl border border-[color:var(--border)]">
              {TABS.map((t) => {
                const active = pathname === t.href || (t.href !== '/portal' && pathname.startsWith(t.href));
                const Icon = t.Icon;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`relative px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all ${
                      active
                        ? 'text-amber-500 bg-[color:var(--surface-3)] shadow-sm'
                        : 'text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--surface-3)]/60'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    <span>{t.label}</span>
                    {active && (
                      <motion.span
                        layoutId="desktop-active-pill"
                        className="absolute inset-0 rounded-xl border border-amber-500/40 pointer-events-none"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Tools & Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden sm:flex items-center gap-1">
                <Link
                  href="/portal/formulas"
                  aria-label="القوانين الذهبية"
                  title="القوانين الذهبية"
                  className="w-9 h-9 grid place-items-center rounded-xl text-[color:var(--muted)] hover:text-amber-500 hover:bg-[color:var(--surface-2)] transition-colors"
                >
                  <Sparkles size={18} />
                </Link>
                <Link
                  href="/portal/calculator"
                  aria-label="حاسبة النسبة الموزونة"
                  title="حاسبة النسبة الموزونة"
                  className="w-9 h-9 grid place-items-center rounded-xl text-[color:var(--muted)] hover:text-emerald-500 hover:bg-[color:var(--surface-2)] transition-colors"
                >
                  <Calculator size={18} />
                </Link>
                <Link
                  href="/portal/self-challenge"
                  aria-label="التحدي الذاتي"
                  title="التحدي الذاتي"
                  className="w-9 h-9 grid place-items-center rounded-xl text-[color:var(--muted)] hover:text-red-500 hover:bg-[color:var(--surface-2)] transition-colors"
                >
                  <Swords size={18} />
                </Link>
              </div>

              {/* Theme Toggle (Dark / Light) */}
              <ThemeToggle />

              {/* Notifications Toggle */}
              <button
                onClick={() => setBellOpen((v) => !v)}
                aria-label="الإشعارات"
                className="relative w-9 h-9 sm:w-10 sm:h-10 grid place-items-center rounded-xl text-[color:var(--muted)] hover:text-amber-500 hover:bg-[color:var(--surface-2)] transition-colors"
              >
                <Bell size={19} />
                {unread > 0 && (
                  <span className="absolute top-1.5 left-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black grid place-items-center bg-amber-500 text-slate-950 shadow-sm animate-pulse">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {/* Student Avatar */}
              <Link
                href="/portal/account"
                aria-label="حسابي"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-500 font-black text-sm grid place-items-center shrink-0 hover:scale-105 transition-all shadow-sm"
              >
                {initial}
              </Link>
            </div>
          </div>

          {/* Notifications Dropdown Drawer */}
          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-16 inset-x-0 bg-[rgba(var(--glass-rgb),0.96)] backdrop-blur-2xl border-b border-[color:var(--border)] shadow-2xl py-3"
              >
                <div className="max-w-md mx-auto px-4">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[color:var(--border)]">
                    <span className="text-sm font-bold text-[color:var(--text)] flex items-center gap-1.5">
                      <Bell size={16} className="text-amber-500" />
                      <span>تنبيهات المنصة</span>
                    </span>
                    <Link
                      href="/portal/notifications"
                      className="text-xs font-semibold text-amber-500 hover:text-amber-600"
                      onClick={() => setBellOpen(false)}
                    >
                      عرض جميع الإشعارات
                    </Link>
                  </div>
                  {notes.length === 0 && (
                    <p className="text-xs text-[color:var(--muted)] py-4 text-center">لا توجد إشعارات جديدة حالياً</p>
                  )}
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl p-2.5 bg-[color:var(--surface-2)] border border-[color:var(--border)] hover:border-amber-500/30 transition-colors"
                      >
                        <p className="text-xs font-medium text-[color:var(--text)] line-clamp-2">{n.title}</p>
                        <span className="text-[10px] text-[color:var(--muted)] mt-1 block">
                          {new Date(n.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      {/* 2. Main Content Container */}
      <main className={immersive ? '' : 'pt-20 pb-28 md:pb-16'}>
        <div className={immersive ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. Floating Mobile Bottom Dock Navigation (md:hidden) */}
      {!immersive && (
        <nav
          className="md:hidden fixed bottom-3 inset-x-4 z-40 bg-[rgba(var(--glass-rgb),0.92)] backdrop-blur-2xl border border-[color:var(--border)] rounded-3xl shadow-2xl shadow-black/10 px-2 py-1.5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
        >
          <div className="grid grid-cols-6 items-center">
            {TABS.map((t) => {
              const active = pathname === t.href || (t.href !== '/portal' && pathname.startsWith(t.href));
              const Icon = t.Icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`relative min-h-[50px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-all ${
                    active ? 'text-amber-500' : 'text-[color:var(--muted)] hover:text-[color:var(--text)]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-active-pill"
                      className="absolute inset-0 rounded-2xl bg-amber-500/10 border border-amber-500/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon size={19} strokeWidth={active ? 2.5 : 2} className="relative z-10" />
                  <span className="text-[10px] font-bold tracking-tight relative z-10">{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
