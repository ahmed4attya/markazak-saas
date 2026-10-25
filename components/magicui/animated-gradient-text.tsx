"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
export default function AnimatedGradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#fbbf24] bg-[length:200%_auto] ${className}`}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  );
}