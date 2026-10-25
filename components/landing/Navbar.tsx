"use client";
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">ق</div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">مركز <span className="text-blue-600">قدرات</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="#features" className="hover:text-blue-600 transition-colors">المميزات</Link>
          <Link href="#how-it-works" className="hover:text-blue-600 transition-colors">كيف نعمل</Link>
          <Link href="#pricing" className="hover:text-blue-600 transition-colors">الأسعار</Link>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-blue-200">دخول الطلاب</Link>
        </div>
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}><Menu /></button>
      </div>
      {isOpen && (
        <div className="md:hidden bg-white p-6 border-b border-slate-200 flex flex-col gap-4 text-center">
          <Link href="#features" onClick={() => setIsOpen(false)}>المميزات</Link>
          <Link href="#how-it-works" onClick={() => setIsOpen(false)}>كيف نعمل</Link>
          <Link href="#pricing" onClick={() => setIsOpen(false)}>الأسعار</Link>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-full">دخول الطلاب</Link>
        </div>
      )}
    </nav>
  );
}
