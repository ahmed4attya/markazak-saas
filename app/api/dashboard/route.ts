import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';

function fillMonths(rows: Array<{ m: string; v: number }>): { months: string[]; values: number[] } {
  const months: string[] = [];
  const values: number[] = [];
  const map = new Map(rows.map((r) => [r.m, r.v]));
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    months.push(key);
    values.push(map.get(key) || 0);
  }
  return { months, values };
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const since = "date_trunc('month', current_date) - interval '11 months'";
  const [students, teachers, courses, groups, revenue, attendance, dues, attSeries, paySeries, stuSeries, tchSeries, crsSeries, grpSeries] = await Promise.all([
    query("select count(*)::int count from students where tenant_id=$1 and status='active'", [s.tenantId]),
    query("select count(*)::int count from teachers where tenant_id=$1 and status='active'", [s.tenantId]),
    query("select count(*)::int count from courses where tenant_id=$1 and status='active'", [s.tenantId]),
    query("select count(*)::int count from groups where tenant_id=$1 and status in ('scheduled','active')", [s.tenantId]),
    query('select coalesce(sum(amount),0)::numeric revenue from payments where tenant_id=$1', [s.tenantId]),
    query("select count(*) filter (where status='present')::int present, count(*)::int total from attendance where tenant_id=$1 and attendance_date=current_date", [s.tenantId]),
    query("select coalesce(sum(amount),0)::numeric due from invoices where tenant_id=$1 and status in ('unpaid','partial')", [s.tenantId]),
    query(`select to_char(date_trunc('month', attendance_date), 'YYYY-MM') as m, count(*)::int as v from attendance where tenant_id=$1 and attendance_date >= ${since} group by 1 order by 1`, [s.tenantId]),
    query(`select to_char(date_trunc('month', paid_at), 'YYYY-MM') as m, coalesce(sum(amount),0)::numeric as v from payments where tenant_id=$1 and paid_at >= ${since} group by 1 order by 1`, [s.tenantId]),
    query(`select to_char(date_trunc('month', created_at), 'YYYY-MM') as m, count(*)::int as v from students where tenant_id=$1 and created_at >= ${since} group by 1 order by 1`, [s.tenantId]),
    query(`select to_char(date_trunc('month', created_at), 'YYYY-MM') as m, count(*)::int as v from teachers where tenant_id=$1 and created_at >= ${since} group by 1 order by 1`, [s.tenantId]),
    query(`select to_char(date_trunc('month', created_at), 'YYYY-MM') as m, count(*)::int as v from courses where tenant_id=$1 and created_at >= ${since} group by 1 order by 1`, [s.tenantId]),
    query(`select to_char(date_trunc('month', created_at), 'YYYY-MM') as m, count(*)::int as v from groups where tenant_id=$1 and created_at >= ${since} group by 1 order by 1`, [s.tenantId]),
  ]);

  const att = fillMonths(attSeries.rows as any);
  const pay = fillMonths(paySeries.rows as any);
  const cum = (rows: Array<{ m: string; v: number }>) => {
    const { months, values } = fillMonths(rows);
    let acc = 0;
    return { months, values: values.map((v) => (acc += v)) };
  };

  return NextResponse.json({
    students: students.rows[0].count,
    teachers: teachers.rows[0].count,
    courses: courses.rows[0].count,
    groups: groups.rows[0].count,
    revenue: Number(revenue.rows[0].revenue),
    due: Number(dues.rows[0].due),
    attendance: attendance.rows[0].total ? Math.round((attendance.rows[0].present / attendance.rows[0].total) * 100) : 0,
    series: {
      months: att.months,
      attendance: att.values,
      revenue: pay.values,
      students: cum(stuSeries.rows as any).values,
      teachers: cum(tchSeries.rows as any).values,
      courses: cum(crsSeries.rows as any).values,
      groups: cum(grpSeries.rows as any).values,
    },
  });
}
