import { NextResponse } from 'next/server';
import { query, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';
import { canAccessCourse } from '@/lib/access';
import {
  REAL_TAHSILI_BLUEPRINT,
  REAL_QUDURAT_BLUEPRINT,
  buildPredictiveModel,
  type BaseQuestion,
} from '@/lib/question-engine';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      track: 'TAHSILI' | 'QUDURAT';
      modelNumber?: number;
      courseId?: string;
      customTitle?: string;
      excludePreviousExamQuestions?: boolean;
    };

    const track = body.track || 'TAHSILI';
    const modelNum = Math.max(Number(body.modelNumber) || 1, 1);
    const courseId = body.courseId || null;
    const excludePrevious = body.excludePreviousExamQuestions !== false;

    if (courseId && !(await canAccessCourse(s, courseId))) {
      return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    }

    // 1. Fetch used question IDs if excluding previous
    const usedIdsSet = new Set<string>();
    if (excludePrevious) {
      const usedRows = (
        await query(
          `select distinct question_id 
           from exam_questions eq 
           join exams e on e.id = eq.exam_id 
           where e.tenant_id = $1`,
          [s.tenantId]
        )
      ).rows;
      usedRows.forEach((r: any) => usedIdsSet.add(r.question_id));
    }

    // 2. Fetch question pool based on track
    const domainFilter = track === 'TAHSILI' ? "domain = 'achievement'" : "domain in ('quant', 'verbal')";
    const poolRows = (
      await query(
        `select id, domain, subject, topic, skill, difficulty, text, options, correct_index, explanation, image_url, passage
         from questions
         where tenant_id = $1 and status = 'active' and ${domainFilter}`,
        [s.tenantId]
      )
    ).rows as BaseQuestion[];

    if (poolRows.length === 0) {
      return NextResponse.json({ error: 'لا توجد أسئلة كافية في بنك الأسئلة لهذا المسار' }, { status: 400 });
    }

    // 3. Select blueprint
    const blueprint = track === 'TAHSILI' ? REAL_TAHSILI_BLUEPRINT : REAL_QUDURAT_BLUEPRINT;

    // 4. Generate predictive model
    const generated = buildPredictiveModel(poolRows, blueprint, usedIdsSet);
    const allSelectedQuestions = generated.sections.flatMap((sec) => sec.questions);

    if (allSelectedQuestions.length === 0) {
      return NextResponse.json({ error: 'تعذر توليد أسئلة غير مكررة، تم استهلاك بنك الأسئلة المتاح' }, { status: 400 });
    }

    const defaultTitle =
      track === 'TAHSILI'
        ? `التحصيلي المحاكي — النموذج ${modelNum} (معايير قياس الواقعية - 110 أسئلة)`
        : `القدرات المحوسب — النموذج ${modelNum} (معايير قياس الواقعية - 96 سؤالاً)`;

    const examTitle = body.customTitle || defaultTitle;
    const durationMinutes = track === 'TAHSILI' ? 125 : 100;

    // 5. Insert exam and exam_questions transactionally
    const examRecord = await withTx(async (client) => {
      const insExam = await client.query(
        `insert into exams(tenant_id, course_id, title, kind, duration_minutes, randomize, sections)
         values($1, $2, $3, 'real_simulation', $4, true, $5)
         returning id, title, duration_minutes, created_at`,
        [
          s.tenantId,
          courseId,
          examTitle,
          durationMinutes,
          JSON.stringify(
            generated.sections.map((sec) => ({
              nameAr: sec.blueprint.nameAr,
              timeMinutes: sec.blueprint.timeMinutes,
              questionCount: sec.questions.length,
            }))
          ),
        ]
      );
      const examId = insExam.rows[0].id;

      // Insert questions in order
      for (let i = 0; i < allSelectedQuestions.length; i++) {
        await client.query(
          `insert into exam_questions(exam_id, question_id, position)
           values($1, $2, $3)
           on conflict (exam_id, question_id) do nothing`,
          [examId, allSelectedQuestions[i].id, i + 1]
        );
      }

      return insExam.rows[0];
    });

    return NextResponse.json({
      ok: true,
      exam: examRecord,
      totalQuestions: allSelectedQuestions.length,
      sectionsCount: generated.sections.length,
      track,
      modelNumber: modelNum,
    });
  } catch (e: any) {
    console.error('[PREDICTIVE_EXAM_GEN_ERROR]', e?.message || e);
    return NextResponse.json({ error: 'تعذر توليد النموذج المحاكي' }, { status: 500 });
  }
}
