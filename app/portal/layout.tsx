"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, Video, FolderOpen, CalendarCheck, Bell, ClipboardList,
  NotebookPen, TrendingUp, KeyRound, Home, LogOut, Zap, Wrench,
} from "lucide-react";

// Primary mobile nav (V-S4): horizontal icon strip, gold dot under the active item.
const MOBILE_NAV = [
  { href: "/portal", label: "الرئيسية", Icon: Home },
  { href: "/portal/training", label: "التدريب", Icon: Zap },
  { href: "/portal/courses", label: "دوراتي", Icon: BookOpen },
  { href: "/portal/exams", label: "امتحاناتي", Icon: ClipboardList },
  { href: "/portal/mistakes", label: "الأخطاء", Icon: Wrench },
];

const NAV = [
  ...MOBILE_NAV,
  { href: "/portal/assignments", label: "واجباتي", Icon: NotebookPen },
  { href: "/portal/results", label: "نتائجي", Icon: TrendingUp },
  { href: "/portal/library", label: "المكتبة", Icon: FolderOpen },
  { href: "/portal/videos", label: "الفيديوهات", Icon: Video },
  { href: "/portal/attendance", label: "حضوري", Icon: CalendarCheck },
  { href: "/portal/notifications", label: "الإشعارات", Icon: Bell },
  { href: "/portal/redeem", label: "تفعيل كود", Icon: KeyRound },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [bellOpen, setBellOpen] = useState(false);
  const [bellRows, setBellRows] = useState<Array<{ id: string; title: string; created_at: string }>>([]);
  const [name, setName] = useState("");
  const [tenantName, setTenantName] = useState("منصة الخوارزمي");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/learner/me").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.name) setName(d.name);
      if (d?.role === "guardian") setName("ولي أمر");
    }).catch(() => {});
    fetch("/api/me").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.tenantName) setTenantName(d.tenantName); }).catch(() => {});
    fetch("/api/learner/notifications").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d) { setUnread(d.unread || 0); setBellRows((d.rows || []).slice(0, 5)); }
    }).catch(() => {});
  }, []);

  useEffect(() => { setBellOpen(false); }, [pathname]);

  const crumb = pathname === "/portal" ? null : (NAV.find((n) => n.href === pathname)?.label || null);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      {/* Desktop side rail */}
      <aside className="hidden lg:block fixed inset-y-0 right-0 z-40 w-64 bg-[color:var(--surface)] border-l border-[color:var(--border)]">
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-base font-bold">خ</div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-[color:var(--gold)] leading-tight">{tenantName}</span>
              <span className="text-[10px] text-[color:var(--muted)]">بوابة الطالب</span>
            </div>
          </div>
          <div className="px-2.5 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-xs text-[color:var(--text-soft)] mb-3 truncate">
            {name || "مرحباً بك"}
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors " +
                    (isActive
                      ? "bg-[color:var(--gold-soft)] text-[color:var(--gold)]"
                      : "text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]")
                  }
                >
                  <item.Icon size={17} />
                  <span>{item.label}</span>
                  {item.href === "/portal/notifications" && unread > 0 && (
                    <span className="mr-auto min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] transition-colors"
          >
            <LogOut size={17} /> خروج
          </button>
        </div>
      </aside>

      <div className="lg:mr-64 min-h-screen flex flex-col min-w-0">
        {/* Desktop header */}
        <header className="hidden lg:flex h-14 bg-[color:var(--surface)] border-b border-[color:var(--border)] sticky top-0 z-30 px-6 items-center justify-between">
          <span className="text-sm font-extrabold text-[color:var(--gold)]">{tenantName}</span>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/portal" className="text-[color:var(--muted)] hover:text-[color:var(--gold)]">لوحة الطالب</Link>
            <div className="relative">
              <button
                className="relative p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-full"
                onClick={() => setBellOpen((v) => !v)}
                aria-label="الإشعارات"
              >
                <Bell size={19} />
                {unread > 0 && <span className="absolute top-0 right-0 min-w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>}
              </button>
              {bellOpen && (
                <div className="absolute left-0 top-11 z-50 w-80 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[color:var(--border)] text-xs font-bold text-[color:var(--muted)]">آخر الإشعارات</div>
                  <div className="max-h-64 overflow-y-auto">
                    {bellRows.length === 0 && <p className="p-4 text-xs text-[color:var(--muted)]">لا إشعارات بعد</p>}
                    {bellRows.map((n) => (
                      <div key={n.id} className="px-4 py-2.5 border-b border-[color:var(--border)] last:border-0">
                        <b className="text-xs block">{n.title}</b>
                        <span className="text-[10px] text-[color:var(--muted-dim)]">{new Date(n.created_at).toLocaleString("ar-EG")}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/portal/notifications" onClick={() => setBellOpen(false)} className="block px-4 py-2.5 text-xs font-bold text-[color:var(--gold)] hover:bg-[color:var(--surface-2)] text-center">عرض الكل</Link>
                </div>
              )}
            </div>
            <span className="text-xs text-[color:var(--muted)] max-w-48 truncate">{name}</span>
            <button onClick={logout} className="text-xs font-bold text-[color:var(--danger)] hover:underline">خروج</button>
          </div>
        </header>

        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-[color:var(--surface)] border-b border-[color:var(--border)] sticky top-0 z-30 px-4 flex items-center justify-between">
          <span className="text-sm font-extrabold text-[color:var(--gold)]">{tenantName}</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="relative p-2 text-[color:var(--muted)]"
                onClick={() => setBellOpen((v) => !v)}
                aria-label="الإشعارات"
              >
                <Bell size={19} />
                {unread > 0 && <span className="absolute top-0 right-0 min-w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>}
              </button>
              {bellOpen && (
                <div className="absolute left-0 top-11 z-50 w-72 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[color:var(--border)] text-xs font-bold text-[color:var(--muted)]">آخر الإشعارات</div>
                  <div className="max-h-64 overflow-y-auto">
                    {bellRows.length === 0 && <p className="p-4 text-xs text-[color:var(--muted)]">لا إشعارات بعد</p>}
                    {bellRows.map((n) => (
                      <div key={n.id} className="px-4 py-2.5 border-b border-[color:var(--border)] last:border-0">
                        <b className="text-xs block">{n.title}</b>
                      </div>
                    ))}
                  </div>
                  <Link href="/portal/notifications" onClick={() => setBellOpen(false)} className="block px-4 py-2.5 text-xs font-bold text-[color:var(--gold)] text-center">عرض الكل</Link>
                </div>
              )}
            </div>
            <button onClick={logout} className="flex items-center gap-1 p-2 text-[color:var(--danger)]" aria-label="خروج">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {/* Mobile horizontal icon nav (V-S4): gold dot under the active icon */}
        <nav className="lg:hidden bg-[color:var(--surface)] border-b border-[color:var(--border)] sticky top-14 z-20 overflow-x-auto" aria-label="تنقل البورتال">
          <div className="flex gap-1 px-2 py-2 min-w-max">
            {MOBILE_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1.5 min-w-[64px]">
                  <item.Icon size={19} className={isActive ? "text-[color:var(--gold)]" : "text-[color:var(--muted)]"} />
                  <span className={"text-[9px] font-bold " + (isActive ? "text-[color:var(--gold)]" : "text-[color:var(--muted)]")}>{item.label}</span>
                  <span className={"h-1 w-1 rounded-full " + (isActive ? "bg-[color:var(--gold)]" : "bg-transparent")} />
                </Link>
              );
            })}
          </div>
        </nav>

        {crumb && (
          <nav className="px-4 lg:px-8 pt-4 text-xs text-[color:var(--muted)]" aria-label="مسار التنقل">
            <Link href="/portal" className="hover:text-[color:var(--gold)]">الرئيسية</Link>
            <span className="mx-1.5">/</span>
            <span className="text-[color:var(--text)] font-bold">{crumb}</span>
          </nav>
        )}
        {children}
      </div>
    </div>
  );
}
