import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

// Public lead capture from the landing contact form (platform-level, no tenant).
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await rateLimit('leads:' + ip, 5, 3600000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'محاولات كثيرة — حاول لاحقاً' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
    );
  }
  try {
    const b = await req.json();
    const name = String(b.name || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const message = String(b.message || '').trim();
    if (name.length < 2) return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    if (message.length > 2000) return NextResponse.json({ error: 'الرسالة أطول من الحد (2000 حرف)' }, { status: 400 });
    await query('insert into leads(name,email,message) values($1,$2,$3)', [name, email, message || null]);
    // V-mission: instant owner notification (Telegram) - best-effort, never breaks the capture
    {
      const { telegramNotify } = await import('@/lib/telegram-notify');
      await telegramNotify('<b>عميل محتمل جديد</b>\nالاسم: ' + name.replace(/</g, '<') + '\nالبريد: ' + email.replace(/</g, '<') + (message ? '\nالرسالة: ' + message.replace(/</g, '<').slice(0, 500) : ''));
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر إرسال الطلب') }, { status: 400 });
  }
}

// Admin view of captured leads.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rows = (await query('select id, name, email, message, created_at from leads order by created_at desc limit 200')).rows;
  return NextResponse.json(rows);
}



