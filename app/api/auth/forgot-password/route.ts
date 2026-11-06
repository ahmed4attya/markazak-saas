import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { generateResetToken, hashResetToken } from '@/lib/auth-security';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const UNIFORM_MESSAGE = 'إذا كان البريد الإلكتروني مسجلاً لدينا، فستصلك تعليمات استعادة كلمة المرور.';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  try {
    const b = await req.json();
    const email = String(b?.email || '').toLowerCase().trim();

    // Rate limit: 3 requests per hour per email/IP
    const limitKey = `forgot:${ip}:${email}`;
    const rl = await rateLimit(limitKey, 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'محاولات كثيرة — يرجى الانتظار والمحاولة لاحقاً' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    const parsed = z.object({ email: z.string().email() }).safeParse({ email });
    if (!parsed.success) {
      return NextResponse.json({ ok: true, message: UNIFORM_MESSAGE });
    }

    const r = await query<{ id: string; tenant_id: string; active: boolean }>(
      'select id, tenant_id, active from users where lower(email)=lower($1) limit 1',
      [email]
    );
    const user = r.rows[0];

    if (user && user.active) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await query(
        'insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)',
        [user.id, tokenHash, expiresAt]
      );

      await logAudit({
        tenantId: user.tenant_id,
        userId: user.id,
        action: 'auth.forgot_password_requested',
        entity: 'user',
        entityId: user.id,
        metadata: { ip },
      });

      // If in non-production, return raw token for test verification
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          ok: true,
          message: UNIFORM_MESSAGE,
          debugToken: rawToken,
        });
      }
    }

    return NextResponse.json({ ok: true, message: UNIFORM_MESSAGE });
  } catch {
    return NextResponse.json({ ok: true, message: UNIFORM_MESSAGE });
  }
}
