import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { lessonInputSchema } from '@/lib/lesson-contract';

type Context = { params: Promise<{ id: string }> };

async function authorizedLesson(s: { role: string; userId: string; tenantId: string }, id: string) {
  const lesson = (await query('select * from course_lessons where id=$1 and tenant_id=$2', [id, s.tenantId])).rows[0];
  if (!lesson) return null;
  return (isAdminRole(s.role) || await canAccessCourse(s, String(lesson.course_id))) ? lesson : false;
}

export async function PATCH(req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const { id } = await context.params; const current = await authorizedLesson(s, id);
    if (!current) return NextResponse.json({ error: 'الدرس غير موجود أو غير مصرح' }, { status: 404 });
    const input = lessonInputSchema.parse(await req.json());
    if (String(current.course_id) !== input.courseId) return NextResponse.json({ error: 'لا يمكن نقل الدرس بين الدورات' }, { status: 400 });
    const row = (await query(`update course_lessons set position=$1,title=$2,description=$3,body=$4,duration_minutes=$5,published=$6,video_id=$7,updated_at=now() where id=$8 and tenant_id=$9 returning *`, [input.position,input.title,input.description,input.body,input.durationMinutes,input.published,input.videoId,id,s.tenantId])).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'lesson.update', entity: 'course_lesson', entityId: id });
    return NextResponse.json(row);
  } catch (e) { return NextResponse.json({ error: safeError(e, 'تعذر تحديث الدرس') }, { status: 400 }); }
}

export async function DELETE(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params; const current = await authorizedLesson(s, id);
  if (!current) return NextResponse.json({ error: 'الدرس غير موجود أو غير مصرح' }, { status: 404 });
  await query('delete from course_lessons where id=$1 and tenant_id=$2', [id, s.tenantId]);
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'lesson.delete', entity: 'course_lesson', entityId: id });
  return NextResponse.json({ ok: true });
}
