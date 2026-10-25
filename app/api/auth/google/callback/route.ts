// app/api/auth/google/callback/route.ts - Google OAuth Callback Handler
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'markazak-saas.vercel.app';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || `${proto}://${host}`;
  const origin = baseUrl.replace(/\/$/, '');
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (error || !code) {
    const errorMsg = error ? `فشل الدخول بحساب Google (${error})` : 'لم يتم استلام رمز التفويض من Google';
    return NextResponse.redirect(new URL(`/login?authError=${encodeURIComponent(errorMsg)}`, origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/login?authError=' + encodeURIComponent('إعدادات Google OAuth غير مكتملة على الخادم'), origin)
    );
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Google token exchange error:', err);
      return NextResponse.redirect(
        new URL('/login?authError=' + encodeURIComponent('تعذر التحقق من حساب Google لدى الخادم'), origin)
      );
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;

    // 2. Fetch user profile from Google
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userinfoRes.ok) {
      return NextResponse.redirect(
        new URL('/login?authError=' + encodeURIComponent('تعذر جلب بيانات الملف الشخصي من Google'), origin)
      );
    }

    const googleUser = await userinfoRes.json();
    const email = String(googleUser.email || '').toLowerCase().trim();
    const name = String(googleUser.name || 'مستخدم Google').trim();

    if (!email) {
      return NextResponse.redirect(
        new URL('/login?authError=' + encodeURIComponent('لم يتم الحصول على بريد إلكتروني صالح من حساب Google'), origin)
      );
    }

    // 3. Look up user in database
    const userRes = await query<{
      id: string;
      tenant_id: string;
      email: string;
      name: string;
      role: string;
      active: boolean;
      token_version: number;
      locked_until: string | null;
    }>(
      `select id, tenant_id, email, name, role, active, token_version, locked_until
       from users
       where lower(email) = lower($1)
       limit 1`,
      [email]
    );

    const user = userRes.rows[0];

    // If account doesn't exist
    if (!user) {
      return NextResponse.redirect(
        new URL(
          `/register?googleEmail=${encodeURIComponent(email)}&googleName=${encodeURIComponent(name)}&authError=${encodeURIComponent(
            'هذا البريد غير مسجل مسبقاً — يرجى تقديم طلب الانضمام كمعلم أو مركز جديد'
          )}`,
          origin
        )
      );
    }

    // If account is locked
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return NextResponse.redirect(
        new URL('/login?authError=' + encodeURIComponent('الحساب مقفل مؤقتاً لأسباب أمنية. يرجى المحاولة لاحقاً'), origin)
      );
    }

    // If account is inactive / pending review
    if (!user.active) {
      return NextResponse.redirect(
        new URL(
          '/login?authError=' + encodeURIComponent('حسابك قيد مراجعة واعتماد الإدارة — ستصلك رسالة فور تفعيله'),
          origin
        )
      );
    }

    // Update last_login_at
    await query(
      'update users set last_login_at = now(), failed_attempts = 0, locked_until = null, updated_at = now() where id = $1',
      [user.id]
    );

    // Audit log
    await logAudit({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'auth.google_login_success',
      entity: 'user',
      entityId: user.id,
      metadata: { email },
    }).catch(() => {});

    // Sign session token
    const token = await signSession({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      name: user.name,
      email: user.email,
      ver: user.token_version || 1,
    });

    const destination = user.role === 'student' || user.role === 'guardian' ? '/portal' : '/dashboard';
    const redirectResponse = NextResponse.redirect(new URL(destination, origin));

    redirectResponse.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 604800,
    });

    return redirectResponse;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'خطأ غير متوقع';
    console.error('Google OAuth callback error:', msg);
    return NextResponse.redirect(
      new URL('/login?authError=' + encodeURIComponent('فشلت المصادقة عبر Google: ' + msg), origin)
    );
  }
}
