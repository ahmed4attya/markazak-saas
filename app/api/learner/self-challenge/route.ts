import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELF_CHALLENGE_TITLE = 'التحدي الذاتي المخصص';

async function ensureSelfChallengeExam(tenantId: string): Promise<string> {
  const found = (await query(
    "select id from exams where tenant_id=$1 and title=$2 and course_id is null order by created_at limit 1",
    [tenantId, SELF_CHALLENGE_TITLE]
  )).rows[0] as any;
  if (found) return String(found.id);

  const created = (await query(
    "insert into exams(tenant_id,title,kind,randomize) values($1,$2,'practice',true) returning id",
    [tenantId, SELF_CHALLENGE_TITLE]
  )).rows[0] as any;
  return String(created.id);
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const count = Math.min(25, Math.max(3, Math.round(Number(searchParams.get('count')) || 10)));
    const domain = (searchParams.get('domain') || '').trim();
    const skill = (searchParams.get('skill') || '').trim();
    const difficulty = Math.round(Number(searchParams.get('difficulty')) || 0);

    const examId = await ensureSelfChallengeExam(s.tenantId);

    // Create a new fresh attempt for this challenge session
    const attempt = (await query(
      "insert into attempts(tenant_id,exam_id,user_id,answers,started_at) values($1,$2,$3,$4,now()) returning id, answers",
      [s.tenantId, examId, s.userId, JSON.stringify({ order: [], c: {}, startedAt: new Date().toISOString() })]
    )).rows[0] as any;

    const params: any[] = [s.tenantId];
    let where = "where tenant_id=$1 and status='active'";

    if (domain === 'quant' || domain === 'verbal' || domain === 'achievement') {
      params.push(domain);
      where += ' and domain=$' + params.length;
    }
    if (skill && skill !== 'all' && skill !== 'الكل') {
      params.push(`%${skill}%`);
      where += ` and (skill ilike $${params.length} or topic ilike $${params.length})`;
    }
    if (difficulty >= 1 && difficulty <= 5) {
      params.push(difficulty);
      where += ' and difficulty=$' + params.length;
    }

    const rows = (await query(
      `select id, domain, subject, topic, skill, difficulty, kind, text, options from questions ${where} order by random() limit ${count}`,
      params
    )).rows as Array<any>;

    // Fallback if specific skill has few questions
    let finalQuestions = rows;
    if (finalQuestions.length < count && skill) {
      const fallbackRows = (await query(
        `select id, domain, subject, topic, skill, difficulty, kind, text, options from questions where tenant_id=$1 and status='active' order by random() limit ${count}`,
        [s.tenantId]
      )).rows as Array<any>;
      finalQuestions = fallbackRows;
    }

    return NextResponse.json({
      attemptId: String(attempt.id),
      questions: finalQuestions.map((q) => ({
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
    });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر تجهيز التحدي' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const b = (await req.json()) as {
      attemptId?: string;
      questionId?: string;
      chosen?: number;
      finish?: boolean;
      timeSpentSeconds?: number;
    };

    const attemptId = String(b.attemptId || '');
    if (!UUID_RE.test(attemptId)) {
      return NextResponse.json({ error: 'معرف التحدي غير صالح' }, { status: 400 });
    }

    const attempt = (await query(
      'select id, answers from attempts where id=$1 and user_id=$2 and tenant_id=$3 and finished_at is null',
      [attemptId, s.userId, s.tenantId]
    )).rows[0] as any;

    if (!attempt) {
      return NextResponse.json({ error: 'التحدي غير موجود أو تم إكماله مسبقاً' }, { status: 404 });
    }

    // Finishing challenge
    if (b.finish) {
      const answers = (attempt.answers || {}) as any;
      const c = (answers.c && typeof answers.c === 'object') ? answers.c : {};
      const ids = Object.keys(c);

      let score = 0;
      if (ids.length > 0) {
        const qs = (await query(
          'select id, correct_index from questions where id = any($1::uuid[]) and tenant_id=$2',
          [ids, s.tenantId]
        )).rows as Array<any>;

        for (const q of qs) {
          if (Number(c[String(q.id)]) === Number(q.correct_index)) {
            score++;
          }
        }
      }

      const total = Math.max(1, ids.length);
      const percent = Math.round((score / total) * 100);

      // Award points (e.g. 5 points per correct answer + 10 bonus for completing)
      const pointsEarned = score * 5 + (percent >= 80 ? 15 : 5);

      await query(
        'update attempts set score=$3, total=$4, finished_at=now() where id=$1 and tenant_id=$2',
        [attemptId, s.tenantId, score, total]
      );

      // Check user streak / points
      try {
        await query(
          'update users set points = coalesce(points, 0) + $1 where id=$2 and tenant_id=$3',
          [pointsEarned, s.userId, s.tenantId]
        );
      } catch {}

      return NextResponse.json({
        score,
        total,
        percent,
        pointsEarned,
        timeSpentSeconds: b.timeSpentSeconds || 0,
      });
    }

    // Recording an answer
    const questionId = String(b.questionId || '');
    if (!UUID_RE.test(questionId) || typeof b.chosen !== 'number') {
      return NextResponse.json({ error: 'بيانات الإجابة غير مكتملة' }, { status: 400 });
    }

    const q = (await query(
      'select id, correct_index, explanation, options from questions where id=$1 and tenant_id=$2',
      [questionId, s.tenantId]
    )).rows[0] as any;

    if (!q) {
      return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });
    }

    const answers = (attempt.answers || {}) as any;
    const c = (answers.c && typeof answers.c === 'object') ? answers.c : {};
    c[questionId] = Number(b.chosen);

    await query(
      'update attempts set answers=$2 where id=$1',
      [attemptId, JSON.stringify({ ...answers, c })]
    );

    const opts = Array.isArray(q.options) ? q.options.map(String) : [];
    const isCorrect = Number(b.chosen) === Number(q.correct_index);

    return NextResponse.json({
      correct: isCorrect,
      correctIndex: Number(q.correct_index),
      explanation: q.explanation || null,
      options: opts,
    });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر معالجة التحدي' }, { status: 500 });
  }
}
