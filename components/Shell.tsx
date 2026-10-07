'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarCheck,
  Wallet,
  FileBadge,
  Brain,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Bell,
  Building2,
  ChevronDown,
  Menu,
  X,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const nav = [
  ['/dashboard', 'الرئيسية', LayoutDashboard],
  ['/students', 'الطلاب', Users],
  ['/teachers', 'المدربون', GraduationCap],
  ['/courses', 'الدورات', BookOpen],
  ['/groups', 'المجموعات', Layers],
  ['/attendance', 'الحضور', CalendarCheck],
  ['/finance', 'المالية', Wallet],
  ['/certificates', 'الشهادات', FileBadge],
  ['/reports', 'التقارير', BarChart3],
] as const;

const admin = [
  ['/users', 'المستخدمون', UserCog],
  ['/plans', 'الاشتراك والخطط', Wallet],
  ['/ai', 'الذكاء الاصطناعي', Brain],
  ['/settings', 'الإعدادات', Settings],
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

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-['Cairo']" dir="rtl">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-white border-l border-slate-200 transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-200">
              م
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-800 leading-tight">مركزك</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Training Center OS</span>
            </div>
          </div>

          {/* Academy Switcher */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium mb-6 cursor-pointer hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-slate-400" />
              <span>أكاديمية الريادة</span>
            </div>
            <ChevronDown size={14} />
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">القائمة الرئيسية</p>
              <nav className="space-y-1">
                {nav.map(([href, label, Icon]) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                        isActive 
                          ? "bg-blue-50 text-blue-600 shadow-sm" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <Icon size={18} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">الإدارة</p>
              <nav className="space-y-1">
                {admin.map(([href, label, Icon]) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                        isActive 
                          ? "bg-blue-50 text-blue-600 shadow-sm" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      )}
                    >
                      <Icon size={18} className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                م
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-700 truncate">مدير النظام</span>
                <span className="text-[10px] text-slate-400 truncate">مالك المركز</span>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:mr-72 min-h-screen flex flex-col transition-all duration-300">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setOpen(true)} 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="relative group">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                className="bg-slate-100 border-none rounded-full py-2 pr-10 pl-4 text-sm w-64 lg:w-96 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none" 
                placeholder="ابحث عن طالب، دورة، فاتورة..." 
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-700">مدير النظام</span>
                <span className="text-[10px] text-slate-400">أكاديمية الريادة</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                م
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="p-4 lg:p-8 flex-1">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 leading-tight">{title}</h1>
            {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
          </div>
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
