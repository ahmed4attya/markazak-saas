"use client";
import type { ReactNode } from "react";
export default function Marquee({ children, speed = 40, reverse = false, className = "" }: { children: ReactNode; speed?: number; reverse?: boolean; className?: string }) {
  const track = "flex w-max shrink-0 items-stretch gap-5 pr-5 group-hover:[animation-play-state:paused]";
  const anim = reverse ? "mkz-marquee-rev" : "mkz-marquee";
  return (
    <div dir="ltr" className={"group relative flex overflow-hidden " + className}>
      <style>{`@keyframes mkz-marquee { from { transform: translateX(0); } to { transform: translateX(-100%); } } @keyframes mkz-marquee-rev { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
      <div className={track} style={{ animation: `${anim} ${speed}s linear infinite` }}>{children}</div>
      <div className={track} style={{ animation: `${anim} ${speed}s linear infinite` }} aria-hidden>{children}</div>
    </div>
  );
}