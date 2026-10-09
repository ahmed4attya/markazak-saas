import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getSession } from '@/lib/auth';
import { safeError } from '@/lib/db'; // FIX: used in the catch block below
import { MAX_VIDEO_BYTES, VIDEO_CONTENT_TYPES } from '@/lib/video-storage';

type TokenPayload = { tenantId: string; userId: string };

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
        const prefix = 'tenants/' + s.tenantId + '/videos/';
        if (!pathname.startsWith(prefix)) throw new Error('forbidden pathname');
        return {
          allowedContentTypes: VIDEO_CONTENT_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          tokenPayload: JSON.stringify({ tenantId: s.tenantId, userId: s.userId } as TokenPayload),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) { console.error('video upload-completed: missing tokenPayload'); return; }
        try {
          const tp = JSON.parse(tokenPayload) as TokenPayload;
          const size = Number((blob as { size?: number }).size) || 0;
          const { query } = await import('@/lib/db');
          await query(
            'insert into videos(tenant_id,title,mime,size_bytes,storage_key,uploaded_by) values($1,$2,$3,$4,$5,$6) on conflict (storage_key) do nothing',
            [tp.tenantId, blob.pathname.split('/').pop() || blob.pathname, blob.contentType || null, size, blob.url, tp.userId]
          );
        } catch (e) { console.error('video upload-completed insert failed', e); }
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}