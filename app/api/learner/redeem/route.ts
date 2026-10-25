import { NextResponse } from 'next/server';
import { safeError, withTx } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';

// Scope 6: student redeems an activation code -> course subscription granted/extended.
// Rules: code active + uses remaining + one redemption per (code,student);
// extends sub_end if the subscription is still live, else starts a fresh period;
// no enrollment yet -> creates one in the course's first group.
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rl = await rateLimit('redeem:' + s.userId, 10, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'محاولات كثيرة — انتظر قليلا' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } });

  try {
    const b = (await req.json()) as { code?: string };
    const code = String(b.code || '').trim().toUpperCase();
    if (!code) return NextResponse.json({ error: 'أدخل كود التفعيل' }, { status: 400 });

    const result = (await withTx(async (client) => {
      const c = (await client.query(
        `select ac.id, ac.course_id, ac.duration_days, ac.max_uses, ac.used_count, c.name as course_name
         from activation_codes ac join courses c on c.id = ac.course_id
         where ac.code = $1 and ac.tenant_id = $2 for update`,
        [code, s.tenantId]
      )).rows[0] as any;
      if (!c) throw Object.assign(new Error('كود غير صالح'), { status: 404 });
      if (!c.course_id) throw Object.assign(new Error('الكود غير مرتبط بدورة'), { status: 400 });
      if (!c.duration_days || c.duration_days < 1) throw Object.assign(new Error('كود غير صالح'), { status: 400 });

      const st = (await client.query('select id from students where user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows[0] as any;
      if (!st) throw Object.assign(new Error('لا يوجد سجل طالب مرتبط بحسابك'), { status: 400 });

      const already = (await client.query('select 1 from code_redemptions where code_id=$1 and student_id=$2', [c.id, st.id])).rows;
      if (already.length) throw Object.assign(new Error('لقد استخدمت هذا الكود من قبل'), { status: 409 });
      if (c.used_count >= c.max_uses) throw Object.assign(new Error('الكود استُهلك بالكامل'), { status: 409 });

      const group = (await client.query(
        'select id from groups where course_id=$1 and tenant_id=$2 order by created_at limit 1',
        [c.course_id, s.tenantId]
      )).rows[0] as any;
      if (!group) throw Object.assign(new Error('الدورة بلا مجموعة بعد — تواصل مع الإدارة'), { status: 400 });

      const existing = (await client.query(
        'select id, sub_start, sub_end from enrollments where group_id=$1 and student_id=$2 for update',
        [group.id, st.id]
      )).rows[0] as any;

      let subEnd: string;
      let resumed = false;
      if (existing) {
        const now = new Date();
        const curEnd = existing.sub_end ? new Date(existing.sub_end) : null;
        const base = curEnd && curEnd > now ? curEnd : now;
        const newEnd = new Date(base.getTime() + c.duration_days * 86400000);
        subEnd = newEnd.toISOString().slice(0, 10);
        await client.query(
          `update enrollments set sub_end=$3, status='active' where id=$1 and tenant_id=$2`,
          [existing.id, s.tenantId, subEnd]
        );
        resumed = true;
      } else {
        const now = new Date();
        subEnd = new Date(now.getTime() + c.duration_days * 86400000).toISOString().slice(0, 10);
        await client.query(
          `insert into enrollments(tenant_id,group_id,student_id,status,price,discount,sub_start,sub_end)
           values($1,$2,$3,'active',0,0,$4,$5)`,
          [s.tenantId, group.id, st.id, now.toISOString().slice(0, 10), subEnd]
        );
      }

      await client.query('update activation_codes set used_count = used_count + 1 where id=$1', [c.id]);
      await client.query(
        'insert into code_redemptions(tenant_id,code_id,student_id) values($1,$2,$3)',
        [s.tenantId, c.id, st.id]
      );
      return { courseName: c.course_name as string, subEnd, resumed };
    }));

    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'code.redeem', entity: 'activation_code', entityId: code, metadata: { course: safeName(result.courseName) } });
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    const status = typeof e?.status === 'number' ? e.status : 400;
    return NextResponse.json({ error: e instanceof Error ? e.message : 'تعذر التفعيل' }, { status });
  }
}

function safeName(x: unknown): string {
  return String(x ?? '').slice(0, 80);
}



