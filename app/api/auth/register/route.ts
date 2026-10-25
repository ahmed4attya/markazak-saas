// app/api/auth/register/route.ts - New Account Registration & Approval Workflow
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { validatePasswordPolicy } from '@/lib/auth-security';
import { logAudit } from '@/lib/audit';
import { sendRegistrationReceivedUser, sendRegistrationPendingAdmin } from '@/lib/mailer';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'الاسم الكامل مطلوب ولا يقل عن حرفين').max(100),
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 خانات'),
  phone: z.string().trim().optional(),
  centerName: z.string().trim().optional(),
  role: z.enum(['teacher', 'staff', 'student']).default('teacher'),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    // 1) Rate limiting: max 3 registration requests per hour per IP
    const rl = await rateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح لطلبات التسجيل — يرجى المحاولة لاحقاً' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    // 2) Validate input
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'البيانات المدخلة غير صالحة' },
        { status: 400 }
      );
    }

    const { name, email, password, phone, centerName, role } = parsed.data;

    // 3) Password policy check
    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      return NextResponse.json(
        { error: policy.error || 'كلمة المرور لا تطابق معايير الأمان' },
        { status: 400 }
      );
    }

    // 4) Check for existing user (Anti-enumeration neutral response)
    const existingUser = await query<{ id: string }>(
      'select id from users where lower(email) = lower($1) limit 1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json({
        ok: true,
        success: true,
        message: 'تم استلام طلبك بنجاح! إذا كان بريدك مؤهلاً فستصلك رسالة التأكيد عبر البريد.',
      });
    }

    // Check existing pending request
    const existingReq = await query<{ id: string; status: string }>(
      'select id, status from registration_requests where lower(email) = lower($1) and status = $2 limit 1',
      [email, 'pending']
    );

    if (existingReq.rows.length > 0) {
      return NextResponse.json({
        ok: true,
        success: true,
        message: 'لديك طلب تسجيل قيد المراجعة بالفعل — ستصلك رسالة حال اعتماد الحساب.',
      });
    }

    // 5) Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Get default tenant if exists
    const defaultTenant = await query<{ id: string }>('select id from tenants limit 1');
    const tenantId = defaultTenant.rows[0]?.id || null;

    // 6) Insert into registration_requests
    const insertRes = await query<{ id: string }>(
      `insert into registration_requests(tenant_id, name, email, phone, center_name, role, password_hash, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'pending')
       returning id`,
      [tenantId, name, email, phone || null, centerName || null, role, passwordHash]
    );

    const requestId = insertRes.rows[0]?.id;

    // 7) Audit event
    if (tenantId && requestId) {
      await logAudit({
        tenantId,
        userId: requestId,
        action: 'auth.registration_requested',
        entity: 'registration_request',
        entityId: requestId,
        metadata: { email, name, role, ip },
      }).catch(() => {});
    }

    // 8) Send confirmation email to applicant
    await sendRegistrationReceivedUser(email, { name, centerName }).catch(() => {});

    // 9) Send notification email to admin(s)
    const adminRows = await query<{ email: string }>(
      `select email from users where role in ('owner', 'admin') and active = true limit 5`
    );
    const adminEmails = [
      ...new Set([
        process.env.ADMIN_EMAIL,
        process.env.ADMIN_NOTIFY_EMAIL,
        ...adminRows.rows.map(r => r.email),
      ].filter(Boolean) as string[]),
    ];

    for (const adm of adminEmails) {
      await sendRegistrationPendingAdmin(adm, {
        name,
        email,
        phone: phone || undefined,
        centerName: centerName || undefined,
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      success: true,
      message: 'تم إرسال طلب انضمامك بنجاح! طلبك الآن قيد مراجعة واعتماد الإدارة.',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطأ في معالجة طلب التسجيل';
    return NextResponse.json({ error: 'تعذر إتمام التسجيل: ' + msg }, { status: 500 });
  }
}
