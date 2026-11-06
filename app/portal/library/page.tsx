"use client";

import { useEffect, useState } from "react";
import { Video, Download, Play } from "lucide-react";
import PortalVideoPlayer from "@/components/PortalVideoPlayer";

type VRow = { id: string; title: string; student_name?: string };
type FRow = { id: string; name: string; size_bytes: number | string; student_name?: string };

function fmt(b: number | string): string {
  const n = Number(b) || 0;
  if (n >= 1048576) return (n / 1048576).toFixed(1) + " MB";
  if (n >= 1024) return (n / 1024).toFixed(0) + " KB";
  return n + " B";
}

export default function PortalLibrary() {
  const [videos, setVideos] = useState<VRow[]>([]);
  const [files, setFiles] = useState<FRow[]>([]);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState<VRow | null>(null);
  const [tab, setTab] = useState<"videos" | "files">("videos");

  useEffect(() => {
    fetch("/api/learner/videos").then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setVideos(d); }).catch(() => {});
    fetch("/api/learner/files").then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setFiles(d); }).catch(() => {});
  }, []);

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto pt-6 space-y-4">
      <h1 className="text-xl font-extrabold mb-1">المكتبة</h1>
      {error && <div className="error">{error}</div>}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("videos")}
          className={"flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors " + (tab === "videos" ? "bg-[color:var(--gold)] text-[#0b0f17]" : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--gold-border)]")}
        >
          <Video size={13} /> الفيديوهات ({videos.length})
        </button>
        <button
          onClick={() => setTab("files")}
          className={"flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors " + (tab === "files" ? "bg-[color:var(--gold)] text-[#0b0f17]" : "border border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--gold-border)]")}
        >
          <Download size={13} /> الملفات ({files.length})
        </button>
      </div>

      {tab === "videos" && (
        <div className="space-y-2">
          {videos.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد فيديوهات بعد</div>}
          {videos.map((v) => (
            <div key={v.id + (v.student_name || "")} className="bento-card p-4 flex items-center justify-between">
              <span>{v.title}{v.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {v.student_name}</span> : null}</span>
              <button onClick={() => setPlaying(v)} className="primary !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"><Play size={12} /> تشغيل</button>
            </div>
          ))}
        </div>
      )}

      {tab === "files" && (
        <div className="space-y-2">
          {files.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا ملفات بعد</div>}
          {files.map((f) => (
            <div key={f.id + (f.student_name || "")} className="bento-card p-4 flex items-center justify-between">
              <span>{f.name}{f.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {f.student_name}</span> : null} <span className="text-xs text-[color:var(--muted)]">({fmt(f.size_bytes)})</span></span>
              <a href={"/api/files/" + f.id + "/download"} className="ghost !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"><Download size={12} /> تحميل</a>
            </div>
          ))}
        </div>
      )}

      {playing && (
        <PortalVideoPlayer videoId={playing.id} title={playing.title} onClose={() => setPlaying(null)} />
      )}
    </main>
  );
}
