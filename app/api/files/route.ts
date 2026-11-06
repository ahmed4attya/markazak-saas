import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { teacherCourseIds, teacherGroupIds } from '@/lib/access';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId') || '';
  const groupId = searchParams.get('groupId') || '';
  let sql = 'select * from files where tenant_id=$1';
  const vals: any[] = [s.tenantId];

  if (s.role === 'teacher') {
    const allowedCourses = await teacherCourseIds(s.userId, s.tenantId);
    const allowedGroups = await teacherGroupIds(s.userId, s.tenantId);

    if (courseId && !allowedCourses.includes(courseId)) {
      return NextResponse.json([]);
    }
    if (groupId && !allowedGroups.includes(groupId)) {
      return NextResponse.json([]);
    }

    if (courseId) {
      vals.push(courseId);
      sql += ` and course_id=$${vals.length}`;
    }
    if (groupId) {
      vals.push(groupId);
      sql += ` and group_id=$${vals.length}`;
    }

    if (!courseId && !groupId) {
      if (allowedCourses.length === 0 && allowedGroups.length === 0) {
        return NextResponse.json([]);
      }
      vals.push(allowedCourses);
      const p1 = vals.length;
      vals.push(allowedGroups);
      const p2 = vals.length;
      sql += ` and (course_id = any($${p1}) or group_id = any($${p2}))`;
    }
  } else {
    if (courseId) { vals.push(courseId); sql += ` and course_id=$${vals.length}`; }
    if (groupId) { vals.push(groupId); sql += ` and group_id=$${vals.length}`; }
  }

  sql += ' order by created_at desc limit 500';
  return NextResponse.json((await query(sql, vals)).rows);
}
