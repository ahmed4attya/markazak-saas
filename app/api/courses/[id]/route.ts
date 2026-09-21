import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';

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
      'select * from classrooms where tenant_id = $1 order by name asc',
      [s.tenantId]
    );

    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر جلب القاعات') },
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

    if (!body.name || String(body.name).trim().length < 2) {
      return NextResponse.json(
        { error: 'اسم القاعة مطلوب' },
        { status: 400 }
      );
    }

    const result = await query(
      'insert into classrooms (tenant_id, name, capacity, location, equipment, status) values ($1,$2,$3,$4,$5,$6) returning *',
      [
        s.tenantId,
        String(body.name).trim(),
        Number(body.capacity) || 25,
        body.location || '',
        body.equipment || '',
        body.status || 'active'
      ]
    );

    return NextResponse.json(
      result.rows[0],
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: safeError(e, 'تعذر إنشاء القاعة') },
      { status: 400 }
    );
  }
}
