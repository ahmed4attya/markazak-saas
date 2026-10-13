import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const column = s.role === 'student' ? 'student_user_id' : 'guardian_user_id';
  const students = (await query(
    `select id, student_no, name, type, status, email, phone
     from students where tenant_id=$1 and ${column}=$2 order by name`,
    [s.tenantId, s.userId]
  )).rows;
  if (!students.length) return NextResponse.json({ error: 'لا يوجد سجل مرتبط بهذا الحساب' }, { status: 404 });

  const ids = students.map((student) => student.id);
  const enrollments = (await query(
    `select e.id, e.student_id, e.status, e.enrolled_at, g.id as group_id, g.name as group_name,
            c.id as course_id, c.name as course_name
     from enrollments e join groups g on g.id=e.group_id and g.tenant_id=e.tenant_id
     left join courses c on c.id=g.course_id and c.tenant_id=g.tenant_id
     where e.tenant_id=$1 and e.student_id=any($2::uuid[])
     order by e.enrolled_at desc`,
    [s.tenantId, ids]
  )).rows;
  return NextResponse.json({ role: s.role, students, enrollments });
}
