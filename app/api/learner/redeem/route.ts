import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { withTx, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { redeemCodeSchema } from '@/lib/activation-contract';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'التفعيل متاح لحساب الطالب فقط' }, { status: 403 });
  try {
    const input = redeemCodeSchema.parse(await req.json()); const hash = createHash('sha256').update(input.code.toUpperCase()).digest('hex');
    const result = await withTx(async (client) => {
      const student = (await client.query('select id from students where tenant_id=$1 and student_user_id=$2 for update', [s.tenantId, s.userId])).rows[0];
      if (!student) throw Object.assign(new Error('لا يوجد سجل طالب مرتبط'), { code: 'STUDENT_NOT_LINKED' });
      const code = (await client.query('select * from activation_codes where tenant_id=$1 and code_hash=$2 for update', [s.tenantId, hash])).rows[0];
      if (!code || !code.active) throw Object.assign(new Error('كود التفعيل غير صالح'), { code: 'INVALID_CODE' });
      if (code.expires_at && new Date(code.expires_at).getTime() <= Date.now()) throw Object.assign(new Error('انتهت صلاحية كود التفعيل'), { code: 'EXPIRED_CODE' });
      if (Number(code.used_count) >= Number(code.max_uses)) throw Object.assign(new Error('اكتمل استخدام كود التفعيل'), { code: 'CODE_EXHAUSTED' });
      const entitlement = (await client.query('insert into student_entitlements(tenant_id,student_id,activation_code_id,plan_code,ends_at) values($1,$2,$3,$4,$5) returning *', [s.tenantId, student.id, code.id, code.plan_code, code.expires_at])).rows[0];
      await client.query('update activation_codes set used_count=used_count+1,active=case when used_count+1>=max_uses then false else active end where id=$1 and tenant_id=$2', [code.id, s.tenantId]);
      return entitlement;
    });
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'activation.redeem', entity: 'student_entitlement', entityId: String(result.id), metadata: { planCode: result.plan_code } });
    return NextResponse.json(result, { status: 201 });
  } catch (e) { return NextResponse.json({ error: safeError(e, e instanceof Error ? e.message : 'تعذر تفعيل الكود') }, { status: 400 }); }
}
