import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const courseId = (searchParams.get('courseId') || '').trim();
  const courseFilter = courseId && UUID_RE.test(courseId) ? ' and v.course_id=$3' : '';
  const params = s.role === 'student'
    ? [s.userId, s.tenantId, ...(courseFilter ? [courseId] : [])]
    : [s.userId, s.tenantId, ...(courseFilter ? [courseId] : [])];

  if (s.role === 'student') {
    const rows = (await query(
      `select v.id, v.title, v.mime, v.size_bytes, v.duration_seconds, v.created_at, c.id as course_id, c.name as course_name from videos v
       join courses c on c.id = v.course_id
       join groups g on g.course_id = c.id
       join enrollments e on e.group_id = g.id
       join students st on st.id = e.student_id
       where st.user_id = $1 and v.tenant_id = $2${courseFilter}
       group by v.id, c.id, c.name order by v.created_at desc limit 100`,
      params
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select distinct v.id, v.title, v.mime, v.size_bytes, v.duration_seconds, v.created_at, c.id as course_id, c.name as course_name, st.name as student_name from videos v
     join courses c on c.id = v.course_id
     join groups g on g.course_id = c.id
     join enrollments e on e.group_id = g.id
     join students st on st.id = e.student_id
     where st.guardian_user_id = $1 and v.tenant_id = $2
     group by v.id, st.name, c.id, c.name order by v.created_at desc limit 100`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}
