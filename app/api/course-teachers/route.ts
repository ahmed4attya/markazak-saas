import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const courseId = (searchParams.get('courseId') || '').trim();
  if (courseId) {
    if (!(s.role === 'teacher' || isAdmin(s.role))) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    if (s.role === 'teacher') {
      const mine = (await query(
        'select 1 from course_teachers ct join courses c on c.id=ct.course_id where ct.course_id=$1 and ct.teacher_user_id=$2 and c.tenant_id=$3',
        [courseId, s.userId, s.tenantId]
      )).rows;
      if (!mine.length) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    const rows = (await query(
      `select u.id, u.name, u.email from course_teachers ct join users u on u.id = ct.teacher_user_id join courses c on c.id=ct.course_id where ct.course_id=$1 and c.tenant_id=$2 and u.tenant_id=$2 order by u.name`,
      [courseId, s.tenantId]
    )).rows;
    return NextResponse.json(rows);
  }
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rows = (await query(
    `select ct.course_id, c.name as course_name, u.id as user_id, u.name as teacher_name, u.email
     from course_teachers ct join courses c on c.id = ct.course_id join users u on u.id = ct.teacher_user_id
     where ct.course_id in (select id from courses where tenant_id=$1) order by c.name, u.name`,
    [s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const b = (await req.json()) as { courseId?: string; userId?: string };
    const courseId = typeof b.courseId === 'string' ? b.courseId : '';
    const userId = typeof b.userId === 'string' ? b.userId : '';
    if (!courseId || !userId) return NextResponse.json({ error: 'الدورة والمستخدم مطلوبان' }, { status: 400 });
    const c = (await query('select id from courses where id=$1 and tenant_id=$2', [courseId, s.tenantId])).rows;
    if (!c.length) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    const u = (await query(`select id from users where id=$1 and tenant_id=$2 and role='teacher'`, [userId, s.tenantId])).rows;
    if (!u.length) return NextResponse.json({ error: 'المستخدم ليس معلماً' }, { status: 400 });
    const ins = (await query(
      'insert into course_teachers(course_id,teacher_user_id) values($1,$2) on conflict do nothing returning *',
      [courseId, userId]
    )).rows;
    if (ins.length) {
      await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'course.assign-teacher', entity: 'course', entityId: courseId, metadata: { userId } });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const courseId = (searchParams.get('courseId') || '').trim();
  const userId = (searchParams.get('userId') || '').trim();
  if (!courseId || !userId) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const owned = (await query(
    `select 1 from course_teachers ct
     join courses c on c.id=ct.course_id and c.tenant_id=$3
     join users u on u.id=ct.teacher_user_id and u.tenant_id=$3 and u.role='teacher'
     where ct.course_id=$1 and ct.teacher_user_id=$2`,
    [courseId, userId, s.tenantId]
  )).rows;
  if (!owned.length) return NextResponse.json({ error: 'الربط غير موجود' }, { status: 404 });
  await query('delete from course_teachers where course_id=$1 and teacher_user_id=$2', [courseId, userId]);
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'course.unassign-teacher', entity: 'course', entityId: courseId, metadata: { userId } });
  return NextResponse.json({ ok: true });
}
