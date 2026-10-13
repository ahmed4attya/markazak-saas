import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (s.role === 'student') {
    const rows = (await query(
      `select v.id, v.title, v.mime, v.size_bytes, v.duration_seconds, v.created_at from videos v
       join courses c on c.id = v.course_id
       join groups g on g.course_id = c.id
       join enrollments e on e.group_id = g.id
       join students st on st.id = e.student_id
       where st.user_id = $1 and v.tenant_id = $2
       group by v.id order by v.created_at desc limit 100`,
      [s.userId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select distinct v.id, v.title, v.mime, v.size_bytes, v.duration_seconds, v.created_at, st.name as student_name from videos v
     join courses c on c.id = v.course_id
     join groups g on g.course_id = c.id
     join enrollments e on e.group_id = g.id
     join students st on st.id = e.student_id
     where st.guardian_user_id = $1 and v.tenant_id = $2
     group by v.id, st.name order by v.created_at desc limit 100`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}