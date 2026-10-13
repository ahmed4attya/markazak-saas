// lib/access.ts - SERVER-ONLY access layer (DEC-062/A2). Isolation lives
// inside the queries themselves. Client-safe helpers live in lib/roles.ts.
import { query } from './db';

export async function teacherCourseIds(userId: string, tenantId: string): Promise<string[]> {
  const r = await query(
    'select ct.course_id from course_teachers ct join courses c on c.id=ct.course_id where ct.teacher_user_id=$1 and c.tenant_id=$2',
    [userId, tenantId]
  );
  return r.rows.map((x: any) => String(x.course_id));
}

export async function canAccessCourse(s: { role: string; userId: string; tenantId: string }, courseId: string): Promise<boolean> {
  if (s.role === 'owner' || s.role === 'manager' || s.role === 'admin') {
    const r = await query('select 1 from courses where id=$1 and tenant_id=$2', [courseId, s.tenantId]);
    return r.rows.length > 0;
  }
  if (s.role === 'teacher') {
    const r = await query(
      'select 1 from course_teachers ct join courses c on c.id=ct.course_id where ct.course_id=$1 and ct.teacher_user_id=$2 and c.tenant_id=$3',
      [courseId, s.userId, s.tenantId]
    );
    return r.rows.length > 0;
  }
  return false;
}
