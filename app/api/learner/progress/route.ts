import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// V3: per-course progress for the learner (assignments submitted + exams finished / total available).
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const studentFilter = s.role === 'student'
    ? 'st.user_id = $1'
    : 'st.guardian_user_id = $1';

  const courses = (await query(
    `select distinct c.id, c.name${s.role === 'guardian' ? ', st.name as student_name' : ''} from enrollments e
     join groups g on g.id = e.group_id join courses c on c.id = g.course_id
     join students st on st.id = e.student_id
     where ${studentFilter} and e.tenant_id = $2 and e.status = 'active'
     order by c.name`,
    [s.userId, s.tenantId]
  )).rows as Array<any>;

  const studentIds = s.role === 'student'
    ? [(await query('select id from students where user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows[0]?.id].filter(Boolean)
    : (await query('select id from students where guardian_user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows.map((r: any) => r.id);
  const userIds = s.role === 'student' ? [s.userId] : (await query('select id from users where id in (select user_id from students where guardian_user_id=$1 and user_id is not null) or id=$1', [s.userId])).rows.map((r: any) => r.id);

  const out = [];
  for (const c of courses) {
    const totals = (await query(
      `select
         (select count(*)::int from assignments where course_id=$1::uuid and tenant_id=$2::uuid) as a,
         (select count(*)::int from exams where course_id=$1::uuid and tenant_id=$2::uuid) as e`,
      [c.id, s.tenantId]
    )).rows[0] as any;
    const done = (await query(
      `select
         (select count(*)::int from submissions where assignment_id in (select id from assignments where course_id=$1::uuid) and student_id = any($3::uuid[]) and tenant_id=$2::uuid) as a,
         (select count(*)::int from attempts where exam_id in (select id from exams where course_id=$1::uuid) and user_id = any($4::uuid[]) and finished_at is not null and tenant_id=$2::uuid) as e`,
      [c.id, s.tenantId, studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000'], userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']]
    )).rows[0] as any;
    const totalN = Number(totals.a) + Number(totals.e);
    const doneN = Number(done.a) + Number(done.e);
    const pct = totalN ? Math.min(100, Math.round((doneN / totalN) * 100)) : 0;
    const lastVideo = (await query(
      'select v.id, v.title from videos v where v.course_id=$1 and v.tenant_id=$2 order by v.created_at desc limit 1',
      [c.id, s.tenantId]
    )).rows[0] as any;
    out.push({
      courseId: c.id,
      courseName: c.name,
      studentName: c.student_name || undefined,
      total: totalN,
      done: doneN,
      pct,
      lastVideo: lastVideo ? { id: String(lastVideo.id), title: String(lastVideo.title) } : null,
    });
  }
  return NextResponse.json(out);
}
