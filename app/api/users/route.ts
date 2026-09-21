import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function GET() {
  const s = await getSession();

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

  const body = await req.json();

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();
  const role = ['admin', 'manager', 'staff', 'teacher', 'accountant'].includes(body.role)
    ? body.role
    : 'staff';

  if (!name || !email || password.length < 8) {
    return NextResponse.json(
      { error: 'الاسم والبريد وكلمة المرور مطلوبة، وكلمة المرور 8 أحرف على الأقل' },
      { status: 400 }
    );
  }

  try {
    const exists = await query(
      `select id from users where lower(email) = lower($1) limit 1`,
      [email]
    );

    if (exists.rows.length) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `
        insert into users (
          tenant_id,
          email,
          name,
          password_hash,
          role,
          phone,
          active
        )
        values ($1,$2,$3,$4,$5,$6,true)
        returning
          id,
          name,
          email,
          phone,
          role,
          active,
          created_at
      `,
      [
        s.tenantId,
        email,
        name,
        passwordHash,
        role,
        phone,
      ]
    );

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
    ? ['admin', 'manager', 'staff', 'teacher', 'accountant'].includes(body.role)
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
