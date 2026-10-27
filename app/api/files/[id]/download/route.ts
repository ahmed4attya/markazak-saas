// Role-gated file download through the server: legacy public blobs pass through,
// private blobs are fetched server-side (the raw storage_key never leaves the server).
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Context) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const rows = (await query('select * from files where id=$1 and tenant_id=$2', [id, s.tenantId])).rows;
  if (!rows.length) return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
  const row = rows[0];

  if (s.role === 'student' || s.role === 'guardian') {
    if (!row.course_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const linked = (await query(
      `select 1 from files f
       join courses c on c.id = f.course_id
       join groups g on g.course_id = c.id
       join enrollments e on e.group_id = g.id
       join students st on st.id = e.student_id
       where f.id = $1 and f.tenant_id = $2 and (st.user_id = $3 or st.guardian_user_id = $3)
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

  const safeName = String(row.name || 'file').replace(/["\\\r\n]/g, '');
  const encodedName = encodeURIComponent(safeName);
  const asciiFallback = safeName.replace(/[^\x20-\x7E]/g, '_');
  const disposition = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`;

  // 0. If file_data is stored directly in database
  if (row.file_data) {
    const buffer = Buffer.from(row.file_data, 'base64');
    const headers = new Headers();
    headers.set('content-type', row.mime || 'application/octet-stream');
    headers.set('content-length', String(buffer.length));
    headers.set('content-disposition', disposition);
    headers.set('cache-control', 'private, no-store');
    return new Response(buffer, { status: 200, headers });
  }

  // 1. If storage_key is a local public path (e.g. /docs/...)
  if (typeof row.storage_key === 'string' && row.storage_key.startsWith('/')) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), 'public', row.storage_key);
      if (fs.existsSync(localPath)) {
        const buf = fs.readFileSync(localPath);
        const headers = new Headers();
        headers.set('content-type', row.mime || 'application/pdf');
        headers.set('content-length', String(buf.length));
        headers.set('content-disposition', disposition);
        headers.set('cache-control', 'public, max-age=86400');
        return new Response(buf, { status: 200, headers });
      }
    } catch (e) {
      console.error('Error reading local file:', e);
    }
    return NextResponse.redirect(new URL(row.storage_key, _req.url));
  }

  // 2. If storage_key is an embedded Data URI (Base64)
  if (typeof row.storage_key === 'string' && row.storage_key.startsWith('data:')) {
    const parts = row.storage_key.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const contentType = mimeMatch ? mimeMatch[1] : (row.mime || 'application/octet-stream');
    const buffer = Buffer.from(parts[1] || '', 'base64');
    const headers = new Headers();
    headers.set('content-type', contentType);
    headers.set('content-length', String(buffer.length));
    headers.set('content-disposition', disposition);
    headers.set('cache-control', 'private, no-store');
    return new Response(buffer, { status: 200, headers });
  }

  try {
    const direct = await fetch(row.storage_key);
    if (direct.ok) {
      const headers = new Headers();
      const ct = direct.headers.get('content-type'); if (ct) headers.set('content-type', ct);
      const cl = direct.headers.get('content-length'); if (cl) headers.set('content-length', cl);
      headers.set('content-disposition', disposition);
      headers.set('cache-control', 'private, no-store');
      return new Response(direct.body, { status: 200, headers });
    }
    if (direct.status === 401 || direct.status === 403) {
      const { get } = await import('@vercel/blob');
      const result = await get(row.storage_key, { access: 'private' });
      if (!result) return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
      const headers = new Headers();
      const ct = result.headers.get('content-type'); if (ct) headers.set('content-type', ct);
      const cl = result.headers.get('content-length'); if (cl) headers.set('content-length', cl);
      headers.set('content-disposition', disposition);
      headers.set('cache-control', 'private, no-store');
      return new Response(result.stream, { status: 200, headers });
    }
    return NextResponse.json({ error: 'تعذر جلب الملف من التخزين' }, { status: 502 });
  } catch {
    return NextResponse.json({ error: 'تعذر الاتصال بالتخزين' }, { status: 502 });
  }
}
