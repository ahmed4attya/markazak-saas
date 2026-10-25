import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { comparePasswordSafe } from '@/lib/auth-security';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'كلمة المرور يجب أن لا تقل عن 6 أحرف'),
  targetUserId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { currentPassword, newPassword, targetUserId } = parsed.data;

    const isAdminUser = ['admin', 'owner', 'manager'].includes(session.role);
    const userIdToChange = (targetUserId && isAdminUser) ? targetUserId : session.userId;

    const userRes = await query<any>(
      'SELECT id, tenant_id, password_hash, email FROM users WHERE id = $1 AND tenant_id = $2',
      [userIdToChange, session.tenantId]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const targetUser = userRes.rows[0];

    // If changing own password and currentPassword was supplied, verify it
    if (userIdToChange === session.userId && currentPassword) {
      const match = await comparePasswordSafe(currentPassword, targetUser.password_hash);
      if (!match) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users 
       SET password_hash = $1, failed_attempts = 0, locked_until = NULL, updated_at = NOW() 
       WHERE id = $2 AND tenant_id = $3`,
      [hash, userIdToChange, session.tenantId]
    );

    await logAudit({
      tenantId: session.tenantId,
      userId: session.userId,
      action: 'user.password_change',
      entity: 'user',
      entityId: userIdToChange,
      metadata: { changedBy: session.userId, targetEmail: targetUser.email },
    });

    return NextResponse.json({ ok: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err: any) {
    console.error('[CHANGE_PASSWORD_ERROR]', err);
    return NextResponse.json({ error: 'تعذر تغيير كلمة المرور' }, { status: 500 });
  }
}
