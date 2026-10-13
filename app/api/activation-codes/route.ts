import { NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import { activationCodeInputSchema } from '@/lib/activation-contract';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  return NextResponse.json((await query('select id,code_prefix,plan_code,max_uses,used_count,expires_at,active,created_at from activation_codes where tenant_id=$1 order by created_at desc limit 500', [s.tenantId])).rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const input = activationCodeInputSchema.parse(await req.json());
    const raw = `MKZ-${input.planCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${randomBytes(12).toString('hex').toUpperCase()}`;
    const hash = createHash('sha256').update(raw).digest('hex');
    const row = (await query('insert into activation_codes(tenant_id,code_prefix,code_hash,plan_code,max_uses,expires_at,created_by) values($1,$2,$3,$4,$5,$6,$7) returning id,code_prefix,plan_code,max_uses,expires_at,created_at', [s.tenantId, raw.slice(0, 16), hash, input.planCode, input.maxUses, input.expiresAt, s.userId])).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'activation.create', entity: 'activation_code', entityId: String(row.id), metadata: { planCode: input.planCode, maxUses: input.maxUses } });
    return NextResponse.json({ ...row, code: raw }, { status: 201 });
  } catch (e) { return NextResponse.json({ error: safeError(e, 'تعذر إنشاء كود التفعيل') }, { status: 400 }); }
}
