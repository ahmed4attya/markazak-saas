import { NextResponse } from 'next/server';
import { query, safeError, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'المحاولة متاحة لحساب الطالب فقط' }, { status: 403 });
  try {
    const body = await req.json();
    const examId = typeof body.examId === 'string' ? body.examId : '';
    if (!examId) return NextResponse.json({ error: 'معرف الامتحان مطلوب' }, { status: 400 });

    const result = await withTx(async (client) => {
      const student = (await client.query('select id from students where tenant_id=$1 and student_user_id=$2', [s.tenantId, s.userId])).rows[0];
      if (!student) throw new Error('لا يوجد سجل طالب مرتبط بالحساب');
      const exam = (await client.query(
        `select e.id, e.course_id, e.title, e.kind, e.duration_minutes, e.randomize,
                count(eq.question_id)::int as total
         from exams e left join exam_questions eq on eq.exam_id=e.id
         where e.id=$1 and e.tenant_id=$2 group by e.id`,
        [examId, s.tenantId]
      )).rows[0];
      if (!exam) throw new Error('الامتحان غير موجود');
      if (exam.course_id) {
        const enrolled = await client.query(
          `select 1 from enrollments en join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id
           where en.tenant_id=$1 and en.student_id=$2 and en.status='active' and g.course_id=$3`,
          [s.tenantId, student.id, exam.course_id]
        );
        if (!enrolled.rows.length) throw new Error('لا تملك صلاحية دخول هذا الامتحان');
      }
      const questions = (await client.query(
        `select q.id, q.text, q.kind, q.options, q.domain, q.subject, q.topic, q.skill, eq.position
         from exam_questions eq join questions q on q.id=eq.question_id and q.tenant_id=$2
         where eq.exam_id=$1 order by eq.position`,
        [examId, s.tenantId]
      )).rows;
      const attempt = (await client.query(
        `insert into attempts(tenant_id,exam_id,user_id,answers,total) values($1,$2,$3,$4,$5) returning id,exam_id,started_at,total`,
        [s.tenantId, examId, s.userId, JSON.stringify({}), questions.length]
      )).rows[0];
      return { attempt, exam, questions };
    });
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'attempt.start', entity: 'attempt', entityId: String(result.attempt.id), metadata: { examId } });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, e instanceof Error ? e.message : 'تعذر بدء المحاولة') }, { status: 400 });
  }
}
