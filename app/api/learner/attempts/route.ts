import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (s.role === 'student') {
    const rows = (await query(
      `select a.*, e.title as exam_title from attempts a join exams e on e.id = a.exam_id where a.user_id = $1 and a.tenant_id = $2 order by a.started_at desc limit 50`,
      [s.userId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  const rows = (await query(
    `select a.*, e.title as exam_title, st.name as student_name from attempts a
     join exams e on e.id = a.exam_id
     join students st on st.user_id = a.user_id
     where st.guardian_user_id = $1 and a.tenant_id = $2
     order by a.started_at desc limit 50`,
    [s.userId, s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// POST: start (or resume) an attempt - returns the taking payload WITHOUT answers
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { examId?: string };
  const examId = String(b.examId || '');
  if (!UUID_RE.test(examId)) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const exam = (await query(
    `select e.id, e.title, e.kind, e.duration_minutes, e.randomize from exams e
     where e.id=$1 and e.tenant_id=$2 and e.course_id is not null
       and exists (
         select 1 from enrollments en
         join groups g on g.id = en.group_id
         join students st on st.id = en.student_id
         where g.course_id = e.course_id and st.user_id = $3 and en.tenant_id = $2 and en.status = 'active'
       )`,
    [examId, s.tenantId, s.userId]
  )).rows[0] as any;
  if (!exam) return NextResponse.json({ error: 'الامتحان غير متاح لك' }, { status: 404 });

  const existing = (await query(
    `select id, answers, started_at from attempts where user_id=$1 and exam_id=$2 and tenant_id=$3 and finished_at is null order by started_at desc limit 1`,
    [s.userId, examId, s.tenantId]
  )).rows[0] as any;

  let attemptId: string;
  let startedAt: string;
  let saved: { order: string[]; c: Record<string, number> } = { order: [], c: {} };

  if (existing) {
    attemptId = String(existing.id);
    startedAt = new Date(existing.started_at).toISOString();
    const ans = (existing.answers || {}) as any;
    saved = { order: Array.isArray(ans.order) ? ans.order.map(String) : [], c: ans.c && typeof ans.c === 'object' ? ans.c : {} };
  } else {
    const created = (await query(
      `insert into attempts(tenant_id,exam_id,user_id,answers,started_at) values($1,$2,$3,$4,now()) returning id, started_at`,
      [s.tenantId, examId, s.userId, JSON.stringify({ order: [], c: {} })]
    )).rows[0];
    attemptId = String(created.id);
    startedAt = new Date(created.started_at).toISOString();
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'exam.start', entity: 'exam', entityId: examId });
  }

  const qs = (await query(
    `select q.id, q.kind, q.text, q.options from exam_questions eq join questions q on q.id=eq.question_id and q.tenant_id=$2 where eq.exam_id=$1 order by eq.position`,
    [examId, s.tenantId]
  )).rows as Array<{ id: string; kind: string; text: string; options: any }>;

  if (!existing || saved.order.length !== qs.length) {
    const ordered = exam.randomize ? shuffle(qs) : qs;
    saved.order = ordered.map((x) => x.id);
    await query(`update attempts set answers=$2 where id=$1`, [attemptId, JSON.stringify(saved)]);
  }
  const byId = new Map(qs.map((x) => [x.id, x]));
  const questions = saved.order.map((id) => byId.get(id)).filter((x): x is typeof qs[number] => Boolean(x));

  return NextResponse.json({
    attemptId,
    resumed: Boolean(existing),
    exam: { id: exam.id, title: exam.title, kind: exam.kind, duration_minutes: exam.duration_minutes },
    questions: questions.map((q) => ({ id: q.id, kind: q.kind, text: q.text, options: Array.isArray(q.options) ? q.options : [] })),
    saved,
    startedAt,
  });
}

// PATCH: autosave choices for an unfinished own attempt
export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { attemptId?: string; c?: Record<string, number> };
  const attemptId = String(b.attemptId || '');
  if (!UUID_RE.test(attemptId) || !b.c || typeof b.c !== 'object' || Array.isArray(b.c)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  const row = (await query(
    `select answers from attempts where id=$1 and user_id=$2 and tenant_id=$3 and finished_at is null`,
    [attemptId, s.userId, s.tenantId]
  )).rows[0] as any;
  if (!row) return NextResponse.json({ error: 'المحاولة غير موجودة أو منتهية' }, { status: 404 });
  const ans = (row.answers || {}) as any;
  const next = { order: Array.isArray(ans.order) ? ans.order.map(String) : [], c: b.c };
  await query(`update attempts set answers=$2 where id=$1`, [attemptId, JSON.stringify(next)]);
  return NextResponse.json({ ok: true });
}