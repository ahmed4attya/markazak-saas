'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import {
  Users,
  GraduationCap,
  BookOpen,
  Wallet,
  ArrowUpLeft,
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

type Invoice = {
  id: string;
  number?: string;
  amount?: number | string;
  paid?: number | string;
  status?: string;
};

type Attendance = {
  id: string;
  status?: string;
};

export default function Dashboard() {
  const [d, setD] = useState<any>({
    students: 0,
    teachers: 0,
    courses: 0,
    groups: 0,
    revenue: 0,
    due: 0,
    attendance: 0,
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    setLoading(true);

    try {
      const [dashboardRes, invoicesRes, attendanceRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/invoices'),
        fetch('/api/attendance'),
      ]);

      const dashboardData = dashboardRes.ok
        ? await dashboardRes.json()
        : {};

      const invoiceData = invoicesRes.ok
        ? await invoicesRes.json()
        : [];

      const attendanceData = attendanceRes.ok
        ? await attendanceRes.json()
        : [];

      setD(dashboardData || {});
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setAttendanceRows(
        Array.isArray(attendanceData) ? attendanceData : []
      );
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalInvoices = invoices.reduce(
    (sum, x) => sum + Number(x.amount || 0),
    0
  );

  const totalCollected = invoices.reduce(
    (sum, x) => sum + Number(x.paid || 0),
    0
  );

  const totalRemaining = Math.max(
    0,
    totalInvoices - totalCollected
  );

  const paidInvoices = invoices.filter(
    x => x.status === 'paid'
  ).length;

  const partialInvoices = invoices.filter(
    x => x.status === 'partial'
  ).length;

  const unpaidInvoices = invoices.filter(
    x => x.status === 'unpaid'
  ).length;

  const present = attendanceRows.filter(
    x => x.status === 'present'
  ).length;

  const absent = attendanceRows.filter(
    x => x.status === 'absent'
  ).length;

  const late = attendanceRows.filter(
    x => x.status === 'late'
  ).length;

  const excused = attendanceRows.filter(
    x => x.status === 'excused'
  ).length;

  const totalAttendance = attendanceRows.length;

  const attendanceRate =
    totalAttendance > 0
      ? Math.round(((present + late) / totalAttendance) * 100)
      : Number(d.attendance || 0);

  const collectionRate =
    totalInvoices > 0
      ? Math.min(100, Math.round((totalCollected / totalInvoices) * 100))
      : 0;

  const students = Number(d.students || 0);
  const teachers = Number(d.teachers || 0);
  const courses = Number(d.courses || 0);
  const groups = Number(d.groups || 0);

  const cards = [
    ['الطلاب', students, Users, '/students'],
    ['المدربون', teachers, GraduationCap, '/teachers'],
    ['الدورات النشطة', courses, BookOpen, '/courses'],
    ['المجموعات', groups, CalendarDays, '/groups'],
  ];

  return (
    <Shell
      title="لوحة التحكم"
      subtitle="نظرة سريعة على أداء مركزك اليوم"
    >
      <div className="hero">
        <div>
          <span className="eyebrow">
            صباح الخير، مدير النظام
          </span>

          <h2>إليك ما يحدث في مركزك اليوم</h2>

          <p>
            تابع التشغيل والحضور والتحصيل من لوحة واحدة.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="ghost"
            onClick={loadDashboard}
            disabled={loading}
            title="تحديث البيانات"
          >
            <RefreshCw
              size={17}
              className={loading ? 'spin' : ''}
            />
            تحديث
          </button>

          <a href="/students" className="primary">
            <Plus size={18} />
            تسجيل طالب
          </a>
        </div>
      </div>

      <div className="statGrid">
        {cards.map(([name, value, Icon, href]: any) => (
          <a
            className="stat"
            href={href}
            key={name}
          >
            <div className="statIcon">
              <Icon size={20} />
            </div>

            <div>
              <span>{name}</span>
              <strong>
                {Number(value).toLocaleString('ar-SA')}
              </strong>
            </div>

            <ArrowUpLeft
              className="statArrow"
              size={17}
            />
          </a>
        ))}
      </div>

      <div className="dashboardGrid">

        {/* Finance */}
        <div className="panel">
          <div className="panelHead">
            <div>
              <h3>ملخص مالي</h3>
              <p>التحصيل والفواتير الفعلية</p>
            </div>

            <Wallet size={20} />
          </div>

          <div className="moneyRow">
            <div>
              <span>إجمالي الفواتير</span>
              <b>
                {totalInvoices.toLocaleString('ar-SA')} ر.س
              </b>
            </div>

            <div>
              <span>المحصل</span>
              <b>
                {totalCollected.toLocaleString('ar-SA')} ر.س
              </b>
            </div>

            <div>
              <span>المتبقي</span>
              <b>
                {totalRemaining.toLocaleString('ar-SA')} ر.س
              </b>
            </div>
          </div>

          <div className="progress">
            <i
              style={{
                width: `${collectionRate}%`,
              }}
            />
          </div>

          <div className="financeMiniStats">
            <span>
              <CheckCircle2 size={15} />
              {paidInvoices} مدفوعة
            </span>

            <span>
              <Clock3 size={15} />
              {partialInvoices} جزئية
            </span>

            <span>
              <XCircle size={15} />
              {unpaidInvoices} غير مدفوعة
            </span>
          </div>
        </div>

        {/* Attendance */}
        <div className="panel">
          <div className="panelHead">
            <div>
              <h3>الحضور</h3>
              <p>إحصاءات سجلات الحضور</p>
            </div>

            <CalendarDays size={20} />
          </div>

          <div className="attendanceBig">
            <strong>{attendanceRate}%</strong>
            <span>معدل الحضور</span>
          </div>

          <div className="progress">
            <i
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, attendanceRate)
                )}%`,
              }}
            />
          </div>

          <div className="attendanceMiniStats">
            <span>
              <CheckCircle2 size={15} />
              حاضر {present}
            </span>

            <span>
              <Clock3 size={15} />
              متأخر {late}
            </span>

            <span>
              <XCircle size={15} />
              غائب {absent}
            </span>

            <span>
              <AlertCircle size={15} />
              معذور {excused}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="panel wide">
          <div className="panelHead">
            <div>
              <h3>إجراءات سريعة</h3>
              <p>ابدأ العمل من هنا</p>
            </div>

            <TrendingUp size={20} />
          </div>

          <div className="quickGrid">
            <a href="/courses">
              <BookOpen />
              إنشاء دورة
            </a>

            <a href="/groups">
              <CalendarDays />
              فتح مجموعة
            </a>

            <a href="/attendance">
              <Users />
              تسجيل حضور
            </a>

            <a href="/finance">
              <Wallet />
              إصدار فاتورة
            </a>
          </div>
        </div>

        {/* Operational summary */}
        <div className="panel">
          <div className="panelHead">
            <div>
              <h3>حالة التشغيل</h3>
              <p>ملخص سريع للنظام</p>
            </div>

            <AlertCircle size={20} />
          </div>

          <div className="operationList">
            <div>
              <span>
                <Users size={16} />
                الطلاب
              </span>

              <b>
                {students.toLocaleString('ar-SA')}
              </b>
            </div>

            <div>
              <span>
                <GraduationCap size={16} />
                المدربون
              </span>

              <b>
                {teachers.toLocaleString('ar-SA')}
              </b>
            </div>

            <div>
              <span>
                <BookOpen size={16} />
                الدورات
              </span>

              <b>
                {courses.toLocaleString('ar-SA')}
              </b>
            </div>

            <div>
              <span>
                <Receipt size={16} />
                الفواتير
              </span>

              <b>
                {invoices.length.toLocaleString('ar-SA')}
              </b>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        .financeMiniStats,
        .attendanceMiniStats {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 16px;
          font-size: 13px;
        }

        .financeMiniStats span,
        .attendanceMiniStats span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .operationList {
          display: grid;
          gap: 10px;
          margin-top: 8px;
        }

        .operationList > div {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(127, 127, 127, 0.06);
        }

        .operationList span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .operationList b {
          font-size: 15px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Shell>
  );
}