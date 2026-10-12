// lib/access.ts - central isolation layer (DEC-062/A2). Scoped APIs call
// these BEFORE reading; isolation lives in the query itself.
import { query } from './db';

export function isAdminRole(role: string): boolean {
  return role === 'owner' || role === 'manager' || role === 'admin';
}

export async function teacherCourseIds(userId: string): Promise<string[]> {
  const r = await query('select course_id from course_teachers where teacher_user_id=$1', [userId]);
  return r.rows.map((x: any) => String(x.course_id));
}

export async function canAccessCourse(s: { role: string; userId: string }, courseId: string): Promise<boolean> {
  if (isAdminRole(s.role)) return true;
  if (s.role === 'teacher') {
    const r = await query('select 1 from course_teachers where course_id=$1 and teacher_user_id=$2', [courseId, s.userId]);
    return r.rows.length > 0;
  }
  // student/guardian isolation lands with Scope S (no accounts yet)
  return false;
}