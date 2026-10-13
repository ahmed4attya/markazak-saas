import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const { id } = await context.params;
    const assignment = (await query(
      `select a.id,a.title,a.points,a.course_id,c.name as course_name
       from assignments a join courses c on c.id=a.course_id and c.tenant_id=a.tenant_id
       where a.id=$1 and a.tenant_id=$2`,
      [id, s.tenantId]
    )).rows[0];
    if (!assignment) return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 });
    if (!(await canAccessCourse(s, String(assignment.course_id)))) return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    const rows = (await query(
      `select sub.id,sub.student_id,st.student_no,st.name as student_name,sub.answer_text,sub.submitted_at,
              sub.grade,sub.feedback,sub.graded_at
       from submissions sub join students st on st.id=sub.student_id and st.tenant_id=sub.tenant_id
       where sub.assignment_id=$1 and sub.tenant_id=$2 order by st.name asc`,
      [id, s.tenantId]
    )).rows;
    return NextResponse.json({ assignment, rows });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر تحميل سجل الدرجات') }, { status: 400 });
  }
}
