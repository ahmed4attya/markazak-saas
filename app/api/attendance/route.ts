import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES = ['present', 'absent', 'late', 'excused'];

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function GET() {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const result = await query(
      'select a.*, st.name as student_name, st.student_no, g.name as group_name from attendance a left join students st on st.id=a.student_id and st.tenant_id=a.tenant_id left join groups g on g.id=a.group_id and g.tenant_id=a.tenant_id where a.tenant_id=$1 order by a.attendance_date desc, st.name asc limit 1000',
      [s.tenantId]
    );

    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر جلب الحضور') },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(30, ip);
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
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

    if (!body.attendance_date) {
      return NextResponse.json(
        { error: 'تاريخ الحضور مطلوب' },
        { status: 400 }
      );
    }

    if (!STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: 'حالة الحضور غير صالحة' },
        { status: 400 }
      );
    }

    const enrollment = await query(
      'select id from enrollments where group_id=$1 and student_id=$2 and tenant_id=$3 and status in ($4,$5)',
      [
        body.group_id,
        body.student_id,
        s.tenantId,
        'active',
        'completed'
      ]
    );

    if (enrollment.rows.length === 0) {
      return NextResponse.json(
        { error: 'الطالب غير مسجل في هذه المجموعة' },
        { status: 409 }
      );
    }

    const result = await query(
      'insert into attendance (tenant_id, group_id, student_id, attendance_date, status, check_in, notes) values ($1,$2,$3,$4,$5,$6,$7) returning *',
      [
        s.tenantId,
        body.group_id,
        body.student_id,
        body.attendance_date,
        body.status,
        body.check_in || null,
        body.notes || ''
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e: any) {
    if (e.code === '23505') {
      return NextResponse.json(
        { error: 'تم تسجيل حضور الطالب لهذا التاريخ مسبقاً' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: safeError(e, 'تعذر تسجيل الحضور') },
      { status: 400 }
    );
  }
}