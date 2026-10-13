import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { assignmentInputSchema } from '@/lib/assignment-contract';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role === 'student' || s.role === 'guardian') {
    const linkColumn = s.role === 'student' ? 'student_user_id' : 'guardian_user_id';
    const rows = (await query(
      `select distinct a.id,a.title,a.description,a.due_at,a.points,a.course_id,c.name as course_name,
              st.id as student_id,st.name as student_name,sub.id as submission_id,sub.submitted_at,sub.grade,sub.feedback
       from students st join enrollments en on en.student_id=st.id and en.tenant_id=st.tenant_id and en.status='active'
       join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id
       join assignments a on a.course_id=g.course_id and a.tenant_id=st.tenant_id
       join courses c on c.id=a.course_id and c.tenant_id=a.tenant_id
       left join submissions sub on sub.assignment_id=a.id and sub.student_id=st.id and sub.tenant_id=st.tenant_id
       where st.tenant_id=$1 and st.${linkColumn}=$2 order by st.name,a.due_at nulls last,a.created_at desc`,
      [s.tenantId, s.userId]
    )).rows;
    return NextResponse.json(rows);
  }
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const teacherFilter = s.role === 'teacher' ? 'and exists(select 1 from course_teachers ct where ct.course_id=a.course_id and ct.teacher_user_id=$2)' : '';
  const values = s.role === 'teacher' ? [s.tenantId, s.userId] : [s.tenantId];
  return NextResponse.json((await query(
    `select a.*,c.name as course_name,g.name as group_name,count(sub.id)::int as submission_count
     from assignments a join courses c on c.id=a.course_id and c.tenant_id=a.tenant_id
     left join groups g on g.id=a.group_id and g.tenant_id=a.tenant_id
     left join submissions sub on sub.assignment_id=a.id and sub.tenant_id=a.tenant_id
     where a.tenant_id=$1 ${teacherFilter} group by a.id,c.name,g.name order by a.created_at desc`, values
  )).rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const input = assignmentInputSchema.parse(await req.json());
    if (!(await canAccessCourse(s, input.courseId))) return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    if (input.groupId) {
      const group = await query('select 1 from groups where id=$1 and tenant_id=$2 and course_id=$3', [input.groupId, s.tenantId, input.courseId]);
      if (!group.rows.length) return NextResponse.json({ error: 'المجموعة لا تنتمي إلى الدورة' }, { status: 400 });
    }
    const row = (await query(
      `insert into assignments(tenant_id,course_id,group_id,title,description,due_at,points,created_by) values($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [s.tenantId,input.courseId,input.groupId,input.title,input.description,input.dueAt,input.points,s.userId]
    )).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'assignment.create', entity: 'assignment', entityId: String(row.id) });
    return NextResponse.json(row, { status: 201 });
  } catch (e) { return NextResponse.json({ error: safeError(e, e instanceof Error ? e.message : 'تعذر إنشاء الواجب') }, { status: 400 }); }
}
