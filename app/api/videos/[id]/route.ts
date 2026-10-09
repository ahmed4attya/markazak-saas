import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const rows = (await query('select * from videos where id=$1 and tenant_id=$2', [id, s.tenantId])).rows;
    if (!rows.length) return NextResponse.json({ error: 'الفيديو غير موجود' }, { status: 404 });
    const row = rows[0];
    const allowed = isAdmin(s.role) || String(row.uploaded_by || '') === s.userId;
    if (!allowed) return NextResponse.json({ error: 'غير مصرح بحذف هذا الفيديو' }, { status: 403 });
    try { await del(row.storage_key); } catch { return NextResponse.json({ error: 'تعذر حذف الفيديو من التخزين - حاول مجدداً' }, { status: 500 }); }
    await query('delete from videos where id=$1', [id]);
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'video.delete', entity: 'video', entityId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}