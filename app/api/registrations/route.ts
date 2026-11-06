// app/api/registrations/route.ts - Admin Management of Registration Requests
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { sendRegistrationApproved, sendRegistrationRejected } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'غير مصرح — مخصص لإدارة المنصة' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  try {
    const res = await query(
      `select id, tenant_id, name, email, phone, center_name, role, status, rejection_reason, created_at, reviewed_at
       from registration_requests
       where ($1 = 'all' or status = $1)
       order by created_at desc
       limit 100`,
      [status]
    );

    return NextResponse.json({ ok: true, requests: res.rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
    return NextResponse.json({ error: 'تعذر جلب طلبات التسجيل: ' + msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'owner' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'غير مصرح — مخصص لإدارة المنصة' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { requestId, action, reason } = body;

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'معرّف الطلب والإجراء (approve/reject) مطلوبان' }, { status: 400 });
    }

    const reqRes = await query<{
      id: string;
      tenant_id: string | null;
      name: string;
      email: string;
      phone: string | null;
      center_name: string | null;
      role: string;
      password_hash: string;
      status: string;
    }>(
      'select * from registration_requests where id = $1 limit 1',
      [requestId]
    );

    const reg = reqRes.rows[0];
    if (!reg) {
      return NextResponse.json({ error: 'طلب التسجيل غير موجود' }, { status: 404 });
    }

    if (reg.status !== 'pending') {
      return NextResponse.json({ error: `تم البت في هذا الطلب مسبقاً (${reg.status})` }, { status: 400 });
    }

    const tenantId = reg.tenant_id || session.tenantId;

    if (action === 'approve') {
      // 1. Create active user account
      const userRes = await query<{ id: string }>(
        `insert into users (tenant_id, email, name, phone, password_hash, role, active)
         values ($1, $2, $3, $4, $5, $6, true)
         on conflict (email) do update
         set active = true, role = $6, updated_at = now()
         returning id`,
        [tenantId, reg.email, reg.name, reg.phone, reg.password_hash, reg.role]
      );

      const newUserId = userRes.rows[0]?.id;

      // 2. Mark request approved
      await query(
        `update registration_requests
         set status = 'approved', reviewed_by = $1, reviewed_at = now(), updated_at = now()
         where id = $2`,
        [session.userId, requestId]
      );

      // 3. Audit log
      if (tenantId) {
        await logAudit({
          tenantId,
          userId: session.userId,
          action: 'registration.approved',
          entity: 'user',
          entityId: newUserId,
          metadata: { email: reg.email, name: reg.name, role: reg.role },
        }).catch(() => {});
      }

      // 4. Send approval email to applicant
      await sendRegistrationApproved(reg.email, { name: reg.name }).catch(() => {});

      return NextResponse.json({
        ok: true,
        success: true,
        message: `تم اعتماد وتفعيل حساب ${reg.name} بنجاح وإرسال إشعار التفعيل بالبريد.`,
      });
    } else {
      // Reject action
      const rejectionReason = String(reason || 'لم يستوفِ الطلب الشروط المطلوبة').trim();

      await query(
        `update registration_requests
         set status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = now(), updated_at = now()
         where id = $3`,
        [rejectionReason, session.userId, requestId]
      );

      // Audit log
      if (tenantId) {
        await logAudit({
          tenantId,
          userId: session.userId,
          action: 'registration.rejected',
          entity: 'registration_request',
          entityId: requestId,
          metadata: { email: reg.email, name: reg.name, reason: rejectionReason },
        }).catch(() => {});
      }

      // Send rejection notification email
      await sendRegistrationRejected(reg.email, { name: reg.name, reason: rejectionReason }).catch(() => {});

      return NextResponse.json({
        ok: true,
        success: true,
        message: `تم رفض الطلب وإشعار المتقدم بالبريد الإلكتروني.`,
      });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
    return NextResponse.json({ error: 'فشل معالجة الطلب: ' + msg }, { status: 500 });
  }
}
