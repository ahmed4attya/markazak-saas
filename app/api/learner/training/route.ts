import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRAINING_TITLE = 'التدريب اليومي';

// V-S1: daily training - random questions from the bank, tracked as attempts of a
// per-tenant "التدريب اليومي" exam (course_id null -> invisible to امتحاناتي).
async function ensureTrainingExam(tenantId: string): Promise<string> {
  const found = (await query(
    "select id from exams where tenant_id=$1 and title=$2 and course_id is null order by created_at limit 1",
    [tenantId, TRAINING_TITLE]
  )).rows[0] as any;
  if (found) return String(found.id);
  const created = (await query(
    "insert into exams(tenant_id,title,kind,randomize) values($1,$2,'practice',false) returning id",
    [tenantId, TRAINING_TITLE]
  )).rows[0] as any;
  return String(created.id);
}

async function ensureAttempt(tenantId: string, userId: string, examId: string): Promise<any> {
  const open = (await query(
    'select id, answers from attempts where exam_id=$1 and user_id=$2 and tenant_id=$3 and finished_at is null order by started_at desc limit 1',
    [examId, userId, tenantId]
  )).rows[0] as any;
  if (open) return open;
  return (await query(
    "insert into attempts(tenant_id,exam_id,user_id,answers,started_at) values($1,$2,$3,$4,now()) returning id, answers",
    [tenantId, examId, userId, JSON.stringify({ order: [], c: {} })]
  )).rows[0];
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const count = Math.min(30, Math.max(1, Math.round(Number(searchParams.get('count')) || 10)));
    const domain = (searchParams.get('domain') || '').trim();
    const difficulty = Math.round(Number(searchParams.get('difficulty')) || 0);

    const examId = await ensureTrainingExam(s.tenantId);
    const attempt = await ensureAttempt(s.tenantId, s.userId, examId);

    const params: any[] = [s.tenantId];
    let where = 'where tenant_id=$1 and status=\'active\'';
    if (domain === 'quant' || domain === 'verbal' || domain === 'achievement') {
      params.push(domain);
      where += ' and domain=$' + params.length;
    }
    if (difficulty >= 1 && difficulty <= 5) {
      params.push(difficulty);
      where += ' and difficulty=$' + params.length;
    }
    const rows = (await query(
      `select id, domain, subject, topic, skill, difficulty, kind, text, options from questions ${where} order by random() limit ${count}`,
      params
    )).rows as Array<any>;

    const answers = (attempt.answers || {}) as any;
    return NextResponse.json({
      attemptId: String(attempt.id),
      questions: rows.map((q) => ({
        id: String(q.id),
        domain: q.domain,
        subject: q.subject,
        topic: q.topic,
        skill: q.skill,
        difficulty: q.difficulty,
        kind: q.kind,
        text: q.text,
        options: Array.isArray(q.options) ? q.options : [],
      })),
      saved: answers.c && typeof answers.c === 'object' ? answers.c : {},
    });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر تحميل التدريب' }, { status: 500 });
  }
}

// POST: record one answer -> verdict + reference explanation (client never saw the key).
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const b = (await req.json()) as { attemptId?: string; questionId?: string; chosen?: number; finish?: boolean };
    if (b.finish) {
      const attemptId = String(b.attemptId || '');
      if (!UUID_RE.test(attemptId)) return NextResponse.json({ error: 'bad request' }, { status: 400 });
      const attempt = (await query(
        'select answers from attempts where id=$1 and user_id=$2 and tenant_id=$3 and finished_at is null',
        [attemptId, s.userId, s.tenantId]
      )).rows[0] as any;
      if (!attempt) return NextResponse.json({ error: 'المحاولة غير موجودة أو منتهية' }, { status: 404 });
      const answers = (attempt.answers || {}) as any;
      const c = (answers.c && typeof answers.c === 'object') ? answers.c : {};
      const ids = Object.keys(c);
      if (!ids.length) return NextResponse.json({ error: 'لا إجابات لتصحيحها' }, { status: 400 });
      const qs = (await query('select id, correct_index from questions where id = any($1::uuid[]) and tenant_id=$2', [ids, s.tenantId])).rows as Array<any>;
      let score = 0;
      for (const q of qs) if (Number(c[String(q.id)]) === Number(q.correct_index)) score++;
      const total = ids.length;
      const percent = Math.round((score / total) * 100);
      await query('update attempts set score=$3, total=$4, finished_at=now() where id=$1 and tenant_id=$2', [attemptId, s.tenantId, score, total]);
      const best = (await query(
        'select coalesce(max(score),0)::int as best from attempts where exam_id=(select exam_id from attempts where id=$1) and user_id=$2 and finished_at is not null',
        [attemptId, s.userId]
      )).rows[0] as any;
      return NextResponse.json({ score, total, percent, best: Number(best.best) });
    }

    const attemptId = String(b.attemptId || '');
    const questionId = String(b.questionId || '');
    if (!UUID_RE.test(attemptId) || !UUID_RE.test(questionId) || typeof b.chosen !== 'number') {
      return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    const attempt = (await query(
      'select id, answers from attempts where id=$1 and user_id=$2 and tenant_id=$3 and finished_at is null',
      [attemptId, s.userId, s.tenantId]
    )).rows[0] as any;
    if (!attempt) return NextResponse.json({ error: 'المحاولة غير موجودة أو منتهية' }, { status: 404 });

    const q = (await query(
      'select id, correct_index, explanation, options from questions where id=$1 and tenant_id=$2',
      [questionId, s.tenantId]
    )).rows[0] as any;
    if (!q) return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });

    const answers = (attempt.answers || {}) as any;
    const c = (answers.c && typeof answers.c === 'object') ? answers.c : {};
    c[questionId] = Number(b.chosen);
    await query('update attempts set answers=$2 where id=$1', [attemptId, JSON.stringify({ order: Array.isArray(answers.order) ? answers.order : [], c })]);

    const opts = Array.isArray(q.options) ? q.options.map(String) : [];
    return NextResponse.json({
      correct: Number(b.chosen) === Number(q.correct_index),
      correctIndex: Number(q.correct_index),
      explanation: q.explanation || null,
      options: opts,
    });
  } catch {
    return NextResponse.json({ error: 'تعذر تسجيل الإجابة' }, { status: 500 });
  }
}
