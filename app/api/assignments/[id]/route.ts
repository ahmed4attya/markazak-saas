import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

async function loadAssignment(id: string, tenantId: string) {
  return (await query(
    `select a.*, c.name as course_name from assignments a left join courses c on c.id = a.course_id
     where a.id = $1 and a.tenant_id = $2`,
    [id, tenantId]
  )).rows[0] as any;
}

async function canManage(s: { role: string; userId: string; tenantId: string }, a: any): Promise<boolean> {
  if (isAdminRole(s.role)) return true;
  if (s.role !== 'teacher' || !a.course_id) return false;
  return canAccessCourse(s, String(a.course_id));
}

export async function GET(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;
  const a = await loadAssignment(id, s.tenantId);
  if (!a) return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 });
  if (!(await canManage(s, a))) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  const submissions = (await query(
    `select sub.id, sub.student_id, sub.content, sub.submitted_at, sub.score, sub.feedback, sub.graded_at,
            st.name as student_name, st.student_no
     from submissions sub join students st on st.id = sub.student_id
     where sub.assignment_id = $1 and sub.tenant_id = $2
     order by sub.submitted_at desc limit 300`,
    [id, s.tenantId]
  )).rows;
  return NextResponse.json({ ...a, submissions });
}

export async function DELETE(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;
  const a = await loadAssignment(id, s.tenantId);
  if (!a) return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 });
  if (!(await canManage(s, a))) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  await query('delete from assignments where id = $1 and tenant_id = $2', [id, s.tenantId]);
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'assignment.delete', entity: 'assignment', entityId: id });
  return NextResponse.json({ ok: true });
}
