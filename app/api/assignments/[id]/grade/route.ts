import { NextResponse } from 'next/server';
import { query, safeError, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

// Grade (upsert) a submission - supports grading offline submissions too.
export async function POST(req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;

  try {
    const b = (await req.json()) as { studentId?: string; score?: number; feedback?: string };
    const studentId = typeof b.studentId === 'string' ? b.studentId : '';
    if (!studentId) return NextResponse.json({ error: 'معرف الطالب مطلوب' }, { status: 400 });

    const a = (await query('select * from assignments where id=$1 and tenant_id=$2', [id, s.tenantId])).rows[0] as any;
    if (!a) return NextResponse.json({ error: 'الواجب غير موجود' }, { status: 404 });
    if (!(isAdminRole(s.role)) && !(s.role === 'teacher' && a.course_id && (await canAccessCourse(s, String(a.course_id))))) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const maxScore = Number(a.max_score) || 100;
    const score = typeof b.score === 'number' ? b.score : NaN;
    if (!Number.isFinite(score) || score < 0 || score > maxScore) {
      return NextResponse.json({ error: 'الدرجة يجب أن تكون بين 0 و' + maxScore }, { status: 400 });
    }

    const result = await withTx(async (client) => {
      const existing = (await client.query(
        'select id from submissions where assignment_id=$1 and student_id=$2 for update',
        [id, studentId]
      )).rows[0] as any;
      if (existing) {
        return (await client.query(
          `update submissions set score=$3, feedback=$4, graded_at=now(), graded_by=$5 where id=$1 and tenant_id=$2 returning *`,
          [existing.id, s.tenantId, score, b.feedback || null, s.userId]
        )).rows[0];
      }
      return (await client.query(
        `insert into submissions(tenant_id,assignment_id,student_id,score,feedback,graded_at,graded_by)
         values($1,$2,$3,$4,$5,now(),$6) returning *`,
        [s.tenantId, id, studentId, score, b.feedback || null, s.userId]
      )).rows[0];
    });

    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'submission.grade', entity: 'assignment', entityId: id, metadata: { studentId, score } });
    {
      const st = (await query('select user_id, name from students where id=$1 and tenant_id=$2', [studentId, s.tenantId])).rows[0] as any;
      if (st?.user_id) {
        const { notifyUsers } = await import('@/lib/notify');
        await notifyUsers(s.tenantId, [String(st.user_id)], 'تم تصحيح واجبك: ' + a.title, 'الدرجة: ' + score + ' من ' + maxScore + (b.feedback ? ' — ' + b.feedback : ''), 'grade');
      }
    }
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر حفظ الدرجة') }, { status: 400 });
  }
}
