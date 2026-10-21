import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

// "لماذا أخطأت؟" - AI explanation of a wrong answer for a FINISHED own attempt.
// The prompt is built SERVER-SIDE from the DB; the client only sends ids.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rl = await rateLimit('ai-explain:' + s.userId, 20, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'محاولات كثيرة — انتظر قليلا' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } });

  const b = (await req.json().catch(() => ({}))) as { attemptId?: string; questionId?: string };
  const attemptId = String(b.attemptId || '');
  const questionId = String(b.questionId || '');
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(attemptId) || !UUID_RE.test(questionId)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  const ownerFilter = s.role === 'student'
    ? 'a.user_id = $3'
    : 'exists (select 1 from students st where st.user_id = a.user_id and st.guardian_user_id = $3)';
  const attempt = (await query(
    `select a.id, a.exam_id, a.answers from attempts a
     where a.id=$1 and a.tenant_id=$2 and ${ownerFilter} and a.finished_at is not null`,
    [attemptId, s.tenantId, s.userId]
  )).rows[0] as any;
  if (!attempt) return NextResponse.json({ error: 'النتيجة غير متاحة' }, { status: 404 });

  const q = (await query(
    `select q.id, q.text, q.options, q.correct_index, q.explanation from exam_questions eq
     join questions q on q.id = eq.question_id and q.tenant_id=$2
     where eq.exam_id=$1 and q.id=$3`,
    [attempt.exam_id, s.tenantId, questionId]
  )).rows[0] as any;
  if (!q) return NextResponse.json({ error: 'السؤال غير موجود في هذا الامتحان' }, { status: 404 });

  const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
  const letter = (i: number) => LETTERS[i] ?? String(i + 1);
  const opts: string[] = Array.isArray(q.options) ? (q.options as unknown[]).map((o: unknown) => String(o)) : [];
  const ans = (attempt.answers || {}) as any;
  const chosen = ans.c && Object.prototype.hasOwnProperty.call(ans.c, q.id) ? Number(ans.c[q.id]) : null;
  const correctIdx = Number(q.correct_index);

  const prompt = [
    'اشرح لطالب لماذا كانت إجابته خاطئة في سؤال اختيار من متعدد، بالعربية الواضحة، في 3-5 أسطر.',
    'اذكر أولاً الخطأ المفاهيمي، ثم الإجابة الصحيحة ولماذا هي صحيحة، ثم نصيحة قصيرة للمراجعة.',
    '',
    'السؤال: ' + q.text,
    ...opts.map((o, i) => letter(i) + ') ' + o),
    'إجابة الطالب: ' + (chosen === null ? 'لم يجب' : letter(chosen) + ') ' + (opts[chosen] ?? '')),
    'الإجابة الصحيحة: ' + letter(correctIdx) + ') ' + (opts[correctIdx] ?? ''),
    q.explanation ? 'الشرح المرجعي: ' + q.explanation : '',
  ].filter(Boolean).join('\n');

  if (process.env.AI_API_URL && process.env.AI_API_KEY) {
    try {
      const response = await fetch(process.env.AI_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.AI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            { role: 'system', content: 'أنت معلم قدرات وتحصيلي خبير. اشرح بالعربية بأسلوب محفز ومباشر، بلا مقدمات زائدة.' },
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (response.ok) {
        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content || data?.answer || data?.output_text;
        if (answer) return NextResponse.json({ answer, source: 'external-ai' });
      }
    } catch {
      // fall through to internal explanation
    }
  }

  const internal = q.explanation
    ? 'الشرح المرجعي:\n' + q.explanation
    : 'الإجابة الصحيحة هي: ' + letter(correctIdx) + ') ' + (opts[correctIdx] ?? '') + ' — راجع الموضوع ثم أعد المحاولة.';
  return NextResponse.json({ answer: internal, source: 'internal' });
}



