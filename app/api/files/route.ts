import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId') || '';
  const groupId = searchParams.get('groupId') || '';
  let sql = 'select * from files where tenant_id=$1';
  const vals: string[] = [s.tenantId];
  if (courseId) { sql += ' and course_id=$' + (vals.length + 1); vals.push(courseId); }
  if (groupId) { sql += ' and group_id=$' + (vals.length + 1); vals.push(groupId); }
  sql += ' order by created_at desc limit 500';
  return NextResponse.json((await query(sql, vals)).rows);
}