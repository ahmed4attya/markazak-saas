import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MAX_VIDEO_BYTES, isAllowedVideoFile, buildVideoPathname } from '@/lib/video-storage';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const b = (await req.json()) as { filename?: string; contentType?: string; sizeBytes?: number; courseId?: string | null; groupId?: string | null };
    const filename = typeof b.filename === 'string' ? b.filename : '';
    const sizeBytes = typeof b.sizeBytes === 'number' ? b.sizeBytes : 0;
    if (!filename || !isAllowedVideoFile(filename, b.contentType)) return NextResponse.json({ error: 'نوع الفيديو غير مسموح' }, { status: 400 });
    if (sizeBytes <= 0 || sizeBytes > MAX_VIDEO_BYTES) return NextResponse.json({ error: 'حجم الفيديو غير مسموح (الحد 500MB)' }, { status: 400 });
    if (b.courseId) {
      const c = await query('select id from courses where id=$1 and tenant_id=$2', [b.courseId, s.tenantId]);
      if (!c.rows.length) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 400 });
    }
    if (b.groupId) {
      const g = await query('select id from groups where id=$1 and tenant_id=$2', [b.groupId, s.tenantId]);
      if (!g.rows.length) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 400 });
    }
    return NextResponse.json({ pathname: buildVideoPathname(s.tenantId, filename), maxBytes: MAX_VIDEO_BYTES });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}