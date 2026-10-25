// lib/access.ts - SERVER-ONLY access layer (DEC-062/A2). Isolation lives
// inside the queries themselves. Client-safe helpers live in lib/roles.ts.
import { query } from './db';

export async function teacherCourseIds(userId: string, tenantId: string): Promise<string[]> {
  const r = await query(
    `select distinct course_id from (
       select ct.course_id from course_teachers ct join courses c on c.id=ct.course_id where ct.teacher_user_id=$1 and c.tenant_id=$2
       union
       select g.course_id from groups g join teachers t on t.id=g.teacher_id where t.user_id=$1 and g.tenant_id=$2
     ) sub`,
    [userId, tenantId]
  );
  return r.rows.map((x: any) => String(x.course_id));
}

export async function teacherGroupIds(userId: string, tenantId: string): Promise<string[]> {
  const r = await query(
    `select distinct g.id from groups g
     left join teachers t on t.id = g.teacher_id
     left join course_teachers ct on ct.course_id = g.course_id and ct.teacher_user_id = $1
     where g.tenant_id = $2
       and (t.user_id = $1 or ct.teacher_user_id = $1)`,
    [userId, tenantId]
  );
  return r.rows.map((x: any) => String(x.id));
}

export async function canAccessCourse(s: { role: string; userId: string; tenantId: string }, courseId: string): Promise<boolean> {
  if (s.role === 'owner' || s.role === 'manager' || s.role === 'admin') {
    const r = await query('select 1 from courses where id=$1 and tenant_id=$2', [courseId, s.tenantId]);
    return r.rows.length > 0;
  }
  if (s.role === 'teacher') {
    const allowed = await teacherCourseIds(s.userId, s.tenantId);
    return allowed.includes(courseId);
  }
  return false;
}

export async function canAccessGroup(s: { role: string; userId: string; tenantId: string }, groupId: string): Promise<boolean> {
  if (s.role === 'owner' || s.role === 'manager' || s.role === 'admin') {
    const r = await query('select 1 from groups where id=$1 and tenant_id=$2', [groupId, s.tenantId]);
    return r.rows.length > 0;
  }
  if (s.role === 'teacher') {
    const allowed = await teacherGroupIds(s.userId, s.tenantId);
    return allowed.includes(groupId);
  }
  return false;
}
