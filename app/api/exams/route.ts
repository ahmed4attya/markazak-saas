import { NextResponse } from 'next/server';
import { query, safeError, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { examInputSchema } from '@/lib/exam-contract';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const teacherFilter = s.role === 'teacher'
    ? 'and exists (select 1 from course_teachers ct where ct.course_id=e.course_id and ct.teacher_user_id=$2)'
    : '';
  const values = isAdminRole(s.role) ? [s.tenantId] : [s.tenantId, s.userId];
  const rows = (await query(
    `select e.id, e.title, e.kind, e.duration_minutes, e.randomize, e.course_id,
            c.name as course_name, e.created_at,
            count(eq.question_id)::int as question_count
     from exams e
     left join courses c on c.id=e.course_id and c.tenant_id=e.tenant_id
     left join exam_questions eq on eq.exam_id=e.id
     where e.tenant_id=$1 ${teacherFilter}
     group by e.id, c.name
     order by e.created_at desc limit 500`,
    values
  )).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const input = examInputSchema.parse(await req.json());
    const questionIds = [...new Set(input.questionIds)];
    if (questionIds.length !== input.questionIds.length) {
      return NextResponse.json({ error: 'لا تكرر السؤال داخل الامتحان' }, { status: 400 });
    }
    if (s.role === 'teacher' && !input.courseId) {
      return NextResponse.json({ error: 'المعلم يربط الامتحان بدورة محددة' }, { status: 400 });
    }
    if (input.courseId && !(await canAccessCourse(s, input.courseId))) {
      return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    }

    const result = await withTx(async (client) => {
      const questions = (await client.query(
        `select id, course_id from questions where tenant_id=$1 and id=any($2::uuid[]) and status='active'`,
        [s.tenantId, questionIds]
      )).rows as Array<{ id: string; course_id: string | null }>;
      if (questions.length !== questionIds.length) {
        throw new Error('بعض الأسئلة غير موجودة داخل هذا المركز');
      }
      if (input.courseId && questions.some((q) => q.course_id !== null && q.course_id !== input.courseId)) {
        throw new Error('كل أسئلة الامتحان يجب أن تنتمي إلى دورته');
      }
      const exam = (await client.query(
        `insert into exams(tenant_id,course_id,title,kind,duration_minutes,randomize,created_by)
         values($1,$2,$3,$4,$5,$6,$7) returning *`,
        [s.tenantId, input.courseId, input.title, input.kind, input.durationMinutes, input.randomize, s.userId]
      )).rows[0];
      for (let i = 0; i < questionIds.length; i++) {
        await client.query(
          'insert into exam_questions(exam_id,question_id,position) values($1,$2,$3)',
          [exam.id, questionIds[i], i]
        );
      }
      return exam;
    });

    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'exam.create', entity: 'exam', entityId: String(result.id) });
    if (input.courseId) {
      const { notifyCourseStudents } = await import('@/lib/notify');
      await notifyCourseStudents(s.tenantId, input.courseId, 'امتحان جديد: ' + input.title, 'أُضيف امتحان جديد إلى دورتك — بالتوفيق!', 'exam');
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, e instanceof Error ? e.message : 'تعذر إنشاء الامتحان') }, { status: 400 });
  }
}
