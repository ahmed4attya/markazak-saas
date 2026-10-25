import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { logAudit } from '@/lib/audit';
import { comparePasswordSafe } from '@/lib/auth-security';
import { z } from 'zod';

const GENERIC_LOGIN_ERROR = 'بيانات الدخول غير صحيحة';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  try {
    const b = await req.json();
    const emailForLimit = String(b?.email || '').toLowerCase().trim();
    const limitKey = `login:${ip}:${emailForLimit}`;
    const rl = await rateLimit(limitKey, 20, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'محاولات كثيرة — انتظر قليلاً ثم حاول مجدداً' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    const x = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(b);
    let u: any;
    try {
      const r = await query<any>(
        `select id, tenant_id, email, name, password_hash, role, active, token_version, failed_attempts, locked_until
         from users
         where lower(email)=lower($1)
         limit 1`,
        [x.email]
      );
      u = r.rows[0];
    } catch (dbErr: any) {
      if (dbErr?.code === '42703') {
        // Missing column (token_version, failed_attempts, or locked_until) -> self-healing ALTER
        await query(`
          alter table users add column if not exists token_version int not null default 1;
          alter table users add column if not exists failed_attempts int not null default 0;
          alter table users add column if not exists locked_until timestamptz default null;
        `);
        const retryR = await query<any>(
          `select id, tenant_id, email, name, password_hash, role, active, token_version, failed_attempts, locked_until
           from users
           where lower(email)=lower($1)
           limit 1`,
          [x.email]
        );
        u = retryR.rows[0];
      } else {
        throw dbErr;
      }
    }

    // Check account lockout
    if (u?.locked_until && new Date(u.locked_until).getTime() > Date.now()) {
      const retryAfterSec = Math.max(1, Math.ceil((new Date(u.locked_until).getTime() - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'الحساب مقفل مؤقتاً لتكرار المحاولات الخاطئة. حاول لاحقاً' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      );
    }

    // Timing-safe password verification
    const passwordMatch = await comparePasswordSafe(x.password, u?.password_hash);

    if (!u || !u.active || !passwordMatch) {
      if (u) {
        const nextAttempts = (u.failed_attempts || 0) + 1;
        const isLocked = nextAttempts >= 5;
        const lockUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await query(
          'update users set failed_attempts=$1, locked_until=$2, updated_at=now() where id=$3',
          [nextAttempts, lockUntil, u.id]
        );
        if (isLocked) {
          await logAudit({
            tenantId: u.tenant_id,
            userId: u.id,
            action: 'auth.account_locked',
            entity: 'user',
            entityId: u.id,
            metadata: { attempts: nextAttempts, ip },
          });
          return NextResponse.json(
            { error: 'الحساب مقفل مؤقتاً لتكرار المحاولات الخاطئة. حاول لاحقاً' },
            { status: 429, headers: { 'Retry-After': '900' } }
          );
        }
      }
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    // Successful login: reset attempts and update last_login_at
    await query(
      'update users set failed_attempts=0, locked_until=null, last_login_at=now(), updated_at=now() where id=$1',
      [u.id]
    );

    const token = await signSession({
      userId: u.id,
      tenantId: u.tenant_id,
      role: u.role,
      name: u.name,
      email: u.email,
      ver: u.token_version || 1,
    });

    const res = NextResponse.json({
      ok: true,
      success: true,
      token,
      user: { name: u.name, email: u.email, role: u.role },
    });
    res.cookies.set('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 604800,
    });
    return res;
  } catch (err: any) {
    console.error('[AUTH_LOGIN_ERROR]', err?.message || err);
    return NextResponse.json({ error: 'تعذر تسجيل الدخول' }, { status: 400 });
  }
}
