import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';
import { teacherCourseIds } from '@/lib/access';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const courseId = new URL(req.url).searchParams.get('courseId')?.trim() || '';
  const allowed = s.role === 'teacher' ? await teacherCourseIds(s.userId, s.tenantId) : null;
  if (courseId && allowed && !allowed.includes(courseId)) return NextResponse.json({ error: 'غير مصرح بهذه الدورة' }, { status: 403 });
  const values: unknown[] = [s.tenantId];
  const filters = ['c.tenant_id=$1'];
  if (allowed) { values.push(allowed); filters.push(`c.id = any($${values.length})`); }
  if (courseId) { values.push(courseId); filters.push(`c.id=$${values.length}`); }
  const rows = (await query(
    `with course_scope as (
       select c.id,c.name,c.category
       from courses c where ${filters.join(' and ')}
     ), exam_stats as (
       select e.course_id,count(distinct e.id)::int as exams,count(distinct at.id)::int as attempts,
              count(distinct at.id) filter(where at.finished_at is not null)::int as completed,
              coalesce(round(avg(case when at.total > 0 then at.score*100.0/at.total end),1),0) as average_score
       from exams e join course_scope c on c.id=e.course_id and e.tenant_id=$1
       left join attempts at on at.exam_id=e.id and at.tenant_id=e.tenant_id
       group by e.course_id
     ), assignment_stats as (
       select a.course_id,count(distinct a.id)::int as assignments,count(distinct sub.id)::int as submissions,
              count(distinct sub.id) filter(where sub.grade is not null)::int as graded,
              coalesce(round(avg(sub.grade),1),0) as average_grade
       from assignments a join course_scope c on c.id=a.course_id and a.tenant_id=$1
       left join submissions sub on sub.assignment_id=a.id and sub.tenant_id=a.tenant_id
       group by a.course_id
     )
     select c.*,coalesce(es.exams,0)::int as exams,coalesce(es.attempts,0)::int as attempts,
            coalesce(es.completed,0)::int as completed,coalesce(es.average_score,0) as average_score,
            coalesce(asg.assignments,0)::int as assignments,coalesce(asg.submissions,0)::int as submissions,
            coalesce(asg.graded,0)::int as graded,coalesce(asg.average_grade,0) as average_grade
     from course_scope c left join exam_stats es on es.course_id=c.id left join assignment_stats asg on asg.course_id=c.id
     order by c.name`, values
  )).rows;
  const totals = rows.reduce((acc, row) => ({ exams: acc.exams + Number(row.exams), attempts: acc.attempts + Number(row.attempts), completed: acc.completed + Number(row.completed), assignments: acc.assignments + Number(row.assignments), submissions: acc.submissions + Number(row.submissions), graded: acc.graded + Number(row.graded) }), { exams: 0, attempts: 0, completed: 0, assignments: 0, submissions: 0, graded: 0 });
  return NextResponse.json({ courses: rows, totals });
}
