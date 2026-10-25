import { NextResponse } from 'next/server';
import { query, safeError, withTx } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

// Scope 6: activation codes (admin-only - the centers' sales model).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function genCode(): string {
  const seg = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  return 'MKZ-' + seg() + '-' + seg();
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rows = (await query(
    `select ac.id, ac.code, ac.duration_days, ac.max_uses, ac.used_count, ac.active, ac.created_at,
            c.name as course_name,
            (select count(*)::int from code_redemptions r where r.code_id = ac.id) as redemption_count
     from activation_codes ac
     left join courses c on c.id = ac.course_id
     where ac.tenant_id = $1
     order by ac.created_at desc limit 300`,
    [s.tenantId]
  )).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rl = await rateLimit('codes-create:' + s.userId, 10, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'محاولات كثيرة — انتظر قليلا' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } });

  try {
    const b = (await req.json()) as { courseId?: string; durationDays?: number; maxUses?: number; count?: number };
    const courseId = typeof b.courseId === 'string' ? b.courseId : '';
    if (!courseId) return NextResponse.json({ error: 'الكود مرتبط بدورة' }, { status: 400 });
    const course = (await query('select id from courses where id=$1 and tenant_id=$2', [courseId, s.tenantId])).rows;
    if (!course.length) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    const durationDays = Math.min(3650, Math.max(1, Math.round(Number(b.durationDays) || 30)));
    const maxUses = Math.min(1000, Math.max(1, Math.round(Number(b.maxUses) || 1)));
    const count = Math.min(50, Math.max(1, Math.round(Number(b.count) || 1)));

    const codes = await withTx(async (client) => {
      const out: string[] = [];
      for (let i = 0; i < count; i++) {
        let code = genCode();
        for (let attempt = 0; attempt < 5; attempt++) {
          const dup = await client.query('select 1 from activation_codes where code=$1', [code]);
          if (!dup.rows.length) break;
          code = genCode();
        }
        await client.query(
          'insert into activation_codes(tenant_id,course_id,code,duration_days,max_uses,created_by) values($1,$2,$3,$4,$5,$6)',
          [s.tenantId, courseId, code, durationDays, maxUses, s.userId]
        );
        out.push(code);
      }
      return out;
    });

    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'codes.create', entity: 'activation_code', metadata: { count, durationDays, maxUses, courseId } });
    return NextResponse.json({ codes }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر توليد الأكواد') }, { status: 400 });
  }
}



