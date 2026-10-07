import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  req: Request,
  context: Context
) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const allowed = [
      'student_no',
      'name',
      'phone',
      'email',
      'identity_no',
      'status'
    ];

    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const field of allowed) {
      if (body[field] !== undefined) {
        fields.push(`${field}=$${index}`);
        values.push(body[field]);
        index++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للتحديث' },
        { status: 400 }
      );
    }

    fields.push('updated_at=now()');

    values.push(id);
    const idIndex = index;

    values.push(s.tenantId);
    const tenantIndex = index + 1;

    const r = await query(
      `update students
       set ${fields.join(',')}
       where id=$${idIndex}
       and tenant_id=$${tenantIndex}
       returning *`,
      values
    );

    if (r.rows.length === 0) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(r.rows[0]);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e) },
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
      { error: 'unauthorized' },
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

    const r = await query(
      `delete from students
       where id=$1
       and tenant_id=$2
       returning id`,
      [id, s.tenantId]
    );

    if (r.rows.length === 0) {
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
      entityId: r.rows[0].id,
    });

    return NextResponse.json({
      ok: true,
      id: r.rows[0].id
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e) },
      { status: 400 }
    );
  }
}