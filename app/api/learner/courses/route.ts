import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (s.role === 'student') {
    const rows = (await query(
      `select c.id, c.name, c.category, c.status from enrollments e
       join groups g on g.id = e.group_id join courses c on c.id = g.course_id
       join students st on st.id = e.student_id
       where st.user_id = $1 and e.tenant_id = $2 and e.status = 'active'
       group by c.id, c.name, c.category, c.status order by c.name`,
      [s.userId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select distinct c.id, c.name, c.category, c.status, st.name as student_name from students st
     join enrollments e on e.student_id = st.id
     join groups g on g.id = e.group_id join courses c on c.id = g.course_id
     where st.guardian_user_id = $1 and e.tenant_id = $2 and e.status = 'active'
     order by c.name`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}