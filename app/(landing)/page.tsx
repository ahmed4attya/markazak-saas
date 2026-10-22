"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Tajawal } from 'next/font/google';
import { 
  ArrowRight, 
  CheckCircle2, 
  BookOpen, 
  ShieldCheck, 
  Zap, 
  Star, 
  ChevronRight, 
  Smartphone,
  Users,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '700', '900'] });

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.6, 0.05, -0.01, 1.0] }
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen bg-[#020617] text-slate-200 ${tajawal.className}`} dir="rtl">
      <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 px-6 py-4",
        scrolled ? "bg-slate-900/80 backdrop-blur-lg border-b border-slate-800" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">ق</div>
            <span className="text-2xl font-black tracking-tight text-white">مركز <span className="text-blue-500">قدرات</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="text-slate-400 hover:text-white transition-colors">المميزات</Link>
            <Link href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">كيف نعمل</Link>
            <Link href="#pricing" className="text-slate-400 hover:text-white transition-colors">الأسعار</Link>
            <Link href="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25">دخول الطلاب</Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-right">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6 border border-blue-500/20"
            >
              <Star size={14} className="fill-blue-400" />
              <span>المنصة الرائدة في المملكة للقدرات والتحصيلي</span>
            </motion.div>
            
            <motion.h1 
              initial="initial" animate="animate" variants={fadeInUp}
              className="text-5xl lg:text-7xl font-black tracking-tighter text-white mb-8 leading-[1.1]"
            >
              طريقك المضمون للتفوق في <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 via-indigo-400 to-blue-600">اختبارات القدرات والتحصيلي</span>
            </motion.h1>

            <motion.p 
              initial="initial" animate="animate" variants={fadeInUp}
              className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed"
            >
              نقدم تجربة تعليمية ذكية تعتمد على تحليل نقاط ضعفك، بنوك أسئلة محدثة، ومتابعة لحظية تضمن وصولك للدرجة الكاملة بإذن الله.
            </motion.p>

            <motion.div 
              initial="initial" animate="animate" variants={fadeInUp}
              className="flex flex-wrap gap-4"
            >
              <Link href="/register" className="group bg-blue-600 text-white px la-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 flex items-center gap-2">
                ابدأ رحلتك الآن
                <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link href="/about" className="bg-slate-800/50 text-white border border-slate-700 px la-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all backdrop-blur-sm">
                اكتشف المزيد
              </Link>
            </motion.div>
          </div>

          <div className="relative">
            <motion.div 
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
              className="relative z-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-4 shadow-2xl shadow-blue-500/10"
            >
              <div className="bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-800 aspect-[9/16] max-w-sm mx-auto relative">
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600" />
                    <div className="w-20 h-4 bg-slate-800 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-slate-800 rounded-lg" />
                    <div className="h-4 w-1/2 bg-slate-800 rounded-lg opacity-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4">
                      <div className="h-4 w-1/2 bg-blue-400 rounded-full mb-2" />
                      <div className="h-8 w-full bg-blue-600 rounded-lg" />
                    </div>
                    <div className="h-24 bg-slate-800 border border-slate-700 rounded-2xl p-4">
                      <div className="h-4 w-1/2 bg-slate-600 rounded-full mb-2" />
                      <div className="h-8 w-full bg-slate-700 rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-full bg-slate-800 rounded-full" />
                          <div className="h-2 w-2/3 bg-slate-800 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div 
              animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 -right-10 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-3 border border-slate-100"
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white"><CheckCircle2 size={16} /></div>
              <span className="font-bold text-sm">تم إتقان 15 سؤالاً اليوم!</span>
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-10 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Zap size={16} /></div>
              <span className="font-bold text-sm">تطور المستوى: +12%</span>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} مركز قدرات. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
