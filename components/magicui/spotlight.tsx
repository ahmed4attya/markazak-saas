"use client";
import React, { useEffect, useState } from "react";
export default function Spotlight({ color = "rgba(245,158,11,0.12)", className = "" }: { color?: string; className?: string }) {
  const [pos, setPos] = useState({ x: 400, y: 300 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return (
    <div
      className={"pointer-events-none absolute inset-0 z-0 transition-all duration-300 " + className}
      style={{ background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 70%)` }}
    />
  );
}