import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getSession } from '@/lib/auth';
import { query, safeError } from '@/lib/db';
import { MAX_FILE_BYTES, ALLOWED_CONTENT_TYPES } from '@/lib/storage';

type TokenPayload = { tenantId: string; userId: string | null };

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
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
          tokenPayload: JSON.stringify({ tenantId: s.tenantId, userId } as TokenPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // FIX: SDK types tokenPayload as string | null | undefined - guard before parse.
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