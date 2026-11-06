import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET() {
  const s = await getSession();

  if (!s) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  const result = await query(
    `
      select
        c.id,
        c.number,
        c.issued_at,
        c.grade,
        c.status,
        c.verify_token,
        s.id student_id,
        s.name student_name,
        s.student_no,
        co.id course_id,
        co.name course_name
      from certificates c
      join students s on s.id = c.student_id
      join courses co on co.id = c.course_id
      where c.tenant_id = $1
      order by c.issued_at desc nulls last, c.number desc
    `,
    [s.tenantId]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
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
    const body = await req.json();

    const studentId = String(body.student_id || '').trim();
    const courseId = String(body.course_id || '').trim();
    const grade = String(body.grade || '').trim();

    if (!studentId || !courseId) {
      return NextResponse.json(
        { error: 'الطالب والدورة مطلوبان' },
        { status: 400 }
      );
    }

    const student = await query(
      `
        select id, name, student_no
        from students
        where id = $1
          and tenant_id = $2
        limit 1
      `,
      [studentId, s.tenantId]
    );

    if (!student.rows[0]) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    const course = await query(
      `
        select id, name
        from courses
        where id = $1
          and tenant_id = $2
        limit 1
      `,
      [courseId, s.tenantId]
    );

    if (!course.rows[0]) {
      return NextResponse.json(
        { error: 'الدورة غير موجودة' },
        { status: 404 }
      );
    }

    const existing = await query(
      `
        select
          c.id,
          c.number,
          c.issued_at,
          c.grade,
          c.status,
          c.verify_token
        from certificates c
        where c.tenant_id = $1
          and c.student_id = $2
          and c.course_id = $3
          and c.status = 'issued'
        limit 1
      `,
      [s.tenantId, studentId, courseId]
    );

    if (existing.rows[0]) {
      return NextResponse.json(
        {
          error: 'تم إصدار شهادة لهذا الطالب في هذه الدورة مسبقًا',
          certificate: existing.rows[0]
        },
        { status: 409 }
      );
    }

    const year = new Date().getFullYear();

    const sequence = await query(
      `
        select count(*)::int + 1 as next_number
        from certificates
        where tenant_id = $1
      `,
      [s.tenantId]
    );

    const nextNumber = sequence.rows[0].next_number;

    const number =
      `CERT-${year}-${String(nextNumber).padStart(5, '0')}`;

    const result = await query(
      `
        insert into certificates (
          tenant_id,
          student_id,
          course_id,
          number,
          grade,
          status
        )
        values ($1,$2,$3,$4,$5,'issued')
        returning
          id,
          number,
          issued_at,
          grade,
          status,
          verify_token
      `,
      [
        s.tenantId,
        studentId,
        courseId,
        number,
        grade || null
      ]
    );

    return NextResponse.json(
      {
        ok: true,
        certificate: {
          ...result.rows[0],
          student_id: student.rows[0].id,
          student_name: student.rows[0].name,
          student_no: student.rows[0].student_no,
          course_id: course.rows[0].id,
          course_name: course.rows[0].name
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Certificate issue error:', error);

    return NextResponse.json(
      { error: 'تعذر إصدار الشهادة' },
      { status: 500 }
    );
  }
}
