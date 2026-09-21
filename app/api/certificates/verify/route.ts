import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const number = (u.searchParams.get('number') || '').trim();

    if (!number) {
      return NextResponse.json(
        {
          valid: false,
          error: 'رقم الشهادة مطلوب'
        },
        { status: 400 }
      );
    }

    const result = await query(
      `
        select
          c.number,
          c.issued_at,
          c.grade,
          c.status,
          c.verify_token,
          s.name student_name,
          s.student_no,
          co.name course_name,
          t.name center_name
        from certificates c
        join students s
          on s.id = c.student_id
        join courses co
          on co.id = c.course_id
        join tenants t
          on t.id = c.tenant_id
        where c.number = $1
          and c.status = 'issued'
        limit 1
      `,
      [number]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { valid: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        certificate: result.rows[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Certificate verification error:', error);

    return NextResponse.json(
      {
        valid: false,
        error: 'تعذر التحقق من الشهادة'
      },
      { status: 500 }
    );
  }
}
