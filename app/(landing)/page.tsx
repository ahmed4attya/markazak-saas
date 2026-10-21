"use client";
import { motion, MotionConfig } from 'framer-motion';
import { Tajawal } from 'next/font/google';
import { CheckCircle, BookOpen, ShieldCheck, Zap, ArrowRight, Star } from 'lucide-react';
import { NumberTicker } from '@number-flow/react';
import LandingNav from '@/components/landing/Navbar';
import AnimatedGradientText from '@/components/magicui/animated-gradient-text';
import Spotlight from '@/components/magicui/spotlight';
import ShimmerButton from '@/components/magicui/shimmer-button';
import Link from 'next/link';

const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '700', '900'] });

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function LandingPage() {
  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${tajawal.className}`} dir="rtl">
      <MotionConfig reducedMotion="user">
        <LandingNav />

        <section className="relative overflow-hidden pt-20 pb-32">
          <Spotlight />
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <motion.div 
              initial="initial" animate="animate" variants={fadeIn}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-bold mb-8 border border-blue-100"
            >
              <Star size={14} className="fill-blue-600" />
              <span>المنصة الأولى في المملكة للتحضير للقدرات والتحصيلي</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              طريقك المضمون للتفوق في <br />
              <AnimatedGradientText className="text-5xl md:text-7xl">اختبارات القدرات والتحصيلي</AnimatedGradientText>
            </h1>

            <motion.p 
              initial="initial" animate="animate" variants={fadeIn}
              className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              نقدم لك تجربة تعليمية ذكية تعتمد على تحليل نقاط ضعفك، بنوك أسئلة محدثة، ومتابعة لحظية تضمن وصولك لأعلى الدرجات.
            </motion.p>

            <motion.div 
              initial="initial" animate="animate" variants={fadeIn}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link href="/register" className="group bg-blue-600 text-white px la-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                ابدأ رحلتك الآن
                <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link href="/about" className="bg-white text-slate-900 border border-slate-200 px la-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
                اكتشف المزيد
              </Link>
            </motion.div>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-200 pt-12">
              {[
                { label: 'مركز', value: 120 },
                { label: 'طالب', value: 15000 },
                { label: 'سؤال', value: 50000 },
                { label: 'اختبار هذا الأسبوع', value: 1200 },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <NumberTicker value={stat.value} className="text-4xl font-black text-blue-600" />
                  <span className="text-slate-500 text-sm font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">لماذا تختار منصتنا؟</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">نوفر لك كل الأدوات التي تحتاجها للتفوق، في مكان واحد وبأحدث التقنيات التعليمية.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Zap className="text-blue-600" />, title: 'تعلم ذكي', desc: 'نظام يحلل أداءك ويركز على الأسئلة التي تخطئ فيها لضمان أسرع تقدم.' },
                { icon: <BookOpen className="text-blue-600" />, title: 'بنوك محدثة', desc: 'أحدث تسريبات وأسئلة السنوات السابقة مصنفة ومحلولة بدقة عالية.' },
                { icon: <ShieldCheck className="text-blue-600" />, title: 'متابعة دقيقة', desc: 'تقارير تفصيلية لمستواك تطلعك على نقاط القوة والضعف بشكل لحظي.' },
              ].map((feat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all group"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-600 text-white text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-4xl font-bold mb-6">هل أنت مستعد لتحقيق درجتك المستهدفة؟</h2>
            <p className="text-blue-100 text-lg mb la-10">انضم إلى آلاف الطلاب الذين حققوا أحلامهم التعليمية من خلال منصتنا.</p>
            <Link href="/register" className="bg-white text-blue-600 px la-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all inline-block shadow-xl">
              اشترك الآن وابدأ التفوق
            </Link>
          </div>
        </section>

        <footer className="py-12 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} مركز قدرات. جميع الحقوق محفوظة.
          </div>
        </footer>
      </MotionConfig>
    </div>
  );
}
