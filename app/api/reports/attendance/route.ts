import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(20, ip);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ error: 'تاريخ البداية والنهاية مطلوبان' }, { status: 400 });
    }

    const result = await query(
      `SELECT 
        st.name as student_name, 
        st.student_no, 
        COUNT(*) FILTER (WHERE a.status = 'present') as present_count, 
        COUNT(*) as total_count 
       FROM attendance a 
       JOIN students st ON a.student_id = st.id AND a.tenant_id = st.tenant_id
       WHERE a.tenant_id = $1 AND a.attendance_date BETWEEN $2 AND $3
       GROUP BY st.id, st.name, st.student_no
       ORDER BY st.name ASC`,
      [s.tenantId, from, to]
    );

    return NextResponse.json(result.rows);
  } catch (e: any) {
    return NextResponse.json({ error: safeError(e, 'تعذر جلب التقرير') }, { status: 500 });
  }
}
