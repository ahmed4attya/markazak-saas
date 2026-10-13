import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { lessonInputSchema } from '@/lib/lesson-contract';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const courseId = new URL(req.url).searchParams.get('courseId')?.trim() || '';
  const values: any[] = [s.tenantId]; let filter = '';
  if (s.role === 'teacher') { values.push(s.userId); filter += ` and exists(select 1 from course_teachers ct where ct.course_id=l.course_id and ct.teacher_user_id=$${values.length})`; }
  if (courseId) { values.push(courseId); filter += ` and l.course_id=$${values.length}`; }
  return NextResponse.json((await query(`select l.*,c.name as course_name from course_lessons l join courses c on c.id=l.course_id and c.tenant_id=l.tenant_id where l.tenant_id=$1${filter} order by c.name,l.position`, values)).rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const input = lessonInputSchema.parse(await req.json());
    if (!(await canAccessCourse(s, input.courseId))) return NextResponse.json({ error: 'غير مصرح بهذه الدورة' }, { status: 403 });
    if (input.videoId) {
      const video = await query('select 1 from videos where id=$1 and tenant_id=$2 and course_id=$3', [input.videoId, s.tenantId, input.courseId]);
      if (!video.rows.length) return NextResponse.json({ error: 'الفيديو لا ينتمي للدورة' }, { status: 400 });
    }
    const row = (await query(`insert into course_lessons(tenant_id,course_id,video_id,position,title,description,body,duration_minutes,published,created_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`, [s.tenantId,input.courseId,input.videoId,input.position,input.title,input.description,input.body,input.durationMinutes,input.published,s.userId])).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'lesson.create', entity: 'course_lesson', entityId: String(row.id) });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return NextResponse.json({ error: safeError(e, 'تعذر إنشاء الدرس') }, { status: 400 }); }
}
