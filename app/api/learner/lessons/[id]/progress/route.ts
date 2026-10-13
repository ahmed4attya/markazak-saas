import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { lessonProgressSchema } from '@/lib/lesson-contract';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'تقدم الدرس متاح لحساب الطالب فقط' }, { status: 403 });
  try {
    const { id } = await context.params; const input = lessonProgressSchema.parse(await req.json());
    const student = (await query('select id from students where tenant_id=$1 and student_user_id=$2', [s.tenantId, s.userId])).rows[0];
    if (!student) return NextResponse.json({ error: 'لا يوجد سجل طالب مرتبط' }, { status: 404 });
    const visible = (await query(`select l.id from course_lessons l where l.id=$1 and l.tenant_id=$2 and l.published=true and exists(select 1 from enrollments en join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id where en.tenant_id=$2 and en.student_id=$3 and en.status='active' and g.course_id=l.course_id)`, [id,s.tenantId,student.id])).rows;
    if (!visible.length) return NextResponse.json({ error: 'الدرس غير متاح لك' }, { status: 403 });
    const row = (await query(`insert into lesson_progress(tenant_id,lesson_id,student_id,seconds_watched,completed_at,updated_at) values($1,$2,$3,$4,$5,now()) on conflict(lesson_id,student_id) do update set seconds_watched=greatest(lesson_progress.seconds_watched,excluded.seconds_watched),completed_at=coalesce(excluded.completed_at,lesson_progress.completed_at),updated_at=now() returning *`, [s.tenantId,id,student.id,input.secondsWatched,input.completed ? new Date().toISOString() : null])).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'lesson.progress', entity: 'lesson_progress', entityId: String(row.id), metadata: { lessonId: id, completed: input.completed } });
    return NextResponse.json(row);
  } catch (e) { return NextResponse.json({ error: safeError(e, 'تعذر حفظ تقدم الدرس') }, { status: 400 }); }
}
