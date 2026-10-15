import { NextResponse } from 'next/server';
import { query, safeError, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

// Scope C: duplicate an exam with its questions and positions.
export async function POST(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;

  try {
    const src = (await query('select * from exams where id=$1 and tenant_id=$2', [id, s.tenantId])).rows[0] as any;
    if (!src) return NextResponse.json({ error: 'الامتحان غير موجود' }, { status: 404 });
    if (!(isAdminRole(s.role)) && !(s.role === 'teacher' && src.course_id && (await canAccessCourse(s, String(src.course_id))))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const copy = await withTx(async (client) => {
      const created = (await client.query(
        `insert into exams(tenant_id,course_id,title,kind,duration_minutes,sections,randomize,created_by)
         values($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
        [s.tenantId, src.course_id, 'نسخة من: ' + src.title, src.kind, src.duration_minutes, src.sections, src.randomize, s.userId]
      )).rows[0];
      await client.query(
        `insert into exam_questions(exam_id,question_id,position)
         select $1, question_id, position from exam_questions where exam_id=$2`,
        [created.id, src.id]
      );
      return created;
    });

    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'exam.copy', entity: 'exam', entityId: String(copy.id), metadata: { from: id } });
    return NextResponse.json(copy, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر نسخ الامتحان') }, { status: 400 });
  }
}
