import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { hashResetToken } from '@/lib/auth-security';
import { logAudit } from '@/lib/audit';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const email = String(body?.email || '').toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'يرجى إدخال بريد إلكتروني صحيح' }, { status: 400 });
    }

    // Rate limit: 5 requests per 15 mins per email
    const rl = await rateLimit(`otp:${ip}:${email}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح لطلب الرموز، يرجى المحاولة لاحقاً' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    const userRes = await query<{ id: string; tenant_id: string; active: boolean; locked_until: string | null }>(
      'select id, tenant_id, active, locked_until from users where lower(email)=$1 limit 1',
      [email]
    );
    const user = userRes.rows[0];

    // Check account lockout
    if (user?.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return NextResponse.json(
        { error: 'الحساب مقفل مؤقتاً لتكرار المحاولات الخاطئة. حاول لاحقاً' },
        { status: 429 }
      );
    }

    // Generate secure 6-digit OTP code
    const code = crypto.randomInt(100000, 999999).toString();
    const tokenHash = hashResetToken(`otp:${email}:${code}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (user && user.active) {
      // Invalidate prior unused OTPs for this user
      await query(
        `update password_resets set used_at=now() where user_id=$1 and used_at is null and token_hash like 'otp:%'`,
        [user.id]
      ).catch(() => {});

      await query(
        `insert into password_resets(user_id, token_hash, expires_at) values($1, $2, $3)`,
        [user.id, `otp:${tokenHash}`, expiresAt]
      );

      await logAudit({
        tenantId: user.tenant_id,
        userId: user.id,
        action: 'auth.otp_requested',
        entity: 'user',
        entityId: user.id,
        metadata: { ip },
      });

      // Dispatch system OTP email via configured mailer
      await sendOtpEmail(email, code, 10).catch(() => {});
    }

    // Always return generic success to prevent enumeration
    return NextResponse.json({
      ok: true,
      success: true,
      message: 'تم إرسال رمز الدخول بنجاح! تحقق من بريدك الإلكتروني',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
    return NextResponse.json({ error: 'تعذر إرسال رمز التحقق: ' + msg }, { status: 500 });
  }
}
