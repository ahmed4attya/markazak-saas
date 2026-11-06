import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

type Context = {
  params: Promise<{ id: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  req: Request,
  context: Context
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: 'معرف المجموعة غير صالح' },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (body.course_id && !UUID_RE.test(body.course_id)) {
      return NextResponse.json(
        { error: 'معرف الدورة غير صالح' },
        { status: 400 }
      );
    }

    if (body.teacher_id && !UUID_RE.test(body.teacher_id)) {
      return NextResponse.json(
        { error: 'معرف المدرب غير صالح' },
        { status: 400 }
      );
    }

    if (body.classroom_id && !UUID_RE.test(body.classroom_id)) {
      return NextResponse.json(
        { error: 'معرف القاعة غير صالح' },
        { status: 400 }
      );
    }

    const allowed = [
      'course_id',
      'teacher_id',
      'classroom_id',
      'name',
      'capacity',
      'room',
      'mode',
      'start_date',
      'end_date',
      'start_time',
      'end_time',
      'days',
      'status'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const field of allowed) {
      if (body[field] !== undefined) {
        fields.push(field + '=$' + index);

        if (
          field === 'course_id' ||
          field === 'teacher_id' ||
          field === 'classroom_id'
        ) {
          values.push(body[field] || null);
        } else if (field === 'capacity') {
          values.push(Number(body[field]) || 25);
        } else {
          values.push(body[field]);
        }

        index++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للتحديث' },
        { status: 400 }
      );
    }

    values.push(id);
    const idIndex = index;

    values.push(s.tenantId);
    const tenantIndex = index + 1;

    const sql =
      'update groups set ' +
      fields.join(',') +
      ' where id=$' +
      idIndex +
      ' and tenant_id=$' +
      tenantIndex +
      ' returning *';

    const result = await query(sql, values);

    if (result.rows.length === 0) {
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
  req: Request,
  context: Context
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  if (!isAdmin(s.role)) {
    return NextResponse.json(
      { error: 'الصلاحية دي للإدارة بس' },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;

    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: 'معرف المجموعة غير صالح' },
        { status: 400 }
      );
    }

    const result = await query(
      'delete from groups where id=$1 and tenant_id=$2 returning id',
      [id, s.tenantId]
    );

    if (result.rows.length === 0) {
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
      entityId: result.rows[0].id,
    });

    return NextResponse.json({
      ok: true,
      id: result.rows[0].id
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر حذف المجموعة') },
      { status: 400 }
    );
  }
}