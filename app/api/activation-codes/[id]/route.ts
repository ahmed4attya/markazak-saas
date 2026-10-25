import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

type Context = { params: Promise<{ id: string }> };

// Deactivate/reactivate a code (admin-only).
export async function PATCH(req: Request, context: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await context.params;
  const b = (await req.json().catch(() => ({}))) as { active?: boolean };
  if (typeof b.active !== 'boolean') return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const r = (await query(
    'update activation_codes set active=$3 where id=$1 and tenant_id=$2 returning id, code, active',
    [id, s.tenantId, b.active]
  )).rows[0] as any;
  if (!r) return NextResponse.json({ error: 'الكود غير موجود' }, { status: 404 });
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: b.active ? 'code.activate' : 'code.deactivate', entity: 'activation_code', entityId: id });
  return NextResponse.json(r);
}
