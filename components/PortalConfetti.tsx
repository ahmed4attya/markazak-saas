"use client";

import { useEffect, useRef } from "react";

type P = {
  x: number; y: number; vx: number; vy: number;
  s: number; r: number; vr: number; c: string;
};

const COLORS = ["#fbbf24", "#f59e0b", "#5b9bff", "#a78bfa", "#3ddc97"];

export default function PortalConfetti({ fire }: { fire: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fire) return;
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    const ps: P[] = [];
    for (let i = 0; i < 140; i++) {
      ps.push({
        x: Math.random() * cv.width,
        y: -20 - Math.random() * cv.height * 0.3,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2 + Math.random() * 3.2,
        s: 5 + Math.random() * 6,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        c: COLORS[i % COLORS.length],
      });
    }
    let raf = 0;
    let t0 = 0;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const el = ts - t0;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of ps) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.r += p.vr;
        const life = Math.max(0, 1 - el / 2600);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = life;
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
        ctx.restore();
      }
      if (el < 2600) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire]);

  if (!fire) return null;
  return (
    <canvas
      ref={ref}
      className="fixed inset-0 z-[100] pointer-events-none"
    />
  );
}