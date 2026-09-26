import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { studentSchema } from '@/lib/validation';
import { logAudit } from '@/lib/audit';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: 'معرف الطالب غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'select id, student_no, name, phone, email, identity_no, status, created_at from students where id = $1 and tenant_id = $2',
      [id, s.tenantId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر جلب بيانات الطالب') },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: 'معرف الطالب غير صالح' },
      { status: 400 }
    );
  }

  let x;

  try {
    x = studentSchema.partial().parse(await req.json());
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'بيانات الطالب غير صالحة') },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `update students set
        student_no = coalesce($3, student_no),
        name = coalesce($4, name),
        phone = coalesce($5, phone),
        email = coalesce($6, email),
        identity_no = coalesce($7, identity_no),
        status = coalesce($8, status),
        updated_at = now()
      where id = $1 and tenant_id = $2
      returning *`,
      [
        id,
        s.tenantId,
        x.student_no ?? null,
        x.name ?? null,
        x.phone ?? null,
        x.email ?? null,
        x.identity_no ?? null,
        x.status ?? null,
      ]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر تحديث بيانات الطالب') },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  if (!isAdmin(s.role)) {
    return NextResponse.json(
      { error: 'الصلاحية دي للإدارة بس' },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: 'معرف الطالب غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'delete from students where id = $1 and tenant_id = $2 returning id',
      [id, s.tenantId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'student.delete',
      entity: 'student',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر حذف الطالب') },
      { status: 400 }
    );
  }
}
