import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const AR_S1_TYPE_INVALID = 'نوع الطالب غير صالح';

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

  if (!isAdmin(s.role)) {
    return NextResponse.json(
      { error: 'الصلاحية دي للإدارة بس' },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await req.json();

    const rawType = (typeof body.type === 'string') ? body.type.trim().toLowerCase() : undefined;

    if (rawType !== undefined && rawType !== '' && rawType !== 'center' && rawType !== 'online') {
      return NextResponse.json(
        { error: AR_S1_TYPE_INVALID },
        { status: 400 }
      );
    }

    if (rawType === '') {
      delete body.type;
    } else if (rawType !== undefined) {
      body.type = rawType;
    }

    const allowed = [
      'student_no',
      'name',
      'phone',
      'email',
      'identity_no',
      'status',
      'type'
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
    const deleteUser = new URL(req.url).searchParams.get('deleteUser') === '1';

    const r = await query(
      `delete from students
       where id=$1
       and tenant_id=$2
       returning id, user_id, guardian_user_id`,
      [id, s.tenantId]
    );

    if (r.rows.length === 0) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    let deletedUser = false;
    const linkedUserId = r.rows[0].user_id || r.rows[0].guardian_user_id;
    if (deleteUser && linkedUserId) {
      const u = await query(
        'delete from users where id=$1 and tenant_id=$2 returning id',
        [linkedUserId, s.tenantId]
      );
      deletedUser = u.rows.length > 0;
    }

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'student.delete',
      entity: 'student',
      entityId: r.rows[0].id,
      metadata: deleteUser ? { linkedUserDeleted: deletedUser } : undefined,
    });

    return NextResponse.json({
      ok: true,
      id: r.rows[0].id,
      linkedUserDeleted: deletedUser,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e) },
      { status: 400 }
    );
  }
}