import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const linkColumn = s.role === 'student' ? 'student_user_id' : 'guardian_user_id';
  const rows = (await query(
    `select distinct l.id,l.course_id,l.position,l.title,l.description,l.body,l.duration_minutes,l.video_id,
            c.name as course_name,st.id as student_id,st.name as student_name,
            coalesce(lp.seconds_watched,0)::int as seconds_watched,(lp.completed_at is not null) as completed
     from students st join enrollments en on en.student_id=st.id and en.tenant_id=st.tenant_id and en.status='active'
     join groups g on g.id=en.group_id and g.tenant_id=en.tenant_id
     join course_lessons l on l.course_id=g.course_id and l.tenant_id=st.tenant_id and l.published=true
     join courses c on c.id=l.course_id and c.tenant_id=l.tenant_id
     left join lesson_progress lp on lp.lesson_id=l.id and lp.student_id=st.id and lp.tenant_id=st.tenant_id
     where st.tenant_id=$1 and st.${linkColumn}=$2 order by st.name,c.name,l.position`,
    [s.tenantId, s.userId]
  )).rows;
  return NextResponse.json(rows);
}
