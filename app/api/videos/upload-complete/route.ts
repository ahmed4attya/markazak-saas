import { NextResponse } from 'next/server';
import { head } from '@vercel/blob';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { MAX_VIDEO_BYTES, isAllowedVideoFile } from '@/lib/video-storage';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const b = (await req.json()) as { url?: string; pathname?: string; title?: string; contentType?: string; sizeBytes?: number; durationSeconds?: number | null; courseId?: string | null; groupId?: string | null };
    const url = typeof b.url === 'string' ? b.url : '';
    const pathname = typeof b.pathname === 'string' ? b.pathname : '';
    const title = typeof b.title === 'string' ? b.title : '';
    const sizeBytes = typeof b.sizeBytes === 'number' ? b.sizeBytes : 0;
    const dur = typeof b.durationSeconds === 'number' && Number.isFinite(b.durationSeconds) ? Math.round(b.durationSeconds) : null;
    if (!url || !pathname.startsWith('tenants/' + s.tenantId + '/videos/')) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
    if (!title || !isAllowedVideoFile(title, b.contentType)) return NextResponse.json({ error: 'نوع الفيديو غير مسموح' }, { status: 400 });
    if (sizeBytes <= 0 || sizeBytes > MAX_VIDEO_BYTES) return NextResponse.json({ error: 'حجم غير مسموح' }, { status: 400 });
    try { await head(url); } catch { return NextResponse.json({ error: 'الفيديو غير موجود في التخزين' }, { status: 400 }); }
    if (b.courseId) {
      const c = await query('select id from courses where id=$1 and tenant_id=$2', [b.courseId, s.tenantId]);
      if (!c.rows.length) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 400 });
    }
    const ins = await query(
      'insert into videos(tenant_id,course_id,group_id,title,mime,size_bytes,duration_seconds,storage_key,uploaded_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (storage_key) do nothing returning *',
      [s.tenantId, b.courseId || null, b.groupId || null, title, b.contentType || null, sizeBytes, dur, url, s.userId]
    );
    if (ins.rows.length) {
      await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'video.upload', entity: 'video', entityId: String(ins.rows[0].id) });
      return NextResponse.json(ins.rows[0], { status: 201 });
    }
    const ex = await query(
      'update videos set course_id=coalesce($2,course_id), group_id=coalesce($3,group_id) where storage_key=$1 and tenant_id=$4 returning *',
      [url, b.courseId || null, b.groupId || null, s.tenantId]
    );
    return NextResponse.json(ex.rows[0] || { ok: true });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}