// lib/access.ts - SERVER-ONLY access layer (DEC-062/A2). Isolation lives
// inside the queries themselves. Client-safe helpers live in lib/roles.ts.
import { query } from './db';

export async function teacherCourseIds(userId: string): Promise<string[]> {
  const r = await query('select course_id from course_teachers where teacher_user_id=$1', [userId]);
  return r.rows.map((x: any) => String(x.course_id));
}

export async function canAccessCourse(s: { role: string; userId: string }, courseId: string): Promise<boolean> {
  if (s.role === 'owner' || s.role === 'manager' || s.role === 'admin') return true;
  if (s.role === 'teacher') {
    const r = await query('select 1 from course_teachers where course_id=$1 and teacher_user_id=$2', [courseId, s.userId]);
    return r.rows.length > 0;
  }
  return false;
}