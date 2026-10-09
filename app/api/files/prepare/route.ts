import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MAX_FILE_BYTES, isAllowedFile, buildPathname } from '@/lib/storage';

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const b = (await req.json()) as { filename?: string; contentType?: string; sizeBytes?: number; courseId?: string | null; groupId?: string | null };
    const filename = typeof b.filename === 'string' ? b.filename : '';
    const contentType = typeof b.contentType === 'string' ? b.contentType : '';
    const sizeBytes = typeof b.sizeBytes === 'number' ? b.sizeBytes : 0;
    if (!filename || !isAllowedFile(filename, contentType)) return NextResponse.json({ error: 'نوع الملف غير مسموح' }, { status: 400 });
    if (sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) return NextResponse.json({ error: 'حجم الملف غير مسموح (الحد 100MB)' }, { status: 400 });
    if (b.courseId) {
      const c = await query('select id from courses where id=$1 and tenant_id=$2', [b.courseId, s.tenantId]);
      if (!c.rows.length) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 400 });
    }
    if (b.groupId) {
      const g = await query('select id from groups where id=$1 and tenant_id=$2', [b.groupId, s.tenantId]);
      if (!g.rows.length) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 400 });
    }
    return NextResponse.json({ pathname: buildPathname(s.tenantId, filename), maxBytes: MAX_FILE_BYTES });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}