import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { teacherCourseIds } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';

// Gradebook aggregates. ?groupId= -> per-student summary; ?studentId= -> full detail.
export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const groupId = (searchParams.get('groupId') || '').trim();
  const studentId = (searchParams.get('studentId') || '').trim();

  if (groupId) {
    const g = (await query('select id, course_id, name from groups where id=$1 and tenant_id=$2', [groupId, s.tenantId])).rows[0] as any;
    if (!g) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 404 });
    if (s.role === 'teacher' && !(await teacherCourseIds(s.userId, s.tenantId)).includes(String(g.course_id))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }
    const students = (await query(
      `select st.id, st.name from enrollments en join students st on st.id = en.student_id
       where en.group_id = $1 and en.tenant_id = $2 and en.status = 'active' and st.status = 'active'
       order by st.name`,
      [groupId, s.tenantId]
    )).rows as Array<{ id: string; name: string }>;

    const rows = await Promise.all(students.map(async (st) => {
      const ex = (await query(
        `select avg(case when a.total > 0 then (a.score::numeric / a.total) * 100 else null end)::numeric as pct,
                count(*)::int as n
         from attempts a join exams e on e.id = a.exam_id
         where a.user_id = (select user_id from students where id = $1) and e.course_id = $2 and a.finished_at is not null`,
        [st.id, g.course_id]
      )).rows[0] as any;
      const hw = (await query(
        `select avg((sub.score::numeric / a.max_score) * 100)::numeric as pct, count(*)::int as n
         from submissions sub join assignments a on a.id = sub.assignment_id
         where sub.student_id = $1 and a.course_id = $2 and sub.graded_at is not null`,
        [st.id, g.course_id]
      )).rows[0] as any;
      const examPct = ex?.pct === null || ex?.pct === undefined ? null : Math.round(Number(ex.pct));
      const hwPct = hw?.pct === null || hw?.pct === undefined ? null : Math.round(Number(hw.pct));
      const parts = [examPct, hwPct].filter((x) => x !== null) as number[];
      const overall = parts.length ? Math.round(parts.reduce((a2, b2) => a2 + b2, 0) / parts.length) : null;
      return {
        studentId: st.id,
        name: st.name,
        exams: ex?.n || 0,
        examAvg: examPct,
        assignments: hw?.n || 0,
        hwAvg: hwPct,
        overall,
      };
    }));
    return NextResponse.json({ group: { id: g.id, name: g.name }, rows });
  }

  if (studentId) {
    const st = (await query('select id, name, user_id from students where id=$1 and tenant_id=$2', [studentId, s.tenantId])).rows[0] as any;
    if (!st) return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
    const examList = (await query(
      `select e.title, a.score, a.total, a.finished_at,
              case when a.total > 0 then round((a.score::numeric / a.total) * 100) else null end as pct
       from attempts a join exams e on e.id = a.exam_id
       where a.user_id = $1 and a.finished_at is not null and a.tenant_id = $2
       order by a.finished_at desc limit 100`,
      [st.user_id, s.tenantId]
    )).rows;
    const hwList = (await query(
      `select a.title, sub.score, a.max_score, sub.graded_at, sub.feedback,
              case when a.max_score > 0 then round((sub.score::numeric / a.max_score) * 100) else null end as pct
       from submissions sub join assignments a on a.id = sub.assignment_id
       where sub.student_id = $1 and sub.graded_at is not null and sub.tenant_id = $2
       order by sub.graded_at desc limit 100`,
      [st.id, s.tenantId]
    )).rows;
    return NextResponse.json({ student: { id: st.id, name: st.name }, exams: examList, assignments: hwList });
  }

  return NextResponse.json({ error: 'حدد groupId أو studentId' }, { status: 400 });
}
