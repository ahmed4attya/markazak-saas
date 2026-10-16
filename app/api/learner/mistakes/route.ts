import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// V-S2: mistake box - questions the learner answered WRONGLY in finished attempts.
// "أتممته" is DERIVED (last answer for the question was correct) - no extra storage.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const userIds = s.role === 'student'
    ? [s.userId]
    : (await query(
        'select user_id from students where guardian_user_id=$1 and user_id is not null and tenant_id=$2',
        [s.userId, s.tenantId]
      )).rows.map((r: any) => String(r.user_id));
  if (!userIds.length) return NextResponse.json([]);

  const attempts = (await query(
    'select id, user_id, answers, finished_at from attempts where user_id = any($1::uuid[]) and tenant_id=$2 and finished_at is not null and answers is not null order by finished_at asc limit 500',
    [userIds, s.tenantId]
  )).rows as Array<any>;

  // aggregate per question across all attempts
  type Agg = { wrongCount: number; lastChosen: number | null; lastCorrect: boolean; lastAt: string; studentByUser: Map<string, string>; _history: Array<{ chosen: number; at: string; user: string }> };
  const agg = new Map<string, Agg>();
  const userOfAttempt = new Map<string, string>();
  for (const a of attempts) userOfAttempt.set(String(a.id), String(a.user_id));

  for (const a of attempts) {
    const answers = a.answers || {};
    const c = (answers.c && typeof answers.c === 'object') ? answers.c : {};
    for (const qid of Object.keys(c)) {
      const chosen = Number(c[qid]);
      if (!Number.isFinite(chosen)) continue;
      const g = agg.get(qid) || { wrongCount: 0, lastChosen: null as number | null, lastCorrect: false, lastAt: '', studentByUser: new Map<string, string>(), _history: [] as Array<{ chosen: number; at: string; user: string }> };
      (g as any)._history = (g as any)._history || [];
      (g as any)._history.push({ chosen, at: a.finished_at, user: String(a.user_id) });
      agg.set(qid, g);
    }
  }
  if (!agg.size) return NextResponse.json([]);

  const qids = [...agg.keys()];
  const qs = (await query(
    'select id, domain, subject, topic, skill, difficulty, text, options, correct_index from questions where id = any($1::uuid[]) and tenant_id=$2',
    [qids, s.tenantId]
  )).rows as Array<any>;

  const studentNames = new Map<string, string>();
  if (s.role === 'guardian') {
    const rows = (await query('select id, user_id, name from students where guardian_user_id=$1 and user_id is not null and tenant_id=$2', [s.userId, s.tenantId])).rows as Array<any>;
    for (const r of rows) studentNames.set(String(r.user_id), r.name);
  }

  const out = [];
  for (const q of qs) {
    const g = agg.get(String(q.id))!;
    let wrongCount = 0;
    let last = g._history[0];
    for (const h of g._history) {
      if (Number(h.chosen) !== Number(q.correct_index)) wrongCount++;
      if (!last || new Date(h.at) >= new Date(last.at)) last = h;
    }
    const lastCorrect = last ? Number(last.chosen) === Number(q.correct_index) : false;
    out.push({
      questionId: String(q.id),
      domain: q.domain,
      subject: q.subject,
      topic: q.topic,
      skill: q.skill,
      difficulty: q.difficulty,
      text: q.text,
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      wrongCount,
      lastCorrect,
      lastAt: last ? last.at : null,
      studentName: studentNames.get(last?.user || '') || undefined,
    });
  }
  out.sort((a, b) => b.wrongCount - a.wrongCount || (a.lastAt || "").localeCompare(b.lastAt || ""));
  return NextResponse.json(out);
}

// Re-solve one mistake: server-side verdict (client never saw the key).
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const b = (await req.json()) as { questionId?: string; chosen?: number };
    const questionId = String(b.questionId || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionId) || typeof b.chosen !== 'number') {
      return NextResponse.json({ error: 'bad request' }, { status: 400 });
    }
    const q = (await query(
      'select id, correct_index, explanation, options from questions where id=$1 and tenant_id=$2',
      [questionId, s.tenantId]
    )).rows[0] as any;
    if (!q) return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });
    const opts = Array.isArray(q.options) ? q.options.map(String) : [];
    return NextResponse.json({
      correct: Number(b.chosen) === Number(q.correct_index),
      correctIndex: Number(q.correct_index),
      explanation: q.explanation || null,
      options: opts,
    });
  } catch {
    return NextResponse.json({ error: 'تعذر تسجيل إعادة الحل' }, { status: 500 });
  }
}
