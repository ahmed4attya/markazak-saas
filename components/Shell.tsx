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
    <div className="shell">

      {/* Sidebar */}
      <aside className={open ? 'sidebar open' : 'sidebar'}>

        {/* Brand */}
        <div className="brand">
          <span>م</span>

          <div>
            <strong>مركزك</strong>
            <small>Training Center OS</small>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="close"
            aria-label="إغلاق القائمة"
          >
            <X />
          </button>
        </div>

        {/* Academy */}
        <div className="academy">
          <Building2 size={16} />
          <span>أكاديمية الريادة</span>
          <ChevronDown size={14} />
        </div>

        {/* Main Navigation */}
        <nav>
          {nav.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={
                pathname === href
                  ? 'active'
                  : ''
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Administration */}
        <div className="sectionLabel">
          الإدارة
        </div>

        <nav>
          {admin.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={
                pathname === href
                  ? 'active'
                  : ''
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sideFoot">

          <div className="userMini">

            <div className="avatar">
              م
            </div>

            <div>
              <b>مدير النظام</b>
              <small>مالك المركز</small>
            </div>

          </div>

          <button onClick={logout}>
            <LogOut size={17} />
            <span>خروج</span>
          </button>

        </div>

      </aside>

      {/* Main */}
      <main className="main">

        {/* Topbar */}
        <header className="topbar">

          <button
            className="mobile"
            onClick={() => setOpen(true)}
            aria-label="فتح القائمة"
          >
            <Menu />
          </button>

          <div className="search">
            <Search size={18} />

            <input
              placeholder="ابحث عن طالب، دورة، فاتورة..."
            />
          </div>

          <div className="topActions">

            <button
              className="iconBtn"
              aria-label="الإشعارات"
            >
              <Bell size={19} />
              <i />
            </button>

            <div className="profile">

              <div className="avatar">
                م
              </div>

              <div>
                <b>مدير النظام</b>
                <small>أكاديمية الريادة</small>
              </div>

            </div>

          </div>

        </header>

        {/* Page */}
        <section className="content">

          <div className="pageTitle">

            <div>
              <h1>{title}</h1>

              {subtitle && (
                <p>{subtitle}</p>
              )}
            </div>

          </div>

          {children}

        </section>

      </main>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="overlay"
          onClick={() => setOpen(false)}
        />
      )}

    </div>
  );
}