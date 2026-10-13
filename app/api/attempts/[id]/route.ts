import { NextResponse } from 'next/server';
import { query, safeError, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;
  try {
    const body = await req.json();
    const rawAnswers = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers) ? body.answers : {};
    const submit = body.submit === true;
    const result = await withTx(async (client) => {
      const attempt = (await client.query(
        `select a.id, a.exam_id, a.finished_at from attempts a where a.id=$1 and a.tenant_id=$2 and a.user_id=$3 for update`,
        [id, s.tenantId, s.userId]
      )).rows[0];
      if (!attempt) throw new Error('المحاولة غير موجودة');
      if (attempt.finished_at) throw new Error('تم تسليم هذه المحاولة بالفعل');
      const questions = (await client.query(
        `select q.id, q.correct_index from exam_questions eq join questions q on q.id=eq.question_id and q.tenant_id=$2 where eq.exam_id=$1`,
        [attempt.exam_id, s.tenantId]
      )).rows as Array<{ id: string; correct_index: number }>;
      const allowed = new Set(questions.map((question) => String(question.id)));
      const answers: Record<string, number> = {};
      for (const [questionId, value] of Object.entries(rawAnswers)) {
        if (allowed.has(questionId) && Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 20) answers[questionId] = Number(value);
      }
      if (!submit) {
        const saved = (await client.query(
          `update attempts set answers=$1 where id=$2 and tenant_id=$3 and user_id=$4 returning id,answers,total,finished_at`,
          [JSON.stringify(answers), id, s.tenantId, s.userId]
        )).rows[0];
        return { saved, submitted: false };
      }
      const score = questions.reduce((sum, question) => sum + (answers[String(question.id)] === question.correct_index ? 1 : 0), 0);
      const saved = (await client.query(
        `update attempts set answers=$1, score=$2, finished_at=now() where id=$3 and tenant_id=$4 and user_id=$5 returning id,answers,score,total,started_at,finished_at`,
        [JSON.stringify(answers), score, id, s.tenantId, s.userId]
      )).rows[0];
      return { saved, submitted: true, score, review: questions.map((question) => ({ questionId: question.id, correctIndex: question.correct_index, answer: answers[String(question.id)] ?? null })) };
    });
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: result.submitted ? 'attempt.submit' : 'attempt.autosave', entity: 'attempt', entityId: id });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: safeError(e, e instanceof Error ? e.message : 'تعذر حفظ المحاولة') }, { status: 400 });
  }
}

export async function GET(_req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;
  const attempt = (await query(
    `select a.id, a.exam_id, a.answers, a.score, a.total, a.started_at, a.finished_at, e.title, e.kind, e.duration_minutes
     from attempts a join exams e on e.id=a.exam_id and e.tenant_id=a.tenant_id
     where a.id=$1 and a.tenant_id=$2 and a.user_id=$3`,
    [id, s.tenantId, s.userId]
  )).rows[0];
  if (!attempt) return NextResponse.json({ error: 'المحاولة غير موجودة' }, { status: 404 });
  const questions = (await query(
    `select q.id, q.text, q.kind, q.options, q.domain, q.subject, q.topic, q.skill, eq.position
     from exam_questions eq join questions q on q.id=eq.question_id and q.tenant_id=$2
     where eq.exam_id=$1 order by eq.position`,
    [attempt.exam_id, s.tenantId]
  )).rows;
  const review = attempt.finished_at
    ? (await query(
      `select q.id as question_id, q.correct_index, (a.answers->>q.id::text)::int as answer
       from exam_questions eq join questions q on q.id=eq.question_id and q.tenant_id=$2
       cross join attempts a where eq.exam_id=$1 and a.id=$3`,
      [attempt.exam_id, s.tenantId, id]
    )).rows
    : undefined;
  return NextResponse.json({ attempt, questions, review });
}
