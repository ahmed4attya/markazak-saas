"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Video, FolderOpen, CalendarCheck, ClipboardList, NotebookPen, TrendingUp, KeyRound,
} from "lucide-react";

export default function Portal() {
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    fetch("/api/learner/me").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setMe(d); }).catch(() => {});
  }, []);

  const cards = [
    { href: "/portal/courses", label: "دوراتي", Icon: BookOpen, color: "text-[color:var(--blue)]" },
    { href: "/portal/exams", label: "امتحاناتي", Icon: ClipboardList, color: "text-[color:var(--rose)]" },
    { href: "/portal/assignments", label: "واجباتي", Icon: NotebookPen, color: "text-[color:var(--violet)]" },
    { href: "/portal/results", label: "نتائجي", Icon: TrendingUp, color: "text-[color:var(--success)]" },
    { href: "/portal/library", label: "المكتبة", Icon: FolderOpen, color: "text-[color:var(--success)]" },
    { href: "/portal/videos", label: "الفيديوهات", Icon: Video, color: "text-[color:var(--gold)]" },
    { href: "/portal/attendance", label: "حضوري", Icon: CalendarCheck, color: "text-[color:var(--indigo)]" },
    { href: "/portal/redeem", label: "تفعيل كود", Icon: KeyRound, color: "text-[color:var(--gold)]" },
  ];

  return (
    <main className="p-4 lg:p-8 max-w-4xl mx-auto pt-6">
      <h1 className="text-2xl font-extrabold mb-2">{me?.name ? `أهلاً ${me.name}` : "أهلاً بك"}</h1>
      <p className="text-[color:var(--muted)] mb-8">{me?.role === "guardian" ? "متابعة أبنائك من مكان واحد" : "مساحة التعلم الخاصة بك"}</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="bento-card p-6 flex flex-col items-center gap-3 hover:border-[color:var(--gold-border)] transition-colors">
            <c.Icon size={32} className={c.color} />
            <span className="font-bold">{c.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
