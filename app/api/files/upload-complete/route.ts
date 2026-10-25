import { NextResponse } from 'next/server';
import { head } from '@vercel/blob';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MAX_FILE_BYTES, isAllowedFile } from '@/lib/storage';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const b = (await req.json()) as { url?: string; pathname?: string; name?: string; contentType?: string; sizeBytes?: number; courseId?: string | null; groupId?: string | null };
    const url = typeof b.url === 'string' ? b.url : '';
    const pathname = typeof b.pathname === 'string' ? b.pathname : '';
    const name = typeof b.name === 'string' ? b.name : '';
    const sizeBytes = typeof b.sizeBytes === 'number' ? b.sizeBytes : 0;
    if (!url || !pathname.startsWith('tenants/' + s.tenantId + '/')) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
    if (!name || !isAllowedFile(name, b.contentType)) return NextResponse.json({ error: 'نوع الملف غير مسموح' }, { status: 400 });
    if (sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) return NextResponse.json({ error: 'حجم غير مسموح' }, { status: 400 });
    try { await head(url); } catch { return NextResponse.json({ error: 'الملف غير موجود في التخزين' }, { status: 400 }); }
    if (b.courseId) {
      const c = await query('select id from courses where id=$1 and tenant_id=$2', [b.courseId, s.tenantId]);
      if (!c.rows.length) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 400 });
    }
    if (b.groupId) {
      const g = await query('select id from groups where id=$1 and tenant_id=$2', [b.groupId, s.tenantId]);
      if (!g.rows.length) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 400 });
    }
    const userId = typeof (s as { userId?: string }).userId === 'string' ? (s as { userId?: string }).userId : null;
    const ins = await query(
      'insert into files(tenant_id,course_id,group_id,name,mime,size_bytes,storage_key,uploaded_by) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict (storage_key) do nothing returning *',
      [s.tenantId, b.courseId || null, b.groupId || null, name, b.contentType || null, sizeBytes, url, userId]
    );
    if (ins.rows.length) {
      if (userId) await query('insert into audit_logs(tenant_id,user_id,action,entity,entity_id) values($1,$2,$3,$4,$5)', [s.tenantId, userId, 'file.upload', 'file', String(ins.rows[0].id)]);
      return NextResponse.json(ins.rows[0], { status: 201 });
    }
    // FIX: race with the onUploadCompleted callback - link course/group if we lost the insert.
    const ex = await query(
      'update files set course_id=coalesce($2,course_id), group_id=coalesce($3,group_id) where storage_key=$1 and tenant_id=$4 returning *',
      [url, b.courseId || null, b.groupId || null, s.tenantId]
    );
    return NextResponse.json(ex.rows[0] || { ok: true });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}