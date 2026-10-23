"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import NumberFlow from "@number-flow/react";
import {
  Bell, CalendarCheck, Award, NotebookPen, Zap,
  BookOpen, FolderOpen, Video, KeyRound, LogOut,
} from "lucide-react";

type Me = {
  name: string;
  role?: string;
  points?: number;
  level?: string;
};

const MENU = [
  { href: "/portal/notifications", label: "الإشعارات", Icon: Bell },
  { href: "/portal/attendance", label: "حضوري", Icon: CalendarCheck },
  { href: "/portal/results", label: "نتائجي", Icon: Award },
  { href: "/portal/assignments", label: "واجباتي", Icon: NotebookPen },
  { href: "/portal/training", label: "التدريب", Icon: Zap },
  { href: "/portal/courses", label: "دوراتي", Icon: BookOpen },
  { href: "/portal/library", label: "المكتبة", Icon: FolderOpen },
  { href: "/portal/videos", label: "الفيديوهات", Icon: Video },
  { href: "/portal/redeem", label: "تفعيل كود", Icon: KeyRound },
];

const ROLE_LABELS: Record<string, string> = {
  student: "طالب",
  guardian: "ولي أمر",
};

export default function PortalAccount() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/learner/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setMe(d); })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const role = String(me?.role || "");
  const roleLabel = ROLE_LABELS[role] || "عضو";
  const initial = (me?.name || "ط").trim().charAt(0);

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={[
          "rounded-3xl p-5 flex items-center gap-4 relative",
          "overflow-hidden border",
          "border-[color:var(--gold-border)]",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(145deg, var(--surface) 0%, var(--surface-2) 100%)",
        }}
      >
        <div
          className="absolute -top-14 -right-12 w-36 h-36 rounded-full"
          style={{
            background: "var(--gold-soft)",
            filter: "blur(36px)",
          }}
        />
        <span
          className={[
            "w-16 h-16 rounded-2xl grid place-items-center",
            "text-2xl font-black text-[#3a2b06] shrink-0",
          ].join(" ")}
          style={{ background: "var(--gold-cta)" }}
        >
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className="text-lg font-black truncate">
            {me?.name || "..."}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={[
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
              ].join(" ")}
              style={{
                background: "var(--gold-soft)",
                color: "var(--gold)",
              }}
            >
              {roleLabel}
            </span>
            {me?.level && (
              <span
                className={[
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  "border border-[color:var(--blue-border)]",
                ].join(" ")}
                style={{
                  background: "var(--blue-soft)",
                  color: "var(--blue)",
                }}
              >
                المستوى: {me.level}
              </span>
            )}
          </div>
          <p className="text-xs text-[color:var(--muted)] mt-1.5">
            النقاط:{" "}
            <NumberFlow
              value={Number(me?.points || 0)}
              className="font-black text-[color:var(--gold)]"
            />
          </p>
        </div>
      </motion.section>

      <section>
        <div className="space-y-1.5">
          {MENU.map((m, i) => {
            const Icon = m.Icon;
            return (
              <motion.div
                key={m.href}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
              >
                <Link
                  href={m.href}
                  className={[
                    "bento-card px-4 flex items-center gap-3",
                    "min-h-[52px] hover:border-[color:var(--gold-border)]",
                    "transition-colors",
                  ].join(" ")}
                >
                  <Icon size={19} style={{ color: "var(--gold)" }} />
                  <span className="text-sm font-semibold flex-1">
                    {m.label}
                  </span>
                  <span className="text-[color:var(--muted-dim)]">‹</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <button
          onClick={logout}
          className={[
            "w-full min-h-[48px] rounded-2xl text-sm font-bold",
            "flex items-center justify-center gap-2",
            "border border-[color:var(--danger-border)]",
            "transition-colors",
          ].join(" ")}
          style={{
            background: "var(--danger-soft)",
            color: "var(--danger)",
          }}
        >
          <LogOut size={17} />
          تسجيل الخروج
        </button>
        <p className="text-center text-[10px] text-[color:var(--muted-dim)] mt-4">
          بوابة الطالب · منصة الخوارزمي · الإصدار 1.0
        </p>
      </section>
    </div>
  );
}