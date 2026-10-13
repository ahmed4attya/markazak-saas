import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

type Context = { params: Promise<{ id: string }> };
const gradeSchema = z.object({ grade: z.number().min(0).max(100000), feedback: z.string().trim().max(10000).optional().default('') });

export async function PATCH(req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const { id } = await context.params;
    const input = gradeSchema.parse(await req.json());
    const submission = (await query(
      `select sub.id,a.course_id,a.points from submissions sub join assignments a on a.id=sub.assignment_id and a.tenant_id=sub.tenant_id where sub.id=$1 and sub.tenant_id=$2`,
      [id,s.tenantId]
    )).rows[0];
    if (!submission) return NextResponse.json({ error: 'التسليم غير موجود' }, { status: 404 });
    if (!(await canAccessCourse(s, String(submission.course_id)))) return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    if (input.grade > Number(submission.points)) return NextResponse.json({ error: 'الدرجة تتجاوز نقاط الواجب' }, { status: 400 });
    const row = (await query(
      `update submissions set grade=$1,feedback=$2,graded_by=$3,graded_at=now() where id=$4 and tenant_id=$5 returning *`,
      [input.grade,input.feedback,s.userId,id,s.tenantId]
    )).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'assignment.grade', entity: 'submission', entityId: id });
    return NextResponse.json(row);
  } catch (e) { return NextResponse.json({ error: safeError(e, e instanceof Error ? e.message : 'تعذر تصحيح التسليم') }, { status: 400 }); }
}
