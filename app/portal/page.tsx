"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Video, FolderOpen, CalendarCheck, ClipboardList, NotebookPen, TrendingUp, KeyRound,
  Play, Flame,
} from "lucide-react";
import PortalVideoPlayer from "@/components/PortalVideoPlayer";

type PRow = {
  courseId: string;
  courseName: string;
  studentName?: string;
  total: number;
  done: number;
  pct: number;
  lastVideo: { id: string; title: string } | null;
};

function Ring({ pct, label }: { pct: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (c * pct) / 100;
  const color = pct >= 80 ? "var(--success)" : pct >= 40 ? "var(--gold)" : "var(--blue)";
  return (
    <div className="relative w-[74px] h-[74px] shrink-0" aria-label={label + " " + pct + "%"}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 74 74">
        <circle cx="37" cy="37" r={r} stroke="var(--surface-3)" strokeWidth="6" fill="transparent" />
        <circle
          cx="37" cy="37" r={r} stroke={color} strokeWidth="6" fill="transparent"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-black">{pct}%</div>
    </div>
  );
}

export default function Portal() {
  const [me, setMe] = useState<{ name: string; role: string; points?: number; level?: string } | null>(null);
  const [progress, setProgress] = useState<PRow[]>([]);
  const [playing, setPlaying] = useState<{ id: string; title: string } | null>(null);
  const [childTab, setChildTab] = useState("الكل");

  useEffect(() => {
    fetch("/api/learner/me").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setMe(d); }).catch(() => {});
    fetch("/api/learner/progress").then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setProgress(d); }).catch(() => {});
  }, []);

  // V-mission: guardian child tab switcher (الكل + every child name found in progress)
  const children = useMemo(
    () => [...new Set(progress.map((p) => p.studentName).filter(Boolean) as string[])],
    [progress]
  );
  const visibleProgress = childTab === "الكل" ? progress : progress.filter((p) => p.studentName === childTab);

  const points = me?.role === "student" ? me?.points || 0 : null;
  const level = me?.level || "مبتدئ";

  return (
    <main className="p-4 lg:p-8 max-w-4xl mx-auto pt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">{me?.name ? `أهلاً ${me.name}` : "أهلاً بك"}</h1>
          <p className="text-[color:var(--muted)]">{me?.role === "guardian" ? "متابعة أبنائك من مكان واحد" : "مساحة التعلم الخاصة بك"}</p>
        </div>
        {points !== null && (
          <div className="bento-card px-5 py-3 flex items-center gap-3">
            <Flame size={22} className="text-[color:var(--gold)]" />
            <div>
              <div className="text-xl font-black text-[color:var(--gold)]">{points} نقطة</div>
              <div className="text-[10px] text-[color:var(--muted)]">المستوى: {level}</div>
            </div>
          </div>
        )}
      </div>

      <section>
        <h2 className="font-extrabold mb-3 flex items-center gap-2">تقدمك في الدورات</h2>
        {me?.role === "guardian" && children.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {["الكل", ...children].map((c) => (
              <button
                key={c}
                onClick={() => setChildTab(c)}
                className={
                  "rounded-full px-3 py-1 text-xs font-bold transition-colors " +
                  (childTab === c
                    ? "bg-[color:var(--gold)] text-[#0b0f17]"
                    : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--gold-border)]")
                }
              >
                {c}
              </button>
            ))}
          </div>
        )}
        {progress.length === 0 && (
          <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا دورات مسجلة بعد — فعّل كوداً أو تواصل مع الإدارة</div>
        )}
        <div className="space-y-3">
          {visibleProgress.map((p) => (
            <div key={p.courseId + (p.studentName || "")} className="bento-card p-4 flex items-center gap-4">
              <Ring pct={p.pct} label={p.courseName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <b>{p.courseName}</b>
                  {p.studentName && <span className="text-xs text-[color:var(--muted)]">— {p.studentName}</span>}
                </div>
                <p className="text-xs text-[color:var(--muted)] mt-0.5">{p.done} من {p.total} مهمة مكتملة (واجبات + امتحانات)</p>
                {p.lastVideo && (
                  <button
                    onClick={() => setPlaying(p.lastVideo)}
                    className="mt-2 primary !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"
                  >
                    <Play size={12} /> متابعة المشاهدة: {p.lastVideo.title}
                  </button>
                )}
              </div>
              <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
                <Link href={"/portal/exams"} className="ghost !min-h-0 py-1 px-2.5 text-[11px] flex items-center gap-1"><ClipboardList size={12} /> الامتحانات</Link>
                <Link href={"/portal/assignments"} className="ghost !min-h-0 py-1 px-2.5 text-[11px] flex items-center gap-1"><NotebookPen size={12} /> الواجبات</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-extrabold mb-3">أقسام سريعة</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { href: "/portal/courses", label: "دوراتي", Icon: BookOpen, color: "text-[color:var(--blue)]" },
            { href: "/portal/exams", label: "امتحاناتي", Icon: ClipboardList, color: "text-[color:var(--rose)]" },
            { href: "/portal/assignments", label: "واجباتي", Icon: NotebookPen, color: "text-[color:var(--violet)]" },
            { href: "/portal/results", label: "نتائجي", Icon: TrendingUp, color: "text-[color:var(--success)]" },
            { href: "/portal/library", label: "المكتبة", Icon: FolderOpen, color: "text-[color:var(--success)]" },
            { href: "/portal/videos", label: "الفيديوهات", Icon: Video, color: "text-[color:var(--gold)]" },
            { href: "/portal/attendance", label: "حضوري", Icon: CalendarCheck, color: "text-[color:var(--indigo)]" },
            { href: "/portal/redeem", label: "تفعيل كود", Icon: KeyRound, color: "text-[color:var(--gold)]" },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="bento-card p-5 flex flex-col items-center gap-2.5 hover:border-[color:var(--gold-border)] transition-colors">
              <c.Icon size={26} className={c.color} />
              <span className="font-bold text-sm">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {playing && (
        <PortalVideoPlayer videoId={playing.id} title={playing.title} onClose={() => setPlaying(null)} />
      )}
    </main>
  );
}
