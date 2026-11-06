import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { teacherCourseIds } from '@/lib/access';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId') || '';
  let sql = 'select * from videos where tenant_id=$1';
  const vals: any[] = [s.tenantId];

  if (s.role === 'teacher') {
    const allowed = await teacherCourseIds(s.userId, s.tenantId);
    if (allowed.length === 0) {
      return NextResponse.json([]);
    }
    if (courseId) {
      if (!allowed.includes(courseId)) {
        return NextResponse.json([]);
      }
      vals.push(courseId);
      sql += ` and course_id=$${vals.length}`;
    } else {
      vals.push(allowed);
      sql += ` and course_id = any($${vals.length})`;
    }
  } else {
    if (courseId) {
      vals.push(courseId);
      sql += ` and course_id=$${vals.length}`;
    }
  }

  sql += ' order by created_at desc limit 500';
  return NextResponse.json((await query(sql, vals)).rows);
}
