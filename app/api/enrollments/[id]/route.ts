import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
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
      { error: 'معرف التسجيل غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'select e.*, st.name as student_name, st.student_no, g.name as group_name, c.name as course_name from enrollments e left join students st on st.id = e.student_id and st.tenant_id = e.tenant_id left join groups g on g.id = e.group_id and g.tenant_id = e.tenant_id left join courses c on c.id = g.course_id and c.tenant_id = g.tenant_id where e.id = $1 and e.tenant_id = $2',
      [id, s.tenantId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'التسجيل غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر جلب التسجيل') },
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
      { error: 'معرف التسجيل غير صالح' },
      { status: 400 }
    );
  }

  let b: any;

  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  try {
    const result = await query(
      `update enrollments set
        status = coalesce($3, status),
        price = coalesce($4, price),
        discount = coalesce($5, discount)
      where id = $1 and tenant_id = $2
      returning *`,
      [
        id,
        s.tenantId,
        b.status ?? null,
        b.price !== undefined ? Number(b.price) : null,
        b.discount !== undefined ? Number(b.discount) : null,
      ]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'التسجيل غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر تحديث التسجيل') },
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
      { error: 'معرف التسجيل غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'delete from enrollments where id = $1 and tenant_id = $2 returning id',
      [id, s.tenantId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'التسجيل غير موجود' },
        { status: 404 }
      );
    }

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'enrollment.delete',
      entity: 'enrollment',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر حذف التسجيل') },
      { status: 400 }
    );
  }
}
