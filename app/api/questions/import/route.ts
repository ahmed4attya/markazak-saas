import { NextResponse } from 'next/server';
import { safeError, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { rateLimit } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';
import { parseCsv } from '@/lib/csv';

// Scope 4C: bulk CSV question import with QA fingerprints.
// Figure-suspect rows land with status='review' (disabled-from-taking) - never silently active.
const DOMAINS = ['quant', 'verbal', 'achievement', 'other'];
const FIGURE_WORDS = ['شكل', 'رسم', 'مدرج', 'بياني', 'مبيان', 'المعطى في', 'graph', 'figure', 'chart', 'diagram'];
const KNOWN = new Set(['domain', 'subject', 'topic', 'skill', 'difficulty', 'kind', 'text', 'o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'correct', 'explanation']);
const HEADER_MAP: Record<string, string> = {
  domain: 'domain', 'المجال': 'domain', 'التصنيف': 'domain',
  subject: 'subject', 'المادة': 'subject',
  topic: 'topic', 'الموضوع': 'topic',
  skill: 'skill', 'المهارة': 'skill',
  difficulty: 'difficulty', 'الصعوبة': 'difficulty',
  kind: 'kind', 'النوع': 'kind',
  text: 'text', 'النص': 'text', 'السؤال': 'text',
  option1: 'o1', option2: 'o2', option3: 'o3', option4: 'o4', option5: 'o5', option6: 'o6',
  'خيار1': 'o1', 'خيار2': 'o2', 'خيار3': 'o3', 'خيار4': 'o4', 'خيار5': 'o5', 'خيار6': 'o6',
  correct_index: 'correct', correctindex: 'correct', 'الإجابة': 'correct', 'رقم_الإجابة': 'correct',
  explanation: 'explanation', 'الشرح': 'explanation', 'التعليل': 'explanation',
};

function isFigureSuspect(s: string): boolean {
  const t = s.toLowerCase();
  return FIGURE_WORDS.some((w) => t.includes(w.toLowerCase()));
}

type Detail = { line: number; status: 'imported' | 'review' | 'rejected'; reason: string };

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rl = await rateLimit('qimport:' + s.userId, 5, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'محاولات كثيرة — انتظر قليلا' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } });

  try {
    const b = (await req.json()) as { csv?: string; courseId?: string | null; defaultDomain?: string };
    const csv = typeof b.csv === 'string' ? b.csv : '';
    if (!csv.trim()) return NextResponse.json({ error: 'الصق محتوى CSV أو اختر ملفاً' }, { status: 400 });
    if (csv.length > 2_000_000) return NextResponse.json({ error: 'الملف أكبر من الحد (2MB)' }, { status: 400 });
    const courseId = b.courseId || null;
    if (courseId) {
      if (!(await canAccessCourse(s, courseId))) return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    } else if (!isAdminRole(s.role)) {
      return NextResponse.json({ error: 'الاستيراد العام للمدير فقط — اربطه بدورة' }, { status: 403 });
    }

    const rows = parseCsv(csv);
    if (rows.length < 2) return NextResponse.json({ error: 'الملف يجب أن يحوي ترويسة وسطر بيانات واحداً على الأقل' }, { status: 400 });
    if (rows.length - 1 > 500) return NextResponse.json({ error: 'الحد الأقصى 500 سطر لكل دفعة' }, { status: 400 });

    const header = rows[0].map((h) => HEADER_MAP[h.trim().toLowerCase().replace(/[\s-]+/g, '')] ?? h.trim());
    const details: Detail[] = [];
    const valid: Array<{ domain: string; subject: string | null; topic: string | null; skill: string | null; difficulty: number; kind: string; text: string; options: string[]; correct: number; explanation: string | null; status: 'active' | 'review' }> = [];

    for (let li = 1; li < rows.length; li++) {
      const lineNo = li + 1;
      const cells = rows[li];
      const rec: Record<string, string> = {};
      header.forEach((h, idx) => { if (KNOWN.has(h)) rec[h] = (cells[idx] || '').trim(); });

      const text = rec.text || '';
      if (!text) { details.push({ line: lineNo, status: 'rejected', reason: 'نص السؤال مفقود' }); continue; }
      const options = [rec.o1, rec.o2, rec.o3, rec.o4, rec.o5, rec.o6].filter((x) => x && x !== '');
      if (options.length < 2) { details.push({ line: lineNo, status: 'rejected', reason: 'الخيارات أقل من اثنين' }); continue; }
      const correct = Number(rec.correct);
      if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
        details.push({ line: lineNo, status: 'rejected', reason: 'رقم الإجابة غير صالح (0-' + (options.length - 1) + ')' });
        continue;
      }
      const domain = (rec.domain || b.defaultDomain || 'quant').toLowerCase();
      if (DOMAINS.indexOf(domain) < 0) { details.push({ line: lineNo, status: 'rejected', reason: 'المجال غير صالح (quant/verbal/achievement)' }); continue; }
      const difficulty = Math.min(5, Math.max(1, Math.round(Number(rec.difficulty) || 3)));
      const kind = rec.kind === 'truefalse' ? 'truefalse' : 'mcq';
      const suspect = isFigureSuspect(text + ' ' + options.join(' '));
      const status: 'active' | 'review' = suspect ? 'review' : 'active';
      valid.push({
        domain, subject: rec.subject || null, topic: rec.topic || null, skill: rec.skill || null,
        difficulty, kind, text, options, correct, explanation: rec.explanation || null, status,
      });
      details.push({
        line: lineNo,
        status: suspect ? 'review' : 'imported',
        reason: suspect ? 'يذكر شكلاً أو رسمة — يُراجع مقابل المصدر قبل التفعيل' : '',
      });
    }

    if (!valid.length) {
      return NextResponse.json({ total: rows.length - 1, imported: 0, review: 0, rejected: details.filter((d) => d.status === 'rejected').length, details });
    }

    const imported = await withTx(async (client) => {
      let n = 0;
      for (const v of valid) {
        await client.query(
          `insert into questions(tenant_id,course_id,domain,subject,topic,skill,difficulty,kind,text,options,correct_index,explanation,status,created_by)
           values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14)`,
          [s.tenantId, courseId, v.domain, v.subject, v.topic, v.skill, v.difficulty, v.kind, v.text, JSON.stringify(v.options), v.correct, v.explanation, v.status, s.userId]
        );
        n++;
      }
      return n;
    });

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'question.import',
      entity: 'question',
      metadata: { imported, review: valid.filter((v) => v.status === 'review').length, rejected: details.filter((d) => d.status === 'rejected').length, courseId },
    });

    return NextResponse.json({
      total: rows.length - 1,
      imported: details.filter((d) => d.status === 'imported').length,
      review: details.filter((d) => d.status === 'review').length,
      rejected: details.filter((d) => d.status === 'rejected').length,
      details,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر الاستيراد') }, { status: 400 });
  }
}



