"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, ClipboardList, Wrench, TrendingUp, UserRound, Bell,
} from "lucide-react";

const TABS = [
  { href: "/portal", label: "الرئيسية", Icon: Home },
  { href: "/portal/exams", label: "اختبارات", Icon: ClipboardList },
  { href: "/portal/mistakes", label: "أخطائي", Icon: Wrench },
  { href: "/portal/progress", label: "تقدمي", Icon: TrendingUp },
  { href: "/portal/account", label: "حسابي", Icon: UserRound },
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
  const immersive = pathname.startsWith("/portal/exams/");
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [tenantName, setTenantName] = useState("منصة الخوارزمي");
  const [notes, setNotes] = useState<Note[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/learner/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && d.name) setMe(d); })
      .catch(() => {});
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.tenantName) setTenantName(String(d.tenantName));
      })
      .catch(() => {});
    fetch("/api/learner/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        const rows: Note[] = Array.isArray(d) ? d : [];
        setNotes(rows.slice(0, 8));
        setUnread(rows.filter((x) => !x.read_at).length);
      })
      .catch(() => {});
  }, []);

  const initial = (me?.name || "ط").trim().charAt(0);

  return (
    <div
      dir="rtl"
      className={[
        "min-h-[100dvh] bg-[color:var(--bg)]",
        "text-[color:var(--text)]",
        "font-['IBM_Plex_Sans_Arabic']",
      ].join(" ")}
    >
      {!immersive && (
      <header
        className={[
          "fixed top-0 inset-x-0 z-40",
          "bg-[rgba(var(--glass-rgb),0.82)] backdrop-blur-xl",
          "border-b border-[color:var(--border)]",
        ].join(" ")}
      >
        <div className="max-w-[560px] mx-auto h-[58px] px-4 flex items-center gap-2">
          <Link href="/portal" className="flex items-center gap-2 min-w-0">
            <span
              className={[
                "w-9 h-9 rounded-xl grid place-items-center shrink-0",
                "text-[#3a2b06] font-black text-lg",
              ].join(" ")}
              style={{ background: "var(--gold-cta)" }}
            >
              خ
            </span>
            <span className="leading-tight min-w-0">
              <b className="block text-sm font-bold truncate">بوابة الطالب</b>
              <small className="block text-[10px] text-[color:var(--muted)] truncate">
                {tenantName}
              </small>
            </span>
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => setBellOpen((v) => !v)}
            aria-label="الإشعارات"
            className={[
              "relative w-11 h-11 grid place-items-center rounded-xl",
              "text-[color:var(--muted)] hover:text-[color:var(--gold)]",
              "transition-colors",
            ].join(" ")}
          >
            <Bell size={21} />
            {unread > 0 && (
              <span
                className={[
                  "absolute top-1 left-1 min-w-[18px] h-[18px] px-1",
                  "rounded-full text-[10px] font-bold grid",
                  "place-items-center text-[#3a2b06]",
                ].join(" ")}
                style={{ background: "var(--gold)" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <Link
            href="/portal/account"
            aria-label="حسابي"
            className={[
              "w-10 h-10 rounded-full grid place-items-center",
              "font-black text-sm shrink-0",
            ].join(" ")}
            style={{
              background: "var(--gold-soft)",
              color: "var(--gold)",
            }}
          >
            {initial}
          </Link>
        </div>
        <AnimatePresence>
          {bellOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="absolute top-[58px] inset-x-0"
            >
              <div className="max-w-[560px] mx-auto px-4 pb-2">
                <div className="bento-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <b className="text-sm">الإشعارات</b>
                    <Link
                      href="/portal/notifications"
                      className="text-xs text-[color:var(--gold)]"
                      onClick={() => setBellOpen(false)}
                    >
                      عرض الكل
                    </Link>
                  </div>
                  {notes.length === 0 && (
                    <p className="text-xs text-[color:var(--muted)] py-3 text-center">
                      لا إشعارات بعد
                    </p>
                  )}
                  <div className="space-y-1">
                    {notes.map((n) => (
                      <div
                        key={n.id}
                        className={[
                          "rounded-lg px-3 py-2",
                          "bg-[color:var(--surface-2)]",
                        ].join(" ")}
                      >
                        <p className="text-xs font-medium leading-5 line-clamp-2">
                          {n.title}
                        </p>
                        <small className="text-[10px] text-[color:var(--muted-dim)]">
                          {new Date(n.created_at).toLocaleDateString("ar-EG")}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      )}

      <main className={immersive ? "" : "pt-[78px] pb-[110px]"}>
        <div className={immersive ? "" : "max-w-[560px] mx-auto px-4"}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {!immersive && (
      <nav
        className={[
          "fixed bottom-0 inset-x-0 z-40",
          "bg-[rgba(var(--glass-rgb),0.94)] backdrop-blur-xl",
          "border-t border-[color:var(--border)]",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-[560px] mx-auto grid grid-cols-5">
          {TABS.map((t) => {
            const active = pathname === t.href;
            const Icon = t.Icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={[
                  "relative min-h-[56px] flex flex-col",
                  "items-center justify-center gap-0.5 pt-1.5",
                  "transition-colors",
                  active
                    ? "text-[color:var(--gold)]"
                    : "text-[color:var(--muted)]",
                ].join(" ")}
              >
                {active && (
                  <motion.span
                    layoutId="mkz-tab"
                    className="absolute top-0.5 w-10 h-1 rounded-full"
                    style={{ background: "var(--gold)" }}
                  />
                )}
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                <span className="text-[10px] font-semibold">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}