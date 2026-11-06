import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KZ-${code}`;
}

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get('code') || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: 'كود التحدي مطلوب' }, { status: 400 });
    }

    const examTitle = `CHALLENGE:${code}`;
    const examRes = await query(
      'select id, title, created_by, created_at from exams where tenant_id=$1 and title=$2 limit 1',
      [s.tenantId, examTitle]
    );

    if (examRes.rows.length === 0) {
      return NextResponse.json({ error: 'كود التحدي غير موجود أو انتهت صلاحيته' }, { status: 404 });
    }

    const exam = examRes.rows[0] as any;
    const examId = String(exam.id);

    // Fetch the 5 questions linked to this exam
    const questionsRes = await query(
      `select q.id, q.domain, q.topic, q.skill, q.text, q.options, eq.position 
       from exam_questions eq
       join questions q on q.id = eq.question_id
       where eq.exam_id = $1 and q.tenant_id = $2
       order by eq.position asc`,
      [examId, s.tenantId]
    );

    // Ensure student has an open attempt or get current attempt
    let attempt = (await query(
      'select id, answers, score, total, finished_at from attempts where exam_id=$1 and user_id=$2 and tenant_id=$3 order by started_at desc limit 1',
      [examId, s.userId, s.tenantId]
    )).rows[0] as any;

    if (!attempt) {
      attempt = (await query(
        "insert into attempts(tenant_id, exam_id, user_id, answers, started_at) values($1, $2, $3, $4, now()) returning id, answers, score, total, finished_at",
        [s.tenantId, examId, s.userId, JSON.stringify({ c: {}, startedAt: new Date().toISOString() })]
      )).rows[0];
    }

    // Fetch leaderboard of participants in this challenge
    const leaderboardRes = await query(
      `select a.id, a.user_id, u.name as user_name, a.score, a.total, a.started_at, a.finished_at,
              extract(epoch from (a.finished_at - a.started_at))::int as duration_sec
       from attempts a
       join users u on u.id = a.user_id
       where a.exam_id = $1 and a.tenant_id = $2 and a.finished_at is not null
       order by a.score desc, duration_sec asc limit 10`,
      [examId, s.tenantId]
    );

    return NextResponse.json({
      code,
      examId,
      attemptId: String(attempt.id),
      isFinished: !!attempt.finished_at,
      myScore: attempt.score !== null ? Number(attempt.score) : null,
      myTotal: attempt.total !== null ? Number(attempt.total) : null,
      questions: questionsRes.rows.map((q) => ({
        id: String(q.id),
        domain: q.domain,
        topic: q.topic,
        skill: q.skill,
        text: q.text,
        options: Array.isArray(q.options) ? q.options : [],
      })),
      leaderboard: leaderboardRes.rows.map((r: any) => ({
        userId: String(r.user_id),
        userName: r.user_name || 'طالب',
        score: Number(r.score || 0),
        total: Number(r.total || 5),
        durationSec: Number(r.duration_sec || 0),
        isMe: String(r.user_id) === s.userId,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر جلب تفاصيل التحدي' }, { status: 500 });
  }
}

// POST: Create a new challenge OR Submit answer / Finish attempt
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const b = (await req.json()) as {
      action?: 'create' | 'answer' | 'finish';
      domain?: string;
      code?: string;
      attemptId?: string;
      questionId?: string;
      chosen?: number;
    };

    // ACTION 1: CREATE NEW CHALLENGE
    if (b.action === 'create') {
      const code = generateCode();
      const examTitle = `CHALLENGE:${code}`;

      // Pick 5 random active questions
      const params: any[] = [s.tenantId];
      let domainFilter = '';
      if (b.domain && b.domain !== 'all') {
        params.push(b.domain);
        domainFilter = ' and domain=$' + params.length;
      }

      const questionsRes = await query(
        `select id from questions where tenant_id=$1 and status='active' ${domainFilter} order by random() limit 5`,
        params
      );

      if (questionsRes.rows.length < 5) {
        // Fallback to any questions
        const fallback = await query(
          "select id from questions where tenant_id=$1 and status='active' order by random() limit 5",
          [s.tenantId]
        );
        questionsRes.rows = fallback.rows;
      }

      if (questionsRes.rows.length === 0) {
        return NextResponse.json({ error: 'لا تتوفر أسئلة كافية لإنشاء التحدي' }, { status: 400 });
      }

      // Create Exam
      const examRes = await query(
        "insert into exams(tenant_id, title, kind, randomize, created_by) values($1, $2, 'challenge', false, $3) returning id",
        [s.tenantId, examTitle, s.userId]
      );
      const examId = String(examRes.rows[0].id);

      // Link questions
      for (let i = 0; i < questionsRes.rows.length; i++) {
        await query(
          'insert into exam_questions(exam_id, question_id, position) values($1, $2, $3)',
          [examId, String(questionsRes.rows[i].id), i + 1]
        );
      }

      return NextResponse.json({ code, examId });
    }

    // ACTION 2: ANSWER A QUESTION
    if (b.action === 'answer') {
      const attemptId = String(b.attemptId || '');
      const questionId = String(b.questionId || '');
      if (!UUID_RE.test(attemptId) || !UUID_RE.test(questionId) || typeof b.chosen !== 'number') {
        return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
      }

      const qRes = await query(
        'select id, correct_index, explanation, options from questions where id=$1 and tenant_id=$2',
        [questionId, s.tenantId]
      );
      if (qRes.rows.length === 0) return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });
      const q = qRes.rows[0] as any;

      const attemptRes = await query(
        'select id, answers from attempts where id=$1 and user_id=$2 and tenant_id=$3 and finished_at is null',
        [attemptId, s.userId, s.tenantId]
      );
      if (attemptRes.rows.length === 0) return NextResponse.json({ error: 'المحاولة منتهية' }, { status: 404 });

      const attempt = attemptRes.rows[0] as any;
      const answers = attempt.answers || {};
      const c = (answers.c && typeof answers.c === 'object') ? answers.c : {};
      c[questionId] = Number(b.chosen);

      await query('update attempts set answers=$2 where id=$1', [attemptId, JSON.stringify({ ...answers, c })]);

      return NextResponse.json({
        correct: Number(b.chosen) === Number(q.correct_index),
        correctIndex: Number(q.correct_index),
        explanation: q.explanation || null,
      });
    }

    // ACTION 3: FINISH CHALLENGE ATTEMPT
    if (b.action === 'finish') {
      const attemptId = String(b.attemptId || '');
      if (!UUID_RE.test(attemptId)) return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });

      const attemptRes = await query(
        'select id, exam_id, answers from attempts where id=$1 and user_id=$2 and tenant_id=$3 and finished_at is null',
        [attemptId, s.userId, s.tenantId]
      );
      if (attemptRes.rows.length === 0) return NextResponse.json({ error: 'المحاولة منتهية بالفعل' }, { status: 404 });
      const attempt = attemptRes.rows[0] as any;

      const answers = attempt.answers || {};
      const c = (answers.c && typeof answers.c === 'object') ? answers.c : {};
      const ids = Object.keys(c);

      let score = 0;
      if (ids.length > 0) {
        const qs = (await query(
          'select id, correct_index from questions where id = any($1::uuid[]) and tenant_id=$2',
          [ids, s.tenantId]
        )).rows as Array<any>;

        for (const q of qs) {
          if (Number(c[String(q.id)]) === Number(q.correct_index)) score++;
        }
      }

      const total = Math.max(1, ids.length);
      await query(
        'update attempts set score=$2, total=$3, finished_at=now() where id=$1 and tenant_id=$4',
        [attemptId, score, total, s.tenantId]
      );

      // Reward points
      try {
        await query('update users set points = coalesce(points, 0) + $1 where id=$2 and tenant_id=$3', [score * 10 + 20, s.userId, s.tenantId]);
      } catch {}

      return NextResponse.json({ score, total });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر معالجة طلب التحدي' }, { status: 500 });
  }
}
