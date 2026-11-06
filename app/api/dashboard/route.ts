import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { teacherCourseIds, teacherGroupIds } from '@/lib/access';

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

  // Dedicated Teacher Dashboard (Requirement 4)
  if (s.role === 'teacher') {
    const courseIds = await teacherCourseIds(s.userId, s.tenantId);
    const groupIds = await teacherGroupIds(s.userId, s.tenantId);

    const [enrolledStudents, attendanceRate, pendingGrading, examsCount, upcomingGroups] = await Promise.all([
      // Distinct active students in teacher's groups
      groupIds.length > 0
        ? query(
            `select count(distinct student_id)::int as count from enrollments where tenant_id=$1 and group_id = any($2) and status='active'`,
            [s.tenantId, groupIds]
          )
        : { rows: [{ count: 0 }] },

      // Teacher's groups attendance rate (all time or recent)
      groupIds.length > 0
        ? query(
            `select count(*) filter (where status='present')::int as present, count(*)::int as total
             from attendance where tenant_id=$1 and group_id = any($2)`,
            [s.tenantId, groupIds]
          )
        : { rows: [{ present: 0, total: 0 }] },

      // Pending grading submissions for teacher's courses
      courseIds.length > 0
        ? query(
            `select count(*)::int as count from submissions s
             join assignments a on a.id = s.assignment_id
             where a.tenant_id=$1 and a.course_id = any($2) and s.submitted_at is not null and s.graded_at is null`,
            [s.tenantId, courseIds]
          )
        : { rows: [{ count: 0 }] },

      // Exams in teacher's courses
      courseIds.length > 0
        ? query(
            `select count(*)::int as count from exams where tenant_id=$1 and course_id = any($2)`,
            [s.tenantId, courseIds]
          )
        : { rows: [{ count: 0 }] },

      // Groups schedule/upcoming
      groupIds.length > 0
        ? query(
            `select g.id, g.name, g.days, g.start_time, g.end_time, g.room, g.status, c.name as course_name,
                    (select count(*)::int from enrollments e where e.group_id=g.id and e.status='active') as student_count
             from groups g
             left join courses c on c.id = g.course_id
             where g.tenant_id=$1 and g.id = any($2)
             order by g.status asc, g.created_at desc limit 10`,
            [s.tenantId, groupIds]
          )
        : { rows: [] }
    ]);

    const attTotal = attendanceRate.rows[0]?.total || 0;
    const attPresent = attendanceRate.rows[0]?.present || 0;

    return NextResponse.json({
      isTeacher: true,
      teacherKPIs: {
        assignedCourses: courseIds.length,
        assignedGroups: groupIds.length,
        enrolledStudents: enrolledStudents.rows[0]?.count || 0,
        attendanceRate: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 0,
        pendingGrading: pendingGrading.rows[0]?.count || 0,
        examsCount: examsCount.rows[0]?.count || 0,
      },
      upcomingGroups: upcomingGroups.rows,
    });
  }

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
