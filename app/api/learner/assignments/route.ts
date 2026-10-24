import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// Learner assignments: bound to courses of ACTIVE enrollments only.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (s.role === 'student') {
    const rows = (await query(
      `select distinct a.id, a.title, a.description, a.due_date, a.max_score, a.created_at, c.name as course_name,
              sub.content as my_content, sub.submitted_at as my_submitted_at, sub.score as my_score,
              sub.feedback as my_feedback, sub.graded_at as my_graded_at
       from assignments a
       join courses c on c.id = a.course_id
       join groups g on g.course_id = a.course_id
       join enrollments en on en.group_id = g.id
       join students st on st.id = en.student_id
       left join submissions sub on sub.assignment_id = a.id and sub.student_id = st.id
       where st.user_id = $1 and en.tenant_id = $2 and en.status = 'active'
       order by a.created_at desc limit 200`,
      [s.userId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select distinct a.id, a.title, a.description, a.due_date, a.max_score, a.created_at, c.name as course_name,
            st.name as student_name,
            sub.score, sub.graded_at
     from assignments a
     join courses c on c.id = a.course_id
     join groups g on g.course_id = a.course_id
     join enrollments en on en.group_id = g.id
     join students st on st.id = en.student_id
     left join submissions sub on sub.assignment_id = a.id and sub.student_id = st.id
     where st.guardian_user_id = $1 and en.tenant_id = $2 and en.status = 'active'
     order by a.created_at desc limit 200`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}

// Student submits (or resubmits) text content. Resubmission voids a previous grade.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { assignmentId?: string; content?: string };
  const assignmentId = typeof b.assignmentId === 'string' ? b.assignmentId : '';
  const content = typeof b.content === 'string' ? b.content.trim() : '';
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(assignmentId)) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  if (!content) return NextResponse.json({ error: 'اكتب إجابتك أولاً' }, { status: 400 });
  if (content.length > 20000) return NextResponse.json({ error: 'النص أطول من الحد (20000 حرف)' }, { status: 400 });

  const a = (await query(
    `select a.id from assignments a
     where a.id=$1 and a.tenant_id=$2 and a.course_id is not null
       and exists (
         select 1 from enrollments en
         join groups g on g.id = en.group_id
         join students st on st.id = en.student_id
         where g.course_id = a.course_id and st.user_id = $3 and en.tenant_id = $2 and en.status = 'active'
       )`,
    [assignmentId, s.tenantId, s.userId]
  )).rows[0] as any;
  if (!a) return NextResponse.json({ error: 'الواجب غير متاح لك' }, { status: 404 });

  const student = (await query('select id from students where user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows[0] as any;
  if (!student) return NextResponse.json({ error: 'لا يوجد سجل طالب مرتبط بحسابك' }, { status: 400 });

  const result = (await query(
    `insert into submissions(tenant_id,assignment_id,student_id,content,submitted_at)
     values($1,$2,$3,$4,now())
     on conflict (assignment_id, student_id) do update
       set content = excluded.content, submitted_at = now(), score = null, feedback = null, graded_at = null, graded_by = null
     returning *`,
    [s.tenantId, assignmentId, student.id, content]
  )).rows[0];

  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'submission.create', entity: 'assignment', entityId: assignmentId });
  return NextResponse.json(result, { status: 201 });
}
