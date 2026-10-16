"use client";

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import {
  Users,
  GraduationCap,
  BookOpen,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  Plus,
  TrendingUp,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Clock3,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import Link from 'next/link';

type Invoice = {
  id: string;
  number?: string;
  amount?: number | string;
  paid?: number | string;
  status?: string;
};

type Attendance = {
  attendance_date?: string;
  id: string;
  status?: string;
};

type Series = { months: string[]; attendance: number[]; revenue: number[]; students: number[]; teachers: number[]; courses: number[]; groups: number[] };

function Spark({ data, color }: { data: number[]; color: string }) {
  const points = (data || []).map((v, i) => ({ i, v }));
  return (
    <div className="w-24 h-10" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={"animate-pulse rounded-xl bg-slate-200/70 " + (className || "")} />;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const names = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];
  return names[Number(m) - 1] + ' ' + String(y).slice(2);
}

export default function Dashboard() {
  const [d, setD] = useState<any>({
    students: 0, teachers: 0, courses: 0, groups: 0, revenue: 0, due: 0, attendance: 0,
    series: { months: [], attendance: [], revenue: [], students: [], teachers: [], courses: [], groups: [] },
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');

  async function loadDashboard() {
    setLoading(true);
    try {
      const [dashboardRes, invoicesRes, attendanceRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/invoices'),
        fetch('/api/attendance'),
      ]);
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : {};
      const invoiceData = invoicesRes.ok ? await invoicesRes.json() : [];
      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
      setD(dashboardData || {});
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setAttendanceRows(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.name) setAdminName(d.name); }).catch(() => {});
  }, []);

  const totalInvoices = invoices.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  const totalCollected = invoices.reduce((sum, x) => sum + Number(x.paid || 0), 0);
  const totalRemaining = Math.max(0, totalInvoices - totalCollected);
  const paidInvoices = invoices.filter(x => x.status === 'paid').length;
  const partialInvoices = invoices.filter(x => x.status === 'partial').length;
  const unpaidInvoices = invoices.filter(x => x.status === 'unpaid').length;
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayRows = attendanceRows.filter(x => String(x.attendance_date || '').startsWith(todayIso));
  const attSrc = todayRows.length > 0 ? todayRows : attendanceRows;
  const present = attSrc.filter(x => x.status === 'present').length;
  const absent = attSrc.filter(x => x.status === 'absent').length;
  const late = attSrc.filter(x => x.status === 'late').length;
  const excused = attSrc.filter(x => x.status === 'excused').length;
  const totalAttendance = attSrc.length;
  const attendanceRate = totalAttendance > 0 ? Math.round(((present + late) / totalAttendance) * 100) : Number(d.attendance || 0);
  const collectionRate = totalInvoices > 0 ? Math.min(100, Math.round((totalCollected / totalInvoices) * 100)) : 0;
  const students = Number(d.students || 0);
  const teachers = Number(d.teachers || 0);
  const courses = Number(d.courses || 0);
  const groups = Number(d.groups || 0);

  const series: Series = d.series || { months: [], attendance: [], revenue: [], students: [], teachers: [], courses: [], groups: [] };
  const chartMonths = (series.months || []).map(monthLabel);
  const attData = chartMonths.map((m, i) => ({ m, v: series.attendance?.[i] || 0 }));
  const revData = chartMonths.map((m, i) => ({ m, v: series.revenue?.[i] || 0 }));
  const pieData = [
    { name: 'مدفوعة', value: paidInvoices, fill: '#10b981' },
    { name: 'جزئية', value: partialInvoices, fill: '#f59e0b' },
    { name: 'غير مدفوعة', value: unpaidInvoices, fill: '#ef4444' },
  ].filter((x) => x.value > 0);

  const revThis = series.revenue?.[series.revenue.length - 1] || 0;
  const revPrev = series.revenue?.[series.revenue.length - 2] || 0;
  const revDelta = revPrev > 0 ? Math.round(((revThis - revPrev) / revPrev) * 100) : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء الخير';
  const who = adminName || 'مدير النظام';

  const cards = [
    { name: 'الطلاب', value: students, Icon: Users, href: '/students', color: 'bg-blue-500', accent: 'border-[color:var(--blue-border)] bg-[color:var(--blue-soft)]', spark: series.students || [], sparkColor: '#5b9bff' },
    { name: 'المدربون', value: teachers, Icon: GraduationCap, href: '/teachers', color: 'bg-emerald-500', accent: 'border-[color:var(--success-border)] bg-[color:var(--success-soft)]', spark: series.teachers || [], sparkColor: '#10b981' },
    { name: 'الدورات النشطة', value: courses, Icon: BookOpen, href: '/courses', color: 'bg-amber-500', accent: 'border-[color:var(--warning-border)] bg-[color:var(--warning-soft)]', spark: series.courses || [], sparkColor: '#f59e0b' },
    { name: 'المجموعات', value: groups, Icon: CalendarDays, href: '/groups', color: 'bg-indigo-500', accent: 'border-[color:var(--indigo-border)] bg-[color:var(--indigo-soft)]', spark: series.groups || [], sparkColor: '#818cf8' },
  ];

  return (
    <Shell
      title="لوحة التحكم"
      subtitle="نظرة سريعة على أداء مركزك اليوم"
    >
      <div className="flex flex-col gap-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
          <div>
            <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">{greeting}، {who} 👋</span>
            <h2 className="text-2xl font-bold text-slate-800 mt-1">إليك ما يحدث في مركزك اليوم</h2>
            <p className="text-slate-500 text-sm mt-1">تابع التشغيل والحضور والتحصيل من لوحة واحدة وبكل سهولة.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              تحديث
            </button>
            {totalRemaining > 0 && (
              <Link href="/finance" className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl transition-all hover:bg-red-100">
                <AlertCircle size={16} /> متأخرات: {totalRemaining.toLocaleString('ar-SA')} ر.س
              </Link>
            )}
            <Link href="/students" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0b0f17] bg-[image:var(--gold-cta)] hover:opacity-90 rounded-xl transition-all shadow-[0_8px_20px_rgba(245,158,11,0.3)]">
              <Plus size={16} />
              تسجيل طالب
            </Link>
          </div>
        </div>

        {/* Stats Grid (Bento + Sparklines) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bento-card p-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="w-24 h-10" />
                </div>
              ))
            : cards.map(({ name, value, Icon, href, color, accent, spark, sparkColor }, i) => (
                <Link
                  key={i}
                  href={href}
                  className={cn('bento-card group flex items-center justify-between', accent)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-110', color)}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium">{name}</p>
                      <h3 className="text-2xl font-bold text-slate-800">{Number(value).toLocaleString('ar-SA')}</h3>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Spark data={spark} color={sparkColor} />
                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
        </div>

        {/* Charts Row (Recharts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">الحضور الشهري</h3>
              <CalendarDays size={18} className="text-emerald-500" />
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={attData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="m" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <Tooltip />
                  <Line type="monotone" dataKey="v" name="سجلات الحضور" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">توزيع التحصيل</h3>
              <Wallet size={18} className="text-blue-500" />
            </div>
            {loading ? <Skeleton className="h-48" /> : pieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400">لا فواتير بعد</div>
            ) : (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={4}>
                    {pieData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-3 justify-center text-xs mt-2">
              <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> مدفوعة {paidInvoices}</span>
              <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> جزئية {partialInvoices}</span>
              <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> غير مدفوعة {unpaidInvoices}</span>
            </div>
          </div>

          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">الإيراد الشهري</h3>
              {revDelta !== null && (
                <span className={'text-xs font-bold px-2 py-0.5 rounded-full ' + (revDelta >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50')}>
                  {revDelta >= 0 ? '▲' : '▼'} {Math.abs(revDelta)}% عن الشهر الماضي
                </span>
              )}
            </div>
            {loading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={revData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                  <XAxis dataKey="m" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={34} />
                  <Tooltip />
                  <Bar dataKey="v" name="ر.س" fill="#fbbf24" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Finance Panel - Large Bento */}
          <div className="lg:col-span-2 bento-card lg:order-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">ملخص مالي</h3>
                <p className="text-slate-500 text-xs">التحصيل والفواتير الفعلية</p>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Wallet size={20} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 text-xs font-medium">إجمالي الفواتير</span>
                <div className="text-xl font-bold text-slate-800 mt-1">{totalInvoices.toLocaleString('ar-SA')} <span className="text-xs font-normal text-slate-400">ر.س</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-emerald-600 text-xs font-medium">المحصل</span>
                <div className="text-xl font-bold text-emerald-700 mt-1">{totalCollected.toLocaleString('ar-SA')} <span className="text-xs font-normal text-emerald-400">ر.س</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                <span className="text-red-600 text-xs font-medium">المتبقي</span>
                <div className="text-xl font-bold text-red-700 mt-1">{totalRemaining.toLocaleString('ar-SA')} <span className="text-xs font-normal text-red-400">ر.س</span></div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">نسبة التحصيل</span>
                <span className="text-blue-600">{collectionRate}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${collectionRate}%` }}
                  className="h-full bg-blue-600 rounded-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <CheckCircle2 size={14} className="text-emerald-500" />
                {paidInvoices} مدفوعة
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <Clock3 size={14} className="text-amber-500" />
                {partialInvoices} جزئية
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                <XCircle size={14} className="text-red-500" />
                {unpaidInvoices} غير مدفوعة
              </div>
            </div>
          </div>

          {/* Attendance Panel - Bento */}
          <div className="bento-card flex flex-col lg:order-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">حضور اليوم</h3>
                <p className="text-slate-500 text-xs">{todayRows.length > 0 ? 'سجلات اليوم' : 'لا سجلات اليوم - كل الفترات'}</p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CalendarDays size={20} />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <motion.circle
                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={364.4}
                    initial={{ strokeDashoffset: 364.4 }}
                    animate={{ strokeDashoffset: 364.4 - (364.4 * attendanceRate) / 100 }}
                    className="text-emerald-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-800">{attendanceRate}%</span>
                  <span className="text-[10px] text-slate-400 font-medium">معدل الحضور</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full mt-4">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 size={14} /> حاضر {present}
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-medium">
                  <Clock3 size={14} /> متأخر {late}
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
                  <XCircle size={14} /> غائب {absent}
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium">
                  <AlertCircle size={14} /> معذور {excused}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Wide Bento */}
          <div className="lg:col-span-2 bento-card lg:order-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">إجراءات سريعة</h3>
                <p className="text-slate-500 text-xs">ابدأ العمل من هنا</p>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/courses" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">إنشاء دورة</span>
              </Link>
              <Link href="/groups" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CalendarDays size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">فتح مجموعة</span>
              </Link>
              <Link href="/attendance" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">تسجيل حضور</span>
              </Link>
              <Link href="/finance" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Wallet size={20} />
                </div>
                <span className="text-xs font-bold text-slate-700">إصدار فاتورة</span>
              </Link>
            </div>
          </div>

          {/* Operational Summary - Bento */}
          <div className="bento-card lg:order-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">حالة التشغيل</h3>
                <p className="text-slate-500 text-xs">ملخص سريع للنظام</p>
              </div>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { name: 'الطلاب', value: students, icon: Users, color: 'text-blue-600' },
                { name: 'المدربون', value: teachers, icon: GraduationCap, color: 'text-emerald-600' },
                { name: 'الدورات', value: courses, icon: BookOpen, color: 'text-amber-600' },
                { name: 'الفواتير', value: invoices.length, icon: Receipt, color: 'text-rose-600' },
              ].map((item, i) => {
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-100">
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className={item.color} />
                      <span className="text-xs font-medium text-slate-600">{item.name}</span>
                    </div>
                    <b className="text-sm font-bold text-slate-800">{item.value.toLocaleString('ar-SA')}</b>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </Shell>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
