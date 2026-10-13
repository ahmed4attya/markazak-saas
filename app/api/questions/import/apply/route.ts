import { NextResponse } from 'next/server';
import { withTx, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { parseQuestionCsv } from '@/lib/question-import';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const body = await req.json() as { csv?: unknown; courseId?: unknown };
    const csv = typeof body.csv === 'string' ? body.csv : '';
    const fallbackCourseId = typeof body.courseId === 'string' && body.courseId ? body.courseId : null;
    if (!csv.trim()) return NextResponse.json({ error: 'ملف CSV مطلوب' }, { status: 400 });
    const parsed = parseQuestionCsv(csv);
    if (!parsed.length) return NextResponse.json({ error: 'لا توجد صفوف قابلة للاستيراد' }, { status: 400 });
    if (parsed.length > 1000) return NextResponse.json({ error: 'الحد الأعلى للاستيراد 1000 سؤال في العملية الواحدة' }, { status: 400 });
    const ready = parsed.filter((row) => row.status === 'READY');
    if (!ready.length) return NextResponse.json({ error: 'لا توجد صفوف سليمة للتطبيق', total: parsed.length, disabled: parsed.length }, { status: 400 });

    const rows = ready.map((row) => ({ ...row, effectiveCourseId: row.courseId || fallbackCourseId }));
    for (const row of rows) {
      if (!row.effectiveCourseId && !isAdminRole(s.role)) return NextResponse.json({ error: `السطر ${row.row}: يجب تحديد دورة للمعلم` }, { status: 403 });
      if (row.effectiveCourseId && !(await canAccessCourse(s, row.effectiveCourseId))) return NextResponse.json({ error: `السطر ${row.row}: غير مصرح بالدورة` }, { status: 403 });
    }

    const inserted = await withTx(async (client) => {
      const ids: string[] = [];
      for (const row of rows) {
        const result = await client.query<{ id: string }>(
          `insert into questions(tenant_id,course_id,domain,subject,topic,skill,difficulty,kind,text,options,correct_index,explanation,created_by)
           values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning id`,
          [s.tenantId, row.effectiveCourseId, row.domain, row.subject, row.topic, row.skill, row.difficulty, 'mcq', row.text, JSON.stringify(row.options), row.correctIndex, row.explanation, s.userId]
        );
        ids.push(result.rows[0].id);
      }
      return ids;
    });
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'question.import', entity: 'question', metadata: { count: inserted.length, disabled: parsed.length - ready.length } });
    return NextResponse.json({ inserted: inserted.length, disabled: parsed.length - ready.length, ids: inserted }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر تطبيق الاستيراد') }, { status: 400 });
  }
}
