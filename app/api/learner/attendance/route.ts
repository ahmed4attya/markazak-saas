import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (s.role === 'student') {
    const rows = (await query(
      `select a.attendance_date, a.status from attendance a join students st on st.id = a.student_id where st.user_id = $1 and a.tenant_id = $2 order by a.attendance_date desc limit 100`,
      [s.userId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select a.attendance_date, a.status, st.name as student_name from attendance a join students st on st.id = a.student_id where st.guardian_user_id = $1 and a.tenant_id = $2 order by a.attendance_date desc limit 100`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}