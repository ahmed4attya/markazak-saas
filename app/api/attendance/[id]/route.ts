import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = ['present', 'absent', 'late', 'excused'];

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
      { error: 'معرف سجل الحضور غير صالح' },
      { status: 400 }
    );
  }

  let b: any;

  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  if (b.status !== undefined && !STATUSES.includes(b.status)) {
    return NextResponse.json(
      { error: 'حالة الحضور غير صالحة' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `update attendance set
        attendance_date = coalesce($3, attendance_date),
        status = coalesce($4, status),
        check_in = coalesce($5, check_in),
        notes = coalesce($6, notes)
      where id = $1 and tenant_id = $2
      returning *`,
      [
        id,
        s.tenantId,
        b.attendance_date ?? null,
        b.status ?? null,
        b.check_in ?? null,
        b.notes ?? null,
      ]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'سجل الحضور غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    if (e.code === '23505') {
      return NextResponse.json(
        {
          error:
            'يوجد سجل حضور آخر لنفس الطالب والمجموعة في هذا التاريخ',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: safeError(e, 'تعذر تحديث سجل الحضور') },
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
      { error: 'معرف سجل الحضور غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'delete from attendance where id = $1 and tenant_id = $2 returning id',
      [id, s.tenantId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'سجل الحضور غير موجود' },
        { status: 404 }
      );
    }

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'attendance.delete',
      entity: 'attendance',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر حذف سجل الحضور') },
      { status: 400 }
    );
  }
}
