import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const linkColumn = s.role === 'student' ? 'student_user_id' : 'guardian_user_id';
  const rows = (await query(
    `select distinct e.id, e.title, e.kind, e.duration_minutes, e.course_id, c.name as course_name,
            count(eq.question_id)::int as question_count
     from students st
     join enrollments en on en.student_id=st.id and en.tenant_id=st.tenant_id and en.status='active'
     join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id
     join exams e on e.course_id=g.course_id and e.tenant_id=st.tenant_id
     left join courses c on c.id=e.course_id and c.tenant_id=e.tenant_id
     left join exam_questions eq on eq.exam_id=e.id
     where st.tenant_id=$1 and st.${linkColumn}=$2
     group by e.id,c.name order by c.name,e.created_at desc`,
    [s.tenantId, s.userId]
  )).rows;
  return NextResponse.json(rows);
}
