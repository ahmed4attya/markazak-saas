import { randomUUID } from "crypto";
// lib/video-storage.ts - Scope 3 video helpers (DEC-053..057).
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500MB cap

export const VIDEO_CONTENT_TYPES: string[] = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/x-matroska',
  'video/avi',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'application/octet-stream',
];

const VIDEO_EXTENSIONS: string[] = ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi', 'm4a', 'mp3'];

export function isAllowedVideoFile(name: string, _mime?: string | null): boolean {
  if (!name || typeof name !== 'string') return false;
  const dot = name.lastIndexOf('.');
  if (dot < 0) return false;
  const ext = name.slice(dot + 1).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

export function buildVideoPathname(tenantId: string, originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  const base = dot > 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot > 0 ? originalName.slice(dot) : '';
  const cleaned = base.replace(/[^a-zA-Z0-9\u0600-\u06FF._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const safe = (cleaned || 'video').slice(0, 180) + ext.toLowerCase().slice(0, 20);
  return 'tenants/' + tenantId + '/videos/' + randomUUID() + '/' + safe;
}
