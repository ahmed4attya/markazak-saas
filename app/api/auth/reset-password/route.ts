import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { hashResetToken, validatePasswordPolicy } from '@/lib/auth-security';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const resetSchema = z.object({
  token: z.string().min(1, 'رمز التحقق مطلوب'),
  newPassword: z.string().min(1, 'كلمة المرور الجديدة مطلوبة'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  try {
    const b = await req.json();
    const parsed = resetSchema.safeParse(b);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { token, newPassword } = parsed.data;

    // Rate limit password resets per IP
    const limitKey = `reset:${ip}`;
    const rl = await rateLimit(limitKey, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'محاولات كثيرة — يرجى الانتظار والمحاولة لاحقاً' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    // Password policy check (12+ characters per NIST SP 800-63B / daftr-re)
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return NextResponse.json({ error: policy.error }, { status: 400 });
    }

    const tokenHash = hashResetToken(token);

    // Find valid unexpired, unused reset record
    const r = await query<{ id: string; user_id: string; tenant_id: string }>(
      `select pr.id, pr.user_id, u.tenant_id
       from password_resets pr
       join users u on u.id = pr.user_id
       where pr.token_hash = $1
         and pr.used_at is null
         and pr.expires_at > now()
       limit 1`,
      [tokenHash]
    );

    const resetRecord = r.rows[0];
    if (!resetRecord) {
      return NextResponse.json(
        { error: 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية' },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password, increment token_version (invalidating all existing sessions), and reset lockouts
    await query(
      `update users
       set password_hash = $1,
           token_version = token_version + 1,
           failed_attempts = 0,
           locked_until = null,
           updated_at = now()
       where id = $2`,
      [newHash, resetRecord.user_id]
    );

    // Mark reset record as used (one-time use)
    await query('update password_resets set used_at = now() where id = $1', [resetRecord.id]);

    await logAudit({
      tenantId: resetRecord.tenant_id,
      userId: resetRecord.user_id,
      action: 'auth.password_reset_success',
      entity: 'user',
      entityId: resetRecord.user_id,
      metadata: { ip },
    });

    return NextResponse.json({
      ok: true,
      message: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
    });
  } catch {
    return NextResponse.json({ error: 'تعذر استعادة كلمة المرور' }, { status: 400 });
  }
}
