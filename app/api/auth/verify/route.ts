import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { hashResetToken } from '@/lib/auth-security';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const email = String(body?.email || '').toLowerCase().trim();
    const code = String(body?.code || '').trim();

    if (!email || !code || code.length < 4) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني والرمز' }, { status: 400 });
    }

    // Rate limit: 5 verify attempts per 15 mins
    const rl = await rateLimit(`verify:${ip}:${email}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'تم تجاوز عدد محاولات التحقق المسموح بها، يرجى المحاولة لاحقاً' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    const userRes = await query<any>(
      `select id, tenant_id, email, name, role, active, token_version, failed_attempts, locked_until
       from users
       where lower(email)=$1
       limit 1`,
      [email]
    );
    const user = userRes.rows[0];

    if (!user || !user.active) {
      return NextResponse.json({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' }, { status: 400 });
    }

    // Check account lockout
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return NextResponse.json(
        { error: 'الحساب مقفل مؤقتاً لتكرار المحاولات الخاطئة. حاول لاحقاً' },
        { status: 429 }
      );
    }

    const tokenHash = `otp:${hashResetToken(`otp:${email}:${code}`)}`;

    const resetRes = await query<any>(
      `select id, expires_at, used_at
       from password_resets
       where user_id=$1 and token_hash=$2
       order by created_at desc
       limit 1`,
      [user.id, tokenHash]
    );
    const reset = resetRes.rows[0];

    if (!reset || reset.used_at || new Date(reset.expires_at).getTime() < Date.now()) {
      const nextAttempts = (user.failed_attempts || 0) + 1;
      const isLocked = nextAttempts >= 5;
      const lockUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await query(
        'update users set failed_attempts=$1, locked_until=$2, updated_at=now() where id=$3',
        [nextAttempts, lockUntil, user.id]
      );
      return NextResponse.json({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' }, { status: 400 });
    }

    // Mark reset code as used
    await query('update password_resets set used_at=now() where id=$1', [reset.id]);

    // Reset failed attempts & update last_login
    await query(
      'update users set failed_attempts=0, locked_until=null, last_login_at=now(), updated_at=now() where id=$1',
      [user.id]
    );

    const token = await signSession({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      name: user.name,
      email: user.email,
      ver: user.token_version || 1,
    });

    await logAudit({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'auth.otp_login_success',
      entity: 'user',
      entityId: user.id,
      metadata: { ip },
    });

    const res = NextResponse.json({
      ok: true,
      success: true,
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });

    res.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 604800,
    });

    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
    return NextResponse.json({ error: 'حدث خطأ أثناء التحقق: ' + msg }, { status: 500 });
  }
}
