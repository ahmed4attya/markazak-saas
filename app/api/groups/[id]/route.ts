import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const s = await getSession();

  if (!s) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const result = await query(
      'select e.*, st.name as student_name, st.student_no, g.name as group_name, c.name as course_name from enrollments e left join students st on st.id = e.student_id and st.tenant_id = e.tenant_id left join groups g on g.id = e.group_id and g.tenant_id = e.tenant_id left join courses c on c.id = g.course_id and c.tenant_id = g.tenant_id where e.tenant_id = $1 order by e.enrolled_at desc',
      [s.tenantId]
    );

    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر جلب التسجيلات') },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    if (!body.group_id || !UUID_RE.test(body.group_id)) {
      return NextResponse.json(
        { error: 'معرف المجموعة غير صالح' },
        { status: 400 }
      );
    }

    if (!body.student_id || !UUID_RE.test(body.student_id)) {
      return NextResponse.json(
        { error: 'معرف الطالب غير صالح' },
        { status: 400 }
      );
    }

    const group = await query(
      'select id from groups where id=$1 and tenant_id=$2',
      [body.group_id, s.tenantId]
    );

    if (group.rows.length === 0) {
      return NextResponse.json(
        { error: 'المجموعة غير موجودة' },
        { status: 404 }
      );
    }

    const student = await query(
      'select id from students where id=$1 and tenant_id=$2',
      [body.student_id, s.tenantId]
    );

    if (student.rows.length === 0) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    const duplicate = await query(
      'select id from enrollments where group_id=$1 and student_id=$2 and tenant_id=$3',
      [body.group_id, body.student_id, s.tenantId]
    );

    if (duplicate.rows.length > 0) {
      return NextResponse.json(
        { error: 'الطالب مسجل بالفعل في هذه المجموعة' },
        { status: 409 }
      );
    }

    const result = await query(
      'insert into enrollments (tenant_id, group_id, student_id, status, price, discount) values ($1,$2,$3,$4,$5,$6) returning *',
      [
        s.tenantId,
        body.group_id,
        body.student_id,
        body.status || 'active',
        Number(body.price) || 0,
        Number(body.discount) || 0
      ]
    );

    return NextResponse.json(
      result.rows[0],
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر إنشاء التسجيل') },
      { status: 400 }
    );
  }
}