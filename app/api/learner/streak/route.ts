import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// M5: daily activity streak for the learner portal.
// Derived ONLY from real learner behavior: attempts.finished_at + submissions.submitted_at.
// attendance is intentionally excluded (written absence rows would inflate the streak).
// Day boundary: Asia/Riyadh (no DST). Read-only additive; no schema change.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const studentIds = s.role === 'student'
    ? [(await query('select id from students where user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows[0]?.id].filter(Boolean)
    : (await query('select id from students where guardian_user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows.map((r: any) => r.id);
  const userIds = s.role === 'student'
    ? [s.userId]
    : (await query('select id from users where id in (select user_id from students where guardian_user_id=$1 and user_id is not null) or id=$1', [s.userId])).rows.map((r: any) => r.id);

  const PH = '00000000-0000-0000-0000-000000000000';
  const rows = (await query(
    `select d from (
       select distinct (finished_at at time zone 'Asia/Riyadh')::date::text as d from attempts
        where tenant_id=$1::uuid and user_id = any($2::uuid[]) and finished_at is not null
          and finished_at >= now() - interval '120 days'
       union
       select distinct (submitted_at at time zone 'Asia/Riyadh')::date::text as d from submissions
        where tenant_id=$1::uuid and student_id = any($3::uuid[])
          and submitted_at >= now() - interval '120 days'
     ) t order by d desc`,
    [s.tenantId, userIds.length ? userIds : [PH], studentIds.length ? studentIds : [PH]]
  )).rows as Array<{ d: string }>;

  const days = new Set(rows.map((r) => String(r.d).slice(0, 10)));
  const fmt = (dt: Date) => dt.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));
  let streak = 0;
  let cursor = days.has(today) ? today : (days.has(yesterday) ? yesterday : '');
  while (cursor && days.has(cursor)) {
    streak = streak + 1;
    const dt = new Date(cursor + 'T12:00:00Z');
    dt.setUTCDate(dt.getUTCDate() - 1);
    cursor = fmt(dt);
  }
  const lastActive = rows.length ? String(rows[0].d).slice(0, 10) : null;
  return NextResponse.json({ streak, todayActive: days.has(today), lastActive });
}