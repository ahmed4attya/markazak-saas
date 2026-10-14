import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Exams available to the learner: bound to courses of ACTIVE enrollments only.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (s.role === 'student') {
    const rows = (await query(
      `select e.id, e.title, e.kind, e.duration_minutes, c.name as course_name,
              count(eq.question_id)::int as question_count,
              (select count(*)::int from attempts a where a.exam_id = e.id and a.user_id = $1 and a.finished_at is not null) as done_count
       from exams e
       join courses c on c.id = e.course_id
       join groups g on g.course_id = c.id
       join enrollments en on en.group_id = g.id
       join students st on st.id = en.student_id
       left join exam_questions eq on eq.exam_id = e.id
       where st.user_id = $1 and en.tenant_id = $2 and en.status = 'active'
       group by e.id, c.name
       order by e.created_at desc limit 100`,
      [s.userId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select distinct e.id, e.title, e.kind, e.duration_minutes, c.name as course_name, st.name as student_name,
            (select count(*)::int from exam_questions eq2 where eq2.exam_id = e.id) as question_count
     from exams e
     join courses c on c.id = e.course_id
     join groups g on g.course_id = c.id
     join enrollments en on en.group_id = g.id
     join students st on st.id = en.student_id
     where st.guardian_user_id = $1 and en.tenant_id = $2 and en.status = 'active'
     order by e.created_at desc limit 100`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}
