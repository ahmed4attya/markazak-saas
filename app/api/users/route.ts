import { NextResponse } from 'next/server';
import { query, safeError, withTx } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function GET() {
  const s = await getSession();
  if (s && !isAdminRole(s.role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  }
  try {
    const result = await query(
      `
        select
          id,
          name,
          email,
          phone,
          role,
          active,
          last_login_at,
          created_at
        from users
        where tenant_id = $1
        order by created_at desc
        limit 500
      `,
      [s.tenantId]
    );

    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json({ error: safeError(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  if (!isAdmin(s.role)) {
    return NextResponse.json({ error: 'الصلاحية دي للإدارة بس' }, { status: 403 });
  }

  const rl = rateLimit('users-create:' + s.userId, 3, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'محاولات كثيرة — انتظر قليلا' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } });

  const body = await req.json();

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();
  const role = ['admin', 'manager', 'staff', 'teacher', 'accountant', 'student', 'guardian'].includes(body.role)
    ? body.role
    : 'staff';
  const studentId = body.studentId ? String(body.studentId) : '';

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: 'الاسم والبريد وكلمة المرور مطلوبة، وكلمة المرور 8 أحرف على الأقل' },
      { status: 400 }
    );
  }

  if ((role === 'student' || role === 'guardian') && !studentId) {
    return NextResponse.json({ error: 'حساب الطالب أو ولي الأمر يحتاج ربطاً بسجل طالب' }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await withTx(async (client) => {
      const exists = await client.query(`select id from users where lower(email) = lower($1) limit 1`, [email]);
      if (exists.rows.length) throw Object.assign(new Error('البريد الإلكتروني مستخدم بالفعل'), { code: '23505' });
      if (role === 'student' || role === 'guardian') {
        const student = await client.query(
          `select id, user_id, guardian_user_id from students where id=$1 and tenant_id=$2 for update`,
          [studentId, s.tenantId]
        );
        if (!student.rows.length) throw Object.assign(new Error('سجل الطالب غير موجود'), { code: '23503' });
        if (role === 'student' && student.rows[0].user_id) throw Object.assign(new Error('للطالب حساب مرتبط بالفعل'), { code: '23505' });
        if (role === 'guardian' && student.rows[0].guardian_user_id) throw Object.assign(new Error('للطالب ولي أمر مرتبط بالفعل'), { code: '23505' });
      }
      const inserted = await client.query(
        `insert into users (tenant_id,email,name,password_hash,role,phone,active)
         values ($1,$2,$3,$4,$5,$6,true)
         returning id,name,email,phone,role,active,created_at`,
        [s.tenantId, email, name, passwordHash, role, phone]
      );
      if (role === 'student') await client.query('update students set user_id=$1, updated_at=now() where id=$2 and tenant_id=$3', [inserted.rows[0].id, studentId, s.tenantId]);
      if (role === 'guardian') await client.query('update students set guardian_user_id=$1, updated_at=now() where id=$2 and tenant_id=$3', [inserted.rows[0].id, studentId, s.tenantId]);
      return inserted;
    });

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'user.create',
      entity: 'user',
      entityId: result.rows[0].id,
      metadata: { email, role },
    });

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: safeError(e, 'تعذر إنشاء المستخدم') }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  if (!isAdmin(s.role)) {
    return NextResponse.json({ error: 'الصلاحية دي للإدارة بس' }, { status: 403 });
  }

  const body = await req.json();
  const id = String(body.id || '');

  if (!id) {
    return NextResponse.json(
      { error: 'معرف المستخدم مطلوب' },
      { status: 400 }
    );
  }

  const role = body.role
    ? ['admin', 'manager', 'staff', 'teacher', 'accountant', 'student', 'guardian'].includes(body.role)
      ? body.role
      : null
    : null;

  if (body.role && !role) {
    return NextResponse.json(
      { error: 'الدور غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `
        update users
        set
          name = coalesce($3, name),
          phone = coalesce($4, phone),
          role = coalesce($5, role),
          active = coalesce($6, active),
          updated_at = now()
        where id = $1
          and tenant_id = $2
        returning
          id,
          name,
          email,
          phone,
          role,
          active,
          last_login_at,
          created_at
      `,
      [
        id,
        s.tenantId,
        body.name !== undefined ? String(body.name).trim() : null,
        body.phone !== undefined ? String(body.phone).trim() : null,
        role,
        body.active !== undefined ? Boolean(body.active) : null,
      ]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'user.update',
      entity: 'user',
      entityId: id,
      metadata: { role: role || undefined, active: body.active },
    });

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: safeError(e, 'تعذر تحديث المستخدم') }, { status: 400 });
  }
}
