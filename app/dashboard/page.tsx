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
  FileCheck,
  ClipboardList,
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
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  async function loadDashboard() {
    setLoading(true);
    try {
      const [dashboardRes, meRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/me'),
      ]);
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : {};
      const meData = meRes.ok ? await meRes.json() : null;
      if (meData?.name) setUserName(meData.name);
      if (meData?.role) setUserRole(meData.role);

      setD(dashboardData || {});

      // Only fetch invoices & attendance if not teacher
      if (meData?.role !== 'teacher') {
        const [invoicesRes, attendanceRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/attendance'),
        ]);
        const invoiceData = invoicesRes.ok ? await invoicesRes.json() : [];
        const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
        setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
        setAttendanceRows(Array.isArray(attendanceData) ? attendanceData : []);
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  const isTeacher = userRole === 'teacher' || d.isTeacher;

  // TEACHER DASHBOARD VIEW (Requirement 4)
  if (isTeacher) {
    const kpis = d.teacherKPIs || {
      assignedCourses: 0,
      assignedGroups: 0,
      enrolledStudents: 0,
      attendanceRate: 0,
      pendingGrading: 0,
      examsCount: 0,
    };
    const upcomingGroups = d.upcomingGroups || [];

    const teacherCards = [
      { name: 'دوراتي التدريبية', value: kpis.assignedCourses, Icon: BookOpen, href: '/courses', color: 'bg-indigo-600', subtitle: 'الدورات المسندة إليك' },
      { name: 'مجموعاتي النشطة', value: kpis.assignedGroups, Icon: Layers, href: '/groups', color: 'bg-emerald-600', subtitle: 'مجموعات قيد التدريب' },
      { name: 'إجمالي طلابي', value: kpis.enrolledStudents, Icon: Users, href: '/students', color: 'bg-blue-600', subtitle: 'طالب في مجموعاتك' },
      { name: 'واجبات بانتظار التصحيح', value: kpis.pendingGrading, Icon: FileCheck, href: '/assignments', color: 'bg-amber-600', subtitle: 'تسليمات بحاجة لتقييم' },
    ];

    return (
      <Shell title="لوحة المعلم" subtitle="المتابعة الأكاديمية لدوراتك ومجموعاتك وطلابك">
        <div className="space-y-8">
          {/* Hero Welcome Card for Teacher */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  حساب المعلم الأكاديمي
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {greeting}، يا {userName || 'أستاذنا'} 🎓
                </h2>
                <p className="text-sm text-slate-300 max-w-xl">
                  مرحباً بك في بوابتك التعليمية. يمكنك متابعة مجموعاتك التدريبية، وتسجيل الحضور والغياب، وتصحيح الواجبات والاختبارات ومتابعة درجات طلابك.
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
                  <span>تحديث</span>
                </button>

                <Link
                  href="/attendance"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-2xl transition-all shadow-lg shadow-emerald-400/20"
                >
                  <CalendarDays size={15} />
                  <span>تسجيل الحضور</span>
                </Link>

                <Link
                  href="/assignments"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                >
                  <Plus size={15} />
                  <span>واجب جديد</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Teacher KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teacherCards.map(({ name, value, Icon, href, color, subtitle }, i) => (
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
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105', color)}>
                    <Icon size={22} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Schedule & Attendance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assigned Groups Schedule */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">جدول مجموعاتك التدريبية</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">المجموعات المسندة إليك ومواعيد المحاضرات والقاعات</p>
                </div>
                <Link
                  href="/groups"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1"
                >
                  <span>عرض الكل</span>
                  <ChevronLeft size={14} />
                </Link>
              </div>

              {upcomingGroups.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  لا توجد مجموعات مسندة إليك حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingGroups.map((g: any) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <Layers size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{g.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {g.course_name || 'بدون دورة'} • {g.days || 'غير محدد الأيام'}
                            {g.start_time ? ` (${g.start_time.slice(0, 5)})` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-left">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {g.student_count || 0} طالب
                        </span>
                        <Link
                          href={`/attendance?groupId=${g.id}`}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all"
                        >
                          تحضير
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance Rate Gauge for Teacher */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">نسبة حضور طلابك</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">معدل التزام الطلاب في مجموعاتك</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CalendarDays size={18} />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-4 text-center">
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
                      animate={{ strokeDashoffset: 389.5 - (389.5 * kpis.attendanceRate) / 100 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="text-emerald-500 transition-all"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{kpis.attendanceRate}%</span>
                    <span className="text-[11px] text-slate-400 font-semibold">معدل الحضور</span>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <Link
                    href="/attendance"
                    className="block w-full py-2.5 text-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    فتح سجل الحضور والغياب
                  </Link>
                  <Link
                    href="/gradebook"
                    className="block w-full py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                  >
                    سجل الدرجات والتقييمات
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ADMIN DASHBOARD VIEW (Existing comprehensive view)
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

  const cards = [
    { name: 'إجمالي الطلاب', value: students, Icon: Users, href: '/students', color: 'bg-blue-600', ring: 'ring-blue-500/20', spark: series.students || [], sparkColor: '#3b82f6', subtitle: 'طالب مسجل بالمنصة' },
    { name: 'المدربون والمعلمون', value: teachers, Icon: GraduationCap, href: '/teachers', color: 'bg-emerald-600', ring: 'ring-emerald-500/20', spark: series.teachers || [], sparkColor: '#10b981', subtitle: 'مدرب نشط بالمركز' },
    { name: 'الدورات والبرامج', value: courses, Icon: BookOpen, href: '/courses', color: 'bg-indigo-600', ring: 'ring-indigo-500/20', spark: series.courses || [], sparkColor: '#6366f1', subtitle: 'برنامج تدريبي متاح' },
    { name: 'المجموعات النشطة', value: groups, Icon: Layers, href: '/groups', color: 'bg-purple-600', ring: 'ring-purple-500/20', spark: series.groups || [], sparkColor: '#a855f7', subtitle: 'شعبة وقاعة تدريب' },
  ];

  return (
    <Shell title="لوحة التحكم" subtitle="نظرة استراتيجية شاملة على أداء المركز والعمليات الأكاديمية والمالية">
      <div className="space-y-8">
        {/* Hero Welcome Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                المنظومة السحابية متصلة ومستقرة
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {greeting}، يا {userName || 'مدير المركز'} 👋
              </h2>
              <p className="text-sm text-slate-300 max-w-xl">
                إليك ملخص أداء المركز التدريبي اليوم، والتدفقات المالية ونسب التحصيل وحضور الطلاب عبر كافة البرامج والمجموعات.
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
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 group-hover:underline">
                      إدارة السجلات <ChevronLeft size={13} />
                    </span>
                    <Spark data={spark} color={sparkColor} />
                  </div>
                </Link>
              ))}
        </div>

        {/* Financial Overview 2-Card Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">إجمالي الإيرادات المحصلة</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">كافة المدفوعات المسجلة</p>
                </div>
              </div>
              {revDelta !== null && (
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', revDelta >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700')}>
                  {revDelta >= 0 ? `+${revDelta}% عن الشهر السابق` : `${revDelta}%`}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {Number(d.revenue || totalCollected).toLocaleString('ar-SA')}
              </span>
              <span className="text-sm font-bold text-slate-500">ر.س</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>نسبة التحصيل من الفواتير الصادرة:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{collectionRate}%</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Receipt size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">المستحقات غير المحصلة</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">متبقي على فواتير الطلاب</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {unpaidInvoices + partialInvoices} فواتير معلقة
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
                {Number(d.due || totalRemaining).toLocaleString('ar-SA')}
              </span>
              <span className="text-sm font-bold text-slate-500">ر.س</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <Link href="/finance" className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1">
                متابعة الفواتير والتحصيل <ChevronLeft size={13} />
              </Link>
              <span>{paidInvoices} فواتير مدفوعة بالكامل</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">حركة الإيرادات والتحصيل (١٢ شهراً)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">معدل التدفق المالي الشهري المسجل بالريال السعودي</p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="w-3 h-3 rounded-md bg-blue-600" />
                <span>الإيرادات الشهرية</span>
              </div>
            </div>

            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('ar-SA')} ر.س`, 'الإيراد']}
                  />
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Invoice Status Pie Chart */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">توزيع حالة الفواتير</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">حالة السداد لكافة الفواتير الصادرة</p>
            </div>

            <div className="h-56 w-full my-auto flex items-center justify-center">
              {pieData.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد فواتير كافية للعرض</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  مدفوعة بالكامل
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{paidInvoices}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  مدفوعة جزئياً
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{partialInvoices}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  غير مدفوعة
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{unpaidInvoices}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational 2-Column: Quick Shortcuts + Today's Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions Shortcuts */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">العمليات السريعة والمهام اليومية</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">إجراءات سريعة لتسريع إدارة المركز دون الحاجة للتنقل الطويل</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/students"
                className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-100 dark:border-slate-700/50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">الطلاب</span>
                <span className="text-[10px] text-slate-400">إدارة وتسجيل</span>
              </Link>

              <Link
                href="/attendance"
                className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-100 dark:border-slate-700/50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CalendarDays size={20} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">حضور اليوم</span>
                <span className="text-[10px] text-slate-400">تحضير فوري</span>
              </Link>

              <Link
                href="/questions/import"
                className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-100 dark:border-slate-700/50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">استيراد بنك</span>
                <span className="text-[10px] text-slate-400">PDF ونماذج</span>
              </Link>

              <Link
                href="/finance"
                className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-100 dark:border-slate-700/50 transition-all text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Receipt size={20} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">سند قبض</span>
                <span className="text-[10px] text-slate-400">تسجيل مدفوعات</span>
              </Link>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">إجراءات سريعة بنقرة واحدة</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <Link
                  href="/students"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                >
                  <Plus size={14} className="text-blue-600" />
                  <span>طالب جديد</span>
                </Link>
                <Link
                  href="/courses"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                >
                  <Plus size={14} className="text-indigo-600" />
                  <span>دورة تدريبية</span>
                </Link>
                <Link
                  href="/groups"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-500 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors"
                >
                  <Plus size={14} className="text-purple-600" />
                  <span>شعبة / مجموعة</span>
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
