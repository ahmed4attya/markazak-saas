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
      { error: 'معرف المجموعة غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'select g.*, c.name as course_name, t.name as teacher_name, cr.name as classroom_name, (select count(*) from enrollments e where e.group_id = g.id) as student_count from groups g left join courses c on c.id = g.course_id and c.tenant_id = g.tenant_id left join teachers t on t.id = g.teacher_id and t.tenant_id = g.tenant_id left join classrooms cr on cr.id = g.classroom_id and cr.tenant_id = g.tenant_id where g.id = $1 and g.tenant_id = $2',
      [id, s.tenantId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر جلب المجموعة') },
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
      { error: 'معرف المجموعة غير صالح' },
      { status: 400 }
    );
  }

  let b: any;

  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  if (b.name !== undefined && String(b.name).trim().length < 2) {
    return NextResponse.json(
      { error: 'اسم المجموعة مطلوب' },
      { status: 400 }
    );
  }

  if (
    b.course_id !== undefined &&
    b.course_id !== null &&
    !UUID_RE.test(b.course_id)
  ) {
    return NextResponse.json(
      { error: 'معرف الدورة غير صالح' },
      { status: 400 }
    );
  }

  if (
    b.teacher_id !== undefined &&
    b.teacher_id !== null &&
    !UUID_RE.test(b.teacher_id)
  ) {
    return NextResponse.json(
      { error: 'معرف المدرب غير صالح' },
      { status: 400 }
    );
  }

  if (
    b.classroom_id !== undefined &&
    b.classroom_id !== null &&
    !UUID_RE.test(b.classroom_id)
  ) {
    return NextResponse.json(
      { error: 'معرف القاعة غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      `update groups set
        course_id = coalesce($3, course_id),
        teacher_id = coalesce($4, teacher_id),
        classroom_id = coalesce($5, classroom_id),
        name = coalesce($6, name),
        capacity = coalesce($7, capacity),
        room = coalesce($8, room),
        mode = coalesce($9, mode),
        start_date = coalesce($10, start_date),
        end_date = coalesce($11, end_date),
        start_time = coalesce($12, start_time),
        end_time = coalesce($13, end_time),
        days = coalesce($14, days),
        status = coalesce($15, status)
      where id = $1 and tenant_id = $2
      returning *`,
      [
        id,
        s.tenantId,
        b.course_id ?? null,
        b.teacher_id ?? null,
        b.classroom_id ?? null,
        b.name !== undefined ? String(b.name).trim() : null,
        b.capacity !== undefined ? Number(b.capacity) : null,
        b.room ?? null,
        b.mode ?? null,
        b.start_date ?? null,
        b.end_date ?? null,
        b.start_time ?? null,
        b.end_time ?? null,
        b.days ?? null,
        b.status ?? null,
      ]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر تحديث المجموعة') },
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
      { error: 'معرف المجموعة غير صالح' },
      { status: 400 }
    );
  }

  try {
    const result = await query(
      'delete from groups where id = $1 and tenant_id = $2 returning id',
      [id, s.tenantId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'group.delete',
      entity: 'group',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر حذف المجموعة') },
      { status: 400 }
    );
  }
}
