"use client";
import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
export default function ShimmerButton({ children, className = "", ...props }: { children?: ReactNode; className?: string } & ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] px-6 py-3 font-bold shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-all ${className}`}
      {...props}
    >
      <style>{`@keyframes mkz-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" style={{ animation: "mkz-shimmer 2.4s ease-in-out infinite" }} />
      <span className="relative">{children}</span>
    </motion.button>
  );
}