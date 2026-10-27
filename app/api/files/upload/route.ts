import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getSession } from '@/lib/auth';
import { query, safeError } from '@/lib/db';
import { MAX_FILE_BYTES, ALLOWED_CONTENT_TYPES, isAllowedFile, sanitizeName, buildPathname } from '@/lib/storage';
import { logAudit } from '@/lib/audit';

type TokenPayload = { tenantId: string; userId: string | null };

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const contentTypeHeader = req.headers.get('content-type') || '';

  // 1. Direct Multipart/Form-Data Upload (Fast & Resilient)
  if (contentTypeHeader.includes('multipart/form-data')) {
    try {
      const formData = await req.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
      }

      const courseId = (formData.get('courseId') as string) || null;
      const groupId = (formData.get('groupId') as string) || null;

      if (!isAllowedFile(file.name, file.type)) {
        return NextResponse.json({ error: 'نوع الملف غير مسموح به' }, { status: 400 });
      }

      if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'حجم الملف غير مسموح به (الحد الأقصى 100MB)' }, { status: 400 });
      }

      const safeFileName = sanitizeName(file.name);
      let storageKey: string;
      let fileData: string | null = null;
      const buffer = Buffer.from(await file.arrayBuffer());

      // If Vercel Blob token is configured in environment, use Vercel Blob
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import('@vercel/blob');
        const pathname = buildPathname(s.tenantId, file.name);
        const blob = await put(pathname, buffer, {
          access: 'private',
          contentType: file.type || 'application/octet-stream',
        });
        storageKey = blob.url;
      } else {
        // High-reliability internal storage in Postgres TOAST
        storageKey = `internal://tenants/${s.tenantId}/${randomUUID()}/${safeFileName}`;
        fileData = buffer.toString('base64');
      }

      if (courseId) {
        const c = await query('select id from courses where id=$1 and tenant_id=$2', [courseId, s.tenantId]);
        if (!c.rows.length) return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 400 });
      }

      if (groupId) {
        const g = await query('select id from groups where id=$1 and tenant_id=$2', [groupId, s.tenantId]);
        if (!g.rows.length) return NextResponse.json({ error: 'المجموعة غير موجودة' }, { status: 400 });
      }

      const res = await query(
        `insert into files (tenant_id, course_id, group_id, name, mime, size_bytes, storage_key, file_data, uploaded_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning id, name, mime, size_bytes, storage_key, created_at`,
        [s.tenantId, courseId, groupId, safeFileName, file.type || null, file.size, storageKey, fileData, s.userId]
      );

      // Audit Log
      await logAudit({
        tenantId: s.tenantId,
        userId: s.userId,
        action: 'file.upload',
        entity: 'file',
        entityId: res.rows[0]?.id,
        metadata: { name: file.name, size: file.size, courseId },
      });

      return NextResponse.json({ success: true, file: res.rows[0] });
    } catch (e) {
      console.error('Direct upload error:', e);
      return NextResponse.json({ error: safeError(e) }, { status: 400 });
    }
  }

  // 2. Vercel Blob client token-based upload
  let body: HandleUploadBody;
  try { body = (await req.json()) as HandleUploadBody; } catch { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const prefix = 'tenants/' + s.tenantId + '/';
        if (!pathname.startsWith(prefix)) throw new Error('forbidden pathname');
        const userId = typeof (s as { userId?: string }).userId === 'string' ? (s as { userId?: string }).userId : null;
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_BYTES,
          access: 'private',
          tokenPayload: JSON.stringify({ tenantId: s.tenantId, userId } as TokenPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) { console.error('blob upload-completed: missing tokenPayload'); return; }
        try {
          const tp = JSON.parse(tokenPayload) as TokenPayload;
          const size = Number((blob as { size?: number }).size) || 0;
          await query(
            'insert into files(tenant_id,name,mime,size_bytes,storage_key,uploaded_by) values($1,$2,$3,$4,$5,$6) on conflict (storage_key) do nothing',
            [tp.tenantId, blob.pathname.split('/').pop() || blob.pathname, blob.contentType || null, size, blob.url, tp.userId]
          );
        } catch (e) { console.error('blob upload-completed insert failed', e); }
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
