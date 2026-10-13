import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

async function loadExam(id: string, tenantId: string) {
  return (await query(
    `select e.*, c.name as course_name from exams e
     left join courses c on c.id=e.course_id and c.tenant_id=e.tenant_id
     where e.id=$1 and e.tenant_id=$2`,
    [id, tenantId]
  )).rows[0] as any;
}

async function canManageExam(s: { role: string; userId: string; tenantId: string }, exam: any) {
  if (isAdminRole(s.role)) return true;
  if (s.role !== 'teacher' || !exam.course_id) return false;
  return canAccessCourse(s, String(exam.course_id));
}

export async function GET(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;
  const exam = await loadExam(id, s.tenantId);
  if (!exam || !(await canManageExam(s, exam))) return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 });
  const questions = (await query(
    `select q.id, q.text, q.kind, q.options, q.correct_index, q.explanation,
            q.domain, q.subject, q.topic, q.skill, eq.position
     from exam_questions eq join questions q on q.id=eq.question_id and q.tenant_id=$2
     where eq.exam_id=$1 order by eq.position`,
    [id, s.tenantId]
  )).rows;
  return NextResponse.json({ ...exam, questions });
}

export async function DELETE(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;
  const exam = await loadExam(id, s.tenantId);
  if (!exam) return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 });
  if (!(await canManageExam(s, exam))) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  await query('delete from exams where id=$1 and tenant_id=$2', [id, s.tenantId]);
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'exam.delete', entity: 'exam', entityId: id });
  return NextResponse.json({ ok: true });
}
