import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse, teacherCourseIds } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

// Scope 5: assignments (staff view). Teachers see only their courses (course_teachers).
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const teacherFilter = s.role === 'teacher'
    ? 'and exists (select 1 from course_teachers ct where ct.course_id = a.course_id and ct.teacher_user_id = $2)'
    : '';
  const values = isAdminRole(s.role) ? [s.tenantId] : [s.tenantId, s.userId];
  const rows = (await query(
    `select a.id, a.title, a.description, a.due_date, a.max_score, a.course_id, a.group_id,
            c.name as course_name, g.name as group_name, a.created_at,
            (select count(*)::int from submissions sub where sub.assignment_id = a.id and sub.submitted_at is not null) as submitted_count,
            (select count(*)::int from submissions sub2 where sub2.assignment_id = a.id and sub2.graded_at is not null) as graded_count
     from assignments a
     left join courses c on c.id = a.course_id
     left join groups g on g.id = a.group_id
     where a.tenant_id = $1 ${teacherFilter}
     order by a.created_at desc limit 300`,
    values
  )).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const b = (await req.json()) as { title?: string; courseId?: string; groupId?: string; description?: string; dueDate?: string; maxScore?: number };
    const title = typeof b.title === 'string' ? b.title.trim() : '';
    const courseId = typeof b.courseId === 'string' ? b.courseId : '';
    if (title.length < 2) return NextResponse.json({ error: 'عنوان الواجب مطلوب' }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: 'الواجب مرتبط بدورة' }, { status: 400 });
    if (!(await canAccessCourse(s, courseId))) return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    const maxScore = typeof b.maxScore === 'number' && b.maxScore > 0 ? Math.min(1000, b.maxScore) : 100;
    const dueDate = typeof b.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.dueDate) ? b.dueDate : null;
    const groupId = typeof b.groupId === 'string' && b.groupId ? b.groupId : null;
    if (groupId) {
      const g = (await query('select id from groups where id=$1 and tenant_id=$2 and course_id=$3', [groupId, s.tenantId, courseId])).rows;
      if (!g.length) return NextResponse.json({ error: 'المجموعة لا تنتمي لهذه الدورة' }, { status: 400 });
    }
    const ins = (await query(
      `insert into assignments(tenant_id,course_id,group_id,title,description,due_date,max_score,created_by)
       values($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [s.tenantId, courseId, groupId, title, b.description || null, dueDate, maxScore, s.userId]
    )).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'assignment.create', entity: 'assignment', entityId: String(ins.id) });
    {
      const { notifyCourseStudents } = await import('@/lib/notify');
      await notifyCourseStudents(s.tenantId, courseId, 'واجب جديد: ' + title, 'أُضيف واجب جديد إلى دورتك' + (dueDate ? ' — التسليم ' + dueDate : '') + '.', 'assignment');
    }
    return NextResponse.json(ins, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر إنشاء الواجب') }, { status: 400 });
  }
}
