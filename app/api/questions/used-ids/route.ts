import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const courseId = (searchParams.get('courseId') || '').trim();

    // 1. Used in exams for this tenant (and course if specified)
    const examValues: any[] = [s.tenantId];
    let examCourseFilter = '';
    if (courseId) {
      examValues.push(courseId);
      examCourseFilter = `and e.course_id = $${examValues.length}`;
    }

    const examSql = `
      select distinct eq.question_id::text as id
      from exam_questions eq
      join exams e on e.id = eq.exam_id
      where e.tenant_id = $1 ${examCourseFilter}
    `;
    const examRows = (await query(examSql, examValues)).rows;
    const examUsedIds = examRows.map((r) => r.id);

    // 2. Used in assignments for this tenant (and course if specified)
    const assignValues: any[] = [s.tenantId];
    let assignCourseFilter = '';
    if (courseId) {
      assignValues.push(courseId);
      assignCourseFilter = `and a.course_id = $${assignValues.length}`;
    }

    const assignSql = `
      select distinct jsonb_array_elements_text(a.question_ids) as id
      from assignments a
      where a.tenant_id = $1
        and a.question_ids is not null
        and jsonb_array_length(a.question_ids) > 0
        ${assignCourseFilter}
    `;
    const assignRows = (await query(assignSql, assignValues)).rows;
    const assignUsedIds = assignRows.map((r) => r.id);

    // Union of all used IDs
    const allUsedSet = new Set<string>([...examUsedIds, ...assignUsedIds]);

    return NextResponse.json({
      usedIds: Array.from(allUsedSet),
      examUsedIds,
      assignmentUsedIds: assignUsedIds,
      totalUsed: allUsedSet.size,
    });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر جلب الأسئلة المستخدمة') }, { status: 500 });
  }
}
