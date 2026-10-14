import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// Submit + auto-score an unfinished own attempt. Score comes from the DB
// (correct_index) - the client never saw the answers.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { attemptId?: string; c?: Record<string, number> };
  const attemptId = String(b.attemptId || '');
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(attemptId) || !b.c || typeof b.c !== 'object' || Array.isArray(b.c)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const attempt = (await query(
    `select a.id, a.exam_id, a.answers, a.finished_at, e.title as exam_title
     from attempts a join exams e on e.id = a.exam_id
     where a.id=$1 and a.user_id=$2 and a.tenant_id=$3`,
    [attemptId, s.userId, s.tenantId]
  )).rows[0] as any;
  if (!attempt) return NextResponse.json({ error: 'المحاولة غير موجودة' }, { status: 404 });
  if (attempt.finished_at) return NextResponse.json({ error: 'المحاولة منتهية بالفعل' }, { status: 409 });

  const c = b.c as Record<string, number>;

  const qs = (await query(
    `select q.id, q.correct_index, q.explanation, q.text from exam_questions eq
     join questions q on q.id = eq.question_id and q.tenant_id=$2
     where eq.exam_id=$1`,
    [attempt.exam_id, s.tenantId]
  )).rows as Array<{ id: string; correct_index: number; explanation: string | null; text: string }>;
  if (!qs.length) return NextResponse.json({ error: 'الامتحان بلا أسئلة' }, { status: 400 });

  let score = 0;
  const perQuestion = qs.map((q) => {
    const chosen = Object.prototype.hasOwnProperty.call(c, q.id) ? Number(c[q.id]) : null;
    const correct = chosen !== null && chosen === Number(q.correct_index);
    if (correct) score++;
    return {
      questionId: q.id,
      text: q.text,
      chosen,
      correctIndex: Number(q.correct_index),
      correct,
      explanation: q.explanation,
    };
  });

  const answers = (attempt.answers || {}) as any;
  const next = { order: Array.isArray(answers.order) ? answers.order.map(String) : qs.map((q) => q.id), c };
  await query(
    `update attempts set answers=$2, score=$3, total=$4, finished_at=now() where id=$1`,
    [attemptId, JSON.stringify(next), score, qs.length]
  );
  await logAudit({
    tenantId: s.tenantId,
    userId: s.userId,
    action: 'exam.submit',
    entity: 'exam',
    entityId: String(attempt.exam_id),
    metadata: { score, total: qs.length },
  });

  return NextResponse.json({
    attemptId,
    examTitle: attempt.exam_title,
    score,
    total: qs.length,
    percent: qs.length ? Math.round((score / qs.length) * 100) : 0,
    perQuestion,
  });
}
