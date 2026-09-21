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
      'select g.*, c.name as course_name, t.name as teacher_name, cr.name as classroom_name, (select count(*) from enrollments e where e.group_id = g.id) as student_count from groups g left join courses c on c.id = g.course_id and c.tenant_id = g.tenant_id left join teachers t on t.id = g.teacher_id and t.tenant_id = g.tenant_id left join classrooms cr on cr.id = g.classroom_id and cr.tenant_id = g.tenant_id where g.tenant_id = $1 order by g.start_date desc nulls last, g.created_at desc',
      [s.tenantId]
    );

    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر جلب المجموعات') },
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
    const b = await req.json();

    if (!b.name || String(b.name).trim().length < 2) {
      return NextResponse.json(
        { error: 'اسم المجموعة مطلوب' },
        { status: 400 }
      );
    }

    if (b.course_id && !UUID_RE.test(b.course_id)) {
      return NextResponse.json(
        { error: 'معرف الدورة غير صالح' },
        { status: 400 }
      );
    }

    if (b.teacher_id && !UUID_RE.test(b.teacher_id)) {
      return NextResponse.json(
        { error: 'معرف المدرب غير صالح' },
        { status: 400 }
      );
    }

    if (b.classroom_id && !UUID_RE.test(b.classroom_id)) {
      return NextResponse.json(
        { error: 'معرف القاعة غير صالح' },
        { status: 400 }
      );
    }

    const result = await query(
      'insert into groups (tenant_id, course_id, teacher_id, classroom_id, name, capacity, room, mode, start_date, end_date, start_time, end_time, days, status) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *',
      [
        s.tenantId,
        b.course_id || null,
        b.teacher_id || null,
        b.classroom_id || null,
        String(b.name).trim(),
        Number(b.capacity) || 25,
        b.room || '',
        b.mode || 'onsite',
        b.start_date || null,
        b.end_date || null,
        b.start_time || null,
        b.end_time || null,
        b.days || '',
        b.status || 'scheduled'
      ]
    );

    return NextResponse.json(
      result.rows[0],
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر إنشاء المجموعة') },
      { status: 400 }
    );
  }
}