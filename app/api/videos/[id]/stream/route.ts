// Session-gated Range passthrough: the Blob URL never leaves the server.
// video.play is audited once per initial load (no Range, or Range starts at 0).
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const rows = (await query('select * from videos where id=$1 and tenant_id=$2', [id, s.tenantId])).rows;
  if (!rows.length) return NextResponse.json({ error: 'الفيديو غير موجود' }, { status: 404 });
  const row = rows[0];

  const isAdminOrStaff = ['owner', 'admin', 'manager', 'staff'].includes(s.role);
  if (!isAdminOrStaff) {
    let isFreeOrOpen = false;
    if (row.course_id) {
      const c = await query(
        "select 1 from courses where id=$1 and tenant_id=$2 and (code like 'FREE-%' or name like '%تعلم ذاتي%') limit 1",
        [row.course_id, s.tenantId]
      );
      if (c.rows.length > 0) isFreeOrOpen = true;
    }

    if (!isFreeOrOpen) {
      if (s.role === 'student' || s.role === 'guardian') {
        const linked = (await query(
          `select 1 from videos v
           join courses c on c.id = v.course_id
           join groups g on g.course_id = c.id
           join enrollments e on e.group_id = g.id
           join students st on st.id = e.student_id
           where v.id = $1 and v.tenant_id = $2 and (st.user_id = $3 or st.guardian_user_id = $3)
           limit 1`,
          [id, s.tenantId, s.userId]
        )).rows.length;
        if (!linked) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      if (s.role === 'teacher') {
        const teaching = row.course_id
          ? (await query('select 1 from course_teachers where course_id=$1 and teacher_user_id=$2 limit 1', [row.course_id, s.userId])).rows.length
          : 0;
        if (!teaching) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    }
  }

  // 1. If storage_key is a local public path (e.g. /media/... or /videos/...)
  if (typeof row.storage_key === 'string' && row.storage_key.startsWith('/')) {
    if (!req.headers.get('range') || req.headers.get('range')?.startsWith('bytes=0')) {
      await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'video.play', entity: 'video', entityId: id });
    }
    return NextResponse.redirect(new URL(row.storage_key, req.url));
  }

  const range = req.headers.get('range') || '';
  let upstream: Response;
  try {
    upstream = await fetch(row.storage_key, { headers: range ? { Range: range } : {} });
    if (upstream.status === 401 || upstream.status === 403) {
      const { get } = await import('@vercel/blob');
      const result = await get(row.storage_key, { access: 'public', headers: range ? { range } : undefined });
      if (!result) return NextResponse.json({ error: 'الفيديو غير موجود' }, { status: 404 });
      const blobHeaders = result.headers;
      const payloadHeaders = new Headers();
      const ct2 = blobHeaders.get('content-type'); if (ct2) payloadHeaders.set('content-type', ct2);
      const cl2 = blobHeaders.get('content-length'); if (cl2) payloadHeaders.set('content-length', cl2);
      const cr2 = blobHeaders.get('content-range'); if (cr2) payloadHeaders.set('content-range', cr2);
      payloadHeaders.set('accept-ranges', 'bytes');
      payloadHeaders.set('cache-control', 'private, no-store');
      if (!range || range.startsWith('bytes=0')) {
        await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'video.play', entity: 'video', entityId: id });
      }
      return new Response(result.stream, { status: 206, headers: payloadHeaders });
    }
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بالتخزين' }, { status: 502 });
  }
  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: 'تعذر جلب الفيديو من التخزين' }, { status: 502 });
  }
  if (!range || range.startsWith('bytes=0')) {
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'video.play', entity: 'video', entityId: id });
  }
  const headers = new Headers();
  const ct = upstream.headers.get('content-type'); if (ct) headers.set('content-type', ct);
  const cl = upstream.headers.get('content-length'); if (cl) headers.set('content-length', cl);
  const cr = upstream.headers.get('content-range'); if (cr) headers.set('content-range', cr);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'private, no-store');
  return new Response(upstream.body, { status: upstream.status, headers });
}
