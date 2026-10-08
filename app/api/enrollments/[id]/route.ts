import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = {
  params: Promise<{ id: string }>;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AR_S1_PERIOD_INVALID = 'فترة الاشتراك غير صالحة';

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
        { error: 'معرف التسجيل غير صالح' },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (body.sub_start === '' || body.sub_start === null) {
      delete body.sub_start;
    }

    if (body.sub_end === '' || body.sub_end === null) {
      delete body.sub_end;
    }

    if (
      (body.sub_start !== undefined && isNaN(Date.parse(body.sub_start))) ||
      (body.sub_end !== undefined && isNaN(Date.parse(body.sub_end)))
    ) {
      return NextResponse.json(
        { error: AR_S1_PERIOD_INVALID },
        { status: 400 }
      );
    }

    const allowed = [
      'status',
      'price',
      'discount',
      'sub_start',
      'sub_end'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const field of allowed) {
      if (body[field] !== undefined) {
        fields.push(field + '=$' + index);

        if (field === 'price' || field === 'discount') {
          values.push(Number(body[field]) || 0);
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
      'update enrollments set ' +
      fields.join(',') +
      ' where id=$' +
      idIndex +
      ' and tenant_id=$' +
      tenantIndex +
      ' returning *';

    const result = await query(sql, values);

    if (result.rows.length === 0) {
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
        { error: 'معرف التسجيل غير صالح' },
        { status: 400 }
      );
    }

    const result = await query(
      'delete from enrollments where id=$1 and tenant_id=$2 returning id',
      [id, s.tenantId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'التسجيل غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.rows[0].id
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر حذف التسجيل') },
      { status: 400 }
    );
  }
}