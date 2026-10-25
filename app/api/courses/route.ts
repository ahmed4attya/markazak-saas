import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { courseSchema } from '@/lib/validation';
import { assertPlanQuota } from '@/lib/quota';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const u = new URL(req.url);
  const q = (u.searchParams.get('q') || '').trim();
  const category = (u.searchParams.get('category') || '').trim();
  const status = (u.searchParams.get('status') || '').trim();

  let sql = `select c.*, coalesce((select string_agg(u.name, '، ') from course_teachers ct join users u on u.id=ct.teacher_user_id where ct.course_id=c.id), '') as teacher_names from courses c where c.tenant_id=$1`;
  const vals: any[] = [s.tenantId];

  if (s.role === 'teacher') {
    vals.push(s.userId);
    sql += ` and c.id in (select course_id from course_teachers where teacher_user_id=$${vals.length})`;
  }

  if (q) {
    vals.push(`%${q}%`);
    const p = vals.length;
    sql += ` and (c.name ilike $${p} or c.description ilike $${p} or c.category ilike $${p})`;
  }

  if (category) {
    vals.push(`%${category}%`);
    sql += ` and c.category ilike $${vals.length}`;
  }

  if (status && ['active', 'draft', 'archived'].includes(status)) {
    vals.push(status);
    sql += ` and c.status=$${vals.length}`;
  }

  sql += ' order by c.created_at desc limit 500';
  const rows = (await query(sql, vals)).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const x = courseSchema.parse(await req.json());
    if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    await assertPlanQuota(s.tenantId, 'courses');
    return NextResponse.json(
      (await query(
        'insert into courses(tenant_id,name,category,duration_hours,price,description,status) values($1,$2,$3,$4,$5,$6,$7) returning *',
        [s.tenantId, x.name, x.category || null, x.duration_hours, x.price, x.description, x.status]
      )).rows[0],
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
