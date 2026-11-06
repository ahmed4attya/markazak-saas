import { NextRequest, NextResponse } from 'next/server';
import { query, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import type { ParsedQ } from '@/lib/pdf-questions';

const sanitize = (s: unknown) =>
  typeof s === 'string'
    ? s.replace(/\u0000/g, '').replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    : '';

const AR_KEY_TO_INDEX: Record<string, number> = {
  'أ': 0, 'ا': 0, 'A': 0, 'a': 0, '1': 0,
  'ب': 1, 'B': 1, 'b': 1, '2': 1,
  'ج': 2, 'C': 2, 'c': 2, '3': 2,
  'د': 3, 'D': 3, 'd': 3, '4': 3,
  'هـ': 4, 'ه': 4, 'E': 4, 'e': 4, '5': 4,
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  const questions = (raw?.questions || []) as (ParsedQ & { image_url?: string })[];
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'لا توجد أسئلة للحفظ' }, { status: 400 });
  }
  if (questions.length > 500) {
    return NextResponse.json({ error: 'الحد الأقصى 500 سؤال في الدفعة الواحدة' }, { status: 400 });
  }

  const domain = sanitize(raw?.domain || 'quant').toLowerCase();
  const validDomains = ['quant', 'verbal', 'achievement', 'other'];
  const finalDomain = validDomains.includes(domain) ? domain : 'quant';
  const courseId = raw?.courseId ? String(raw.courseId) : null;
  const skill = sanitize(raw?.skill || '') || null;
  const fileName = sanitize(raw?.fileName || 'استيراد جديد').slice(0, 200);

  // Clean each question (including passage & image_url)
  const cleaned = questions
    .map((q) => {
      const body = sanitize(q?.body).trim();
      const options = (Array.isArray(q?.options) ? q.options : [])
        .map((o) => sanitize(o?.text).trim())
        .filter(Boolean);
      let correctIndex = 0;
      if (q?.answerKey && AR_KEY_TO_INDEX[q.answerKey] !== undefined) {
        correctIndex = AR_KEY_TO_INDEX[q.answerKey];
      }
      if (correctIndex >= options.length) correctIndex = 0;
      const passage = sanitize(q?.passage || '').trim() || null;
      const imageUrl = sanitize(q?.imageUrl || q?.image_url || '').trim() || null;
      return { body, options, correctIndex, passage, imageUrl };
    })
    .filter((q) => q.body.length > 5 && q.options.length >= 2);

  if (cleaned.length === 0) {
    return NextResponse.json({ error: 'لا توجد أسئلة صالحة بعد التنظيف' }, { status: 400 });
  }

  // Check for duplicates within tenant
  const bodies = cleaned.map((q) => q.body);
  const existingRes = await query<{ text: string }>(
    'select text from questions where tenant_id=$1 and text = ANY($2)',
    [session.tenantId, bodies]
  );
  const dupSet = new Set(existingRes.rows.map((r) => r.text));
  const fresh = cleaned.filter((q) => !dupSet.has(q.body));

  if (fresh.length === 0) {
    return NextResponse.json({
      ok: true,
      created: 0,
      duplicates: cleaned.length,
      message: 'جميع الأسئلة موجودة بالفعل في بنك الأسئلة لهذا المركز',
    });
  }

  // Insert fresh questions with status='review' (Drafts)
  const insertedCount = await withTx(async (client) => {
    let count = 0;
    for (const q of fresh) {
      await client.query(
        `insert into questions(
          tenant_id, course_id, domain, skill, text, options, correct_index, status, created_by, passage, image_url
        ) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          session.tenantId,
          courseId,
          finalDomain,
          skill,
          q.body,
          JSON.stringify(q.options),
          q.correctIndex,
          'review', // always lands as review (مسودة)
          session.userId,
          q.passage,
          q.imageUrl,
        ]
      );
      count++;
    }
    return count;
  });

  const withPassageCount = fresh.filter((q) => q.passage).length;
  const withImageCount = fresh.filter((q) => q.imageUrl).length;

  await logAudit({
    tenantId: session.tenantId,
    userId: session.userId,
    action: 'question.bulk_import',
    entity: 'question',
    metadata: {
      source: fileName,
      totalReceived: questions.length,
      created: insertedCount,
      duplicates: cleaned.length - fresh.length,
      withPassage: withPassageCount,
      withImage: withImageCount,
      status: 'review',
    },
  });

  return NextResponse.json({
    ok: true,
    created: insertedCount,
    duplicates: cleaned.length - fresh.length,
    withPassage: withPassageCount,
    withImage: withImageCount,
    fileName,
  });
}
