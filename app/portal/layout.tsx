"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, Video, FolderOpen, CalendarCheck, Bell, ClipboardList,
  NotebookPen, TrendingUp, KeyRound, Home, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { href: "/portal", label: "الرئيسية", Icon: Home },
  { href: "/portal/courses", label: "دوراتي", Icon: BookOpen },
  { href: "/portal/exams", label: "امتحاناتي", Icon: ClipboardList },
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tenantName, setTenantName] = useState("سنتر الخوارزمي");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/learner/me").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.name) setName(d.name);
      if (d?.role === "guardian") setName("ولي أمر");
    }).catch(() => {});
    fetch("/api/me").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.tenantName) setTenantName(d.tenantName); }).catch(() => {});
    fetch("/api/learner/notifications").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setUnread(d.unread || 0); }).catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <aside
        className={
          "fixed inset-y-0 right-0 z-50 w-64 bg-[color:var(--surface)] border-l border-[color:var(--border)] transition-transform duration-300 ease-in-out " +
          (open ? "translate-x-0" : "translate-x-full lg:translate-x-0")
        }
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-base font-bold">خ</div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">{tenantName}</span>
                <span className="text-[10px] text-[color:var(--muted)]">بوابة الطالب</span>
              </div>
            </div>
            <button className="lg:hidden p-1.5 text-[color:var(--muted)]" onClick={() => setOpen(false)} aria-label="إغلاق">
              <X size={18} />
            </button>
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
                  onClick={() => setOpen(false)}
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
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[color:var(--muted)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] transition-colors"
          >
            <LogOut size={17} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-[rgba(2,6,16,0.5)] lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="lg:mr-64 min-h-screen flex flex-col min-w-0">
        <header className="h-14 bg-[color:var(--surface)] border-b border-[color:var(--border)] sticky top-0 z-30 px-4 flex items-center justify-between">
          <button className="lg:hidden p-2 text-[color:var(--muted)]" onClick={() => setOpen(true)} aria-label="القائمة">
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold lg:hidden">{tenantName}</span>
          <div className="flex items-center gap-3">
            <Link href="/portal/notifications" className="relative p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-full">
              <Bell size={19} />
              {unread > 0 && <span className="absolute top-0 right-0 min-w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>}
            </Link>
            <span className="hidden sm:block text-xs text-[color:var(--muted)] max-w-48 truncate">{name}</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
