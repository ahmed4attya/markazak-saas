import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const rows = (await query('select * from files where id=$1 and tenant_id=$2', [id, s.tenantId])).rows;
    if (!rows.length) return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    const row = rows[0];
    const role = typeof (s as { role?: string }).role === 'string' ? String((s as { role?: string }).role) : '';
    const userId = typeof (s as { userId?: string }).userId === 'string' ? String((s as { userId?: string }).userId) : '';
    const isPrivileged = role === 'admin' || role === 'owner';
    const isUploader = !!userId && String(row.uploaded_by || '') === userId;
    if (!isPrivileged && !isUploader) return NextResponse.json({ error: 'غير مصرح بحذف هذا الملف' }, { status: 403 });
    try { await del(row.storage_key); } catch { return NextResponse.json({ error: 'تعذر حذف الملف من التخزين - حاول مجدداً' }, { status: 500 }); }
    await query('delete from files where id=$1', [id]);
    if (userId) await query('insert into audit_logs(tenant_id,user_id,action,entity,entity_id) values($1,$2,$3,$4,$5)', [s.tenantId, userId, 'file.delete', 'file', id]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}