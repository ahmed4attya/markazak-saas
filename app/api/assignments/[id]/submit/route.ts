import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { submissionInputSchema } from '@/lib/assignment-contract';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'التسليم متاح لحساب الطالب فقط' }, { status: 403 });
  try {
    const { id } = await context.params;
    const input = submissionInputSchema.parse(await req.json());
    const student = (await query('select id from students where tenant_id=$1 and student_user_id=$2', [s.tenantId, s.userId])).rows[0];
    if (!student) return NextResponse.json({ error: 'لا يوجد سجل طالب مرتبط' }, { status: 404 });
    const visible = (await query(
      `select a.id from assignments a where a.id=$1 and a.tenant_id=$2 and exists(
        select 1 from enrollments en join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id
        where en.tenant_id=a.tenant_id and en.student_id=$3 and en.status='active' and g.course_id=a.course_id
      )`, [id,s.tenantId,student.id]
    )).rows;
    if (!visible.length) return NextResponse.json({ error: 'الواجب غير متاح لك' }, { status: 403 });
    const existing = (await query('select grade from submissions where id is not null and assignment_id=$1 and student_id=$2 and tenant_id=$3', [id,student.id,s.tenantId])).rows[0];
    if (existing?.grade !== null && existing?.grade !== undefined) return NextResponse.json({ error: 'تم تصحيح هذا التسليم ولا يمكن تغييره' }, { status: 409 });
    const row = (await query(
      `insert into submissions(tenant_id,assignment_id,student_id,answer_text,attachment_key,submitted_at)
       values($1,$2,$3,$4,$5,now()) on conflict(assignment_id,student_id) do update set answer_text=excluded.answer_text,attachment_key=excluded.attachment_key,submitted_at=now(),graded_by=null,graded_at=null returning *`,
      [s.tenantId,id,student.id,input.answerText,input.attachmentKey]
    )).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'assignment.submit', entity: 'submission', entityId: String(row.id), metadata: { assignmentId: id } });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return NextResponse.json({ error: safeError(e, e instanceof Error ? e.message : 'تعذر تسليم الواجب') }, { status: 400 }); }
}
