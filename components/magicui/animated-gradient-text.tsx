"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
export default function AnimatedGradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.span 
      className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 bg-[length:200%_auto] animate-gradient ${className}`}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  );
}
