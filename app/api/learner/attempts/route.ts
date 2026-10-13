import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (s.role === 'student') {
    const rows = (await query(
      `select a.*, e.title as exam_title from attempts a join exams e on e.id = a.exam_id where a.user_id = $1 and a.tenant_id = $2 order by a.started_at desc limit 50`,
      [s.userId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select a.*, e.title as exam_title, st.name as student_name from attempts a
     join exams e on e.id = a.exam_id
     join students st on st.user_id = a.user_id
     where st.guardian_user_id = $1 and a.tenant_id = $2
     order by a.started_at desc limit 50`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}