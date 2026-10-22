"use client";
import { motion } from "framer-motion";
import type { ComponentProps, ReactNode } from "react";
export default function ShimmerButton({ children, className = "", ...props }: { children?: ReactNode; className?: string } & ComponentProps<typeof motion.button>) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-full bg-slate-900 text-white px-6 py-3 font-bold transition-all ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" />
      {children}
    </motion.button>
  );
}
