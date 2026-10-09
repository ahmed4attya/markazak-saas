// lib/video-storage.ts - Scope 3 video helpers (DEC-053..057).
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500MB cap until Hobby limits measured (DEC-054)

export const VIDEO_CONTENT_TYPES: string[] = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
];

const VIDEO_EXTENSIONS: string[] = ['mp4', 'webm', 'mov', 'm4v'];

export function isAllowedVideoFile(name: string, mime?: string | null): boolean {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return false;
  const ext = name.slice(dot + 1).toLowerCase();
  if (VIDEO_EXTENSIONS.indexOf(ext) < 0) return false;
  if (mime && mime.indexOf('video/') !== 0 && mime !== 'application/octet-stream') return false;
  return true;
}

export function buildVideoPathname(tenantId: string, originalName: string): string {
  const { randomUUID } = require('crypto') as { randomUUID: () => string };
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot > 0 ? originalName.slice(dot) : '';
  const cleaned = base.replace(/[^a-zA-Z0-9\u0600-\u06FF._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const safe = (cleaned || 'video').slice(0, 180) + ext.toLowerCase().slice(0, 20);
  return 'tenants/' + tenantId + '/videos/' + randomUUID() + '/' + safe;
}