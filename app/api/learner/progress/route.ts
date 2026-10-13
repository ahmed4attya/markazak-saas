import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const linkColumn = s.role === 'student' ? 'student_user_id' : 'guardian_user_id';
  const students = (await query(`select id,name,student_user_id from students where tenant_id=$1 and ${linkColumn}=$2`, [s.tenantId, s.userId])).rows;
  if (!students.length) return NextResponse.json({ error: 'لا يوجد سجل مرتبط' }, { status: 404 });
  const studentIds = students.map((row) => row.id);
  const userIds = students.map((row) => row.student_user_id).filter(Boolean);
  const attempts = (await query(
    `select count(*)::int as total, count(*) filter(where finished_at is not null)::int as completed,
            coalesce(round(avg(case when total > 0 then score * 100.0 / total end),1),0) as average_score
     from attempts where tenant_id=$1 and user_id=any($2::uuid[])`, [s.tenantId,userIds]
  )).rows[0];
  const assignments = (await query(
    `select count(distinct a.id)::int as total, count(distinct sub.id)::int as submitted,
            count(distinct sub.id) filter(where sub.grade is not null)::int as graded,
            coalesce(round(avg(sub.grade),1),0) as average_grade
     from enrollments en join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id
     join assignments a on a.course_id=g.course_id and a.tenant_id=en.tenant_id
     left join submissions sub on sub.assignment_id=a.id and sub.student_id=en.student_id and sub.tenant_id=en.tenant_id
     where en.tenant_id=$1 and en.student_id=any($2::uuid[]) and en.status='active'`, [s.tenantId,studentIds]
  )).rows[0];
  const courses = (await query(
    `select c.id,c.name,count(distinct en.student_id)::int as students,count(distinct e.id)::int as exams,
            count(distinct a.id)::int as assignments
     from enrollments en join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id
     join courses c on c.id=g.course_id and c.tenant_id=en.tenant_id
     left join exams e on e.course_id=c.id and e.tenant_id=c.tenant_id
     left join assignments a on a.course_id=c.id and a.tenant_id=c.tenant_id
     where en.tenant_id=$1 and en.student_id=any($2::uuid[]) and en.status='active'
     group by c.id,c.name order by c.name`, [s.tenantId,studentIds]
  )).rows;
  return NextResponse.json({ role: s.role, students: students.map((row) => ({ id: row.id, name: row.name })), attempts, assignments, courses });
}
