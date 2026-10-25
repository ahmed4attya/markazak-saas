"use client";

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import {
  Users,
  GraduationCap,
  BookOpen,
  Wallet,
  ArrowUpRight,
  CalendarDays,
  Plus,
  TrendingUp,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Clock3,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
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
  const points = (data && data.length > 0 ? data : [0, 0, 0, 0, 0]).map((v, i) => ({ i, v }));
  return (
    <div className="w-24 h-10" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points}>
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#grad-${color.replace('#', '')})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={"animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/60 " + (className || "")} />;
}

function monthLabel(key: string): string {
  if (!key || !key.includes('-')) return key || '';
  const [y, m] = key.split('-');
  const names = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return names[Number(m) - 1] + ' ' + String(y).slice(2);
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
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
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((data) => { if (data?.name) setAdminName(data.name); }).catch(() => {});
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
  const greeting = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  const who = adminName || 'مدير المركز';

  const cards = [
    { name: 'إجمالي الطلاب', value: students, Icon: Users, href: '/students', color: 'bg-blue-600', ring: 'ring-blue-500/20', spark: series.students || [], sparkColor: '#3b82f6', subtitle: 'طالب مسجل بالمنصة' },
    { name: 'المدربون والمعلمون', value: teachers, Icon: GraduationCap, href: '/teachers', color: 'bg-emerald-600', ring: 'ring-emerald-500/20', spark: series.teachers || [], sparkColor: '#10b981', subtitle: 'مدرب نشط بالمركز' },
    { name: 'الدورات التدريبية', value: courses, Icon: BookOpen, href: '/courses', color: 'bg-amber-600', ring: 'ring-amber-500/20', spark: series.courses || [], sparkColor: '#f59e0b', subtitle: 'برنامج ومساق تدريبي' },
    { name: 'المجموعات والشُعب', value: groups, Icon: CalendarDays, href: '/groups', color: 'bg-indigo-600', ring: 'ring-indigo-500/20', spark: series.groups || [], sparkColor: '#6366f1', subtitle: 'شعبة دراسية قيد التشغيل' },
  ];

  return (
    <Shell
      title="لوحة التحكم"
      subtitle="نظرة تشغيلية متكاملة على أداء المركز والطلاب والتحصيل المالي لحظة بلحظة"
    >
      <div className="flex flex-col gap-6" dir="rtl">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold">
                <span>{greeting}، {who} 👋</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/80 font-normal">النظام يعمل بكفاءة</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                لوحة القيادة التشغيلية للمركز
              </h2>
              <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                راقب مؤشرات الطلاب والحضور وسير الفصول وتحصيل الاشتراكات من مركز عمليات موحد وسريع.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all disabled:opacity-50 cursor-pointer backdrop-blur-sm"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>تحديث البيانات</span>
              </button>

              <Link
                href="/questions/import"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-2xl transition-all shadow-lg shadow-amber-400/20"
              >
                <FileSpreadsheet size={15} />
                <span>استيراد أسئلة (PDF/نماذج)</span>
              </Link>

              <Link
                href="/students"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-2xl transition-all shadow-lg shadow-emerald-600/20"
              >
                <Plus size={15} />
                <span>تسجيل طالب جديد</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-2 w-28" />
                  </div>
                  <Skeleton className="w-24 h-10" />
                </div>
              ))
            : cards.map(({ name, value, Icon, href, color, ring, spark, sparkColor, subtitle }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{name}</p>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {Number(value).toLocaleString('ar-SA')}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>
                    </div>
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ring-4 transition-transform group-hover:scale-105', color, ring)}>
                      <Icon size={22} />
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <Spark data={spark} color={sparkColor} />
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-amber-500 transition-colors">
                      <span>عرض القائمة</span>
                      <ArrowUpRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
        </div>

        {/* Charts & Analytical Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Attendance Chart */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">حركة الحضور والغياب</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">معدل الحضور على مدار الأشهر</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarDays size={18} />
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="m" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                        direction: 'rtl',
                      }}
                    />
                    <Area type="monotone" dataKey="v" name="سجلات الحضور" stroke="#10b981" strokeWidth={2.5} fill="url(#attGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Revenue Chart */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">الإيرادات المحصلة</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">المحصل الشهري الفعلي</p>
                  {revDelta !== null && (
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', revDelta >= 0 ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' : 'text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300')}>
                      {revDelta >= 0 ? '▲' : '▼'} {Math.abs(revDelta)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <TrendingUp size={18} />
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                    <XAxis dataKey="m" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '12px',
                        direction: 'rtl',
                      }}
                    />
                    <Bar dataKey="v" name="ر.س" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Invoices Donut Chart */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">حالة الفواتير</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">توزيع سداد المستحقات</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Wallet size={18} />
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-52 w-full" />
            ) : pieData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-sm text-slate-400">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <span>لا توجد فواتير مسجلة بعد</span>
              </div>
            ) : (
              <div className="h-52 w-full flex flex-col items-center justify-center">
                <div className="w-full h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={4}>
                        {pieData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center text-xs mt-2">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    مدفوعة ({paidInvoices})
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    جزئية ({partialInvoices})
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    غير مدفوعة ({unpaidInvoices})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Operational Modules & Today's Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Breakdown Card */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">التقرير المالي التنفيذي</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي العقود والمبالغ المستحقة والتحصيل</p>
              </div>
              <Link
                href="/finance"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>إدارة الفواتير والاشتراكات</span>
                <ChevronLeft size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">إجمالي الفواتير</span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {totalInvoices.toLocaleString('ar-SA')}{' '}
                  <span className="text-xs font-normal text-slate-400">ر.س</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-emerald-700 dark:text-emerald-300 text-xs font-medium">المبالغ المحصلة</span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  {totalCollected.toLocaleString('ar-SA')}{' '}
                  <span className="text-xs font-normal text-emerald-500">ر.س</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
                <span className="text-red-700 dark:text-red-300 text-xs font-medium">المتبقي والمتأخرات</span>
                <div className="text-xl font-black text-red-700 dark:text-red-300 mt-1">
                  {totalRemaining.toLocaleString('ar-SA')}{' '}
                  <span className="text-xs font-normal text-red-500">ر.س</span>
                </div>
              </div>
            </div>

            {/* Collection Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">نسبة التحصيل الفعلي</span>
                <span className="text-blue-600 dark:text-blue-400">{collectionRate}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${collectionRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-l from-blue-500 to-indigo-600 rounded-full"
                />
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">إجراءات سريعة للمركز:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link
                  href="/courses"
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-amber-400 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <BookOpen size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إضافة دورة</span>
                </Link>

                <Link
                  href="/groups"
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-indigo-400 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Layers size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">فتح مجموعة</span>
                </Link>

                <Link
                  href="/attendance"
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-blue-400 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Users size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">تسجيل حضور</span>
                </Link>

                <Link
                  href="/finance"
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:border-emerald-400 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Receipt size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إصدار فاتورة</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Today's Attendance Gauge */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">حضور اليوم</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {todayRows.length > 0 ? 'إحصائيات اليوم المباشرة' : 'سجلات الحضور العامة'}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CalendarDays size={18} />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-2 text-center">
              <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-slate-100 dark:text-slate-800"
                  />
                  <motion.circle
                    cx="72"
                    cy="72"
                    r="62"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={389.5}
                    initial={{ strokeDashoffset: 389.5 }}
                    animate={{ strokeDashoffset: 389.5 - (389.5 * attendanceRate) / 100 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="text-emerald-500 transition-all"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{attendanceRate}%</span>
                  <span className="text-[11px] text-slate-400 font-semibold">معدل الالتزام</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 w-full">
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 size={14} />
                  <span>حاضر ({present})</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold">
                  <Clock3 size={14} />
                  <span>متأخر ({late})</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold">
                  <XCircle size={14} />
                  <span>غائب ({absent})</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  <AlertCircle size={14} />
                  <span>معذور ({excused})</span>
                </div>
              </div>
            </div>

            <Link
              href="/attendance"
              className="w-full py-2.5 text-center text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              عرض سجل الحضور اليومي الكامل
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
