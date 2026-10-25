"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

function Watermark({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} style={{ position: "absolute", left: ((i % 4) * 25 + 3) + "%", top: (Math.floor(i / 4) * 33 + 10) + "%", transform: "rotate(-18deg)", opacity: 0.4, fontSize: 12, color: "#ffffff", textShadow: "0 0 2px rgba(0,0,0,.8)", whiteSpace: "nowrap" }}>{text}</span>
      ))}
    </div>
  );
}

export default function PortalVideoPlayer({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  const [wm, setWm] = useState("منصة الخوارزمي");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch("/api/me").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.name) setWm(d.name + " — " + (d.email || "") + " — " + new Date().toLocaleDateString("ar-EG"));
    }).catch(() => {});
  }, []);

  // V3: resume from the last saved position (localStorage per video)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const key = "mkz-vidpos-" + videoId;
    const saved = Number(localStorage.getItem(key) || 0);
    if (saved > 5) {
      const apply = () => { try { v.currentTime = saved; } catch { /* not ready */ } };
      v.addEventListener("loadedmetadata", apply, { once: true });
    }
  }, [videoId]);

  // V4: Esc closes the player
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function savePosition() {
    const v = videoRef.current;
    if (!v || v.currentTime < 5) return;
    try { localStorage.setItem("mkz-vidpos-" + videoId, String(Math.floor(v.currentTime))); } catch { /* ignore */ }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(2,6,16,0.7)] backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between p-3 border-b border-[color:var(--border)]">
          <b className="text-sm">{title}</b>
          <button onClick={onClose} aria-label="إغلاق" className="p-1.5 text-[color:var(--muted)] hover:text-[color:var(--text)] rounded-lg hover:bg-[color:var(--surface-2)]">
            <X size={18} />
          </button>
        </div>
        <div style={{ position: "relative", background: "#000" }}>
          <video
            ref={videoRef}
            src={"/api/videos/" + videoId + "/stream"}
            controls
            autoPlay
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={savePosition}
            onEnded={() => { try { localStorage.removeItem("mkz-vidpos-" + videoId); } catch { /* ignore */ } }}
            style={{ width: "100%", maxHeight: "70vh", display: "block" }}
          />
          <Watermark text={wm} />
        </div>
      </div>
    </div>
  );
}
