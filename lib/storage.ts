// lib/storage.ts - File library helpers (Scope 2, DEC-047/048). Vercel Blob wrapper.
import { randomUUID } from 'crypto';

export const MAX_FILE_BYTES = 500 * 1024 * 1024; // 500MB

export const ALLOWED_CONTENT_TYPES: string[] = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/plain',
  'text/csv',
  // Audio & Podcasts
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'video/x-matroska',
  'video/avi',
  'application/octet-stream',
];

const ALLOWED_EXTENSIONS: string[] = [
  'pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv',
  'zip', 'rar', '7z',
  'm4a', 'mp3', 'wav', 'aac', 'ogg', 'flac',
  'mp4', 'webm', 'mov', 'm4v', 'mkv', 'avi'
];

export function isAllowedFile(name: string, _mime?: string | null): boolean {
  if (!name || typeof name !== 'string') return false;
  const dot = name.lastIndexOf('.');
  if (dot < 0) return false;
  const ext = name.slice(dot + 1).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

export function sanitizeName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const cleaned = base.replace(/[^a-zA-Z0-9\u0600-\u06FF._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return (cleaned || 'file').slice(0, 180) + ext.toLowerCase().slice(0, 20);
}

export function buildPathname(tenantId: string, originalName: string): string {
  return 'tenants/' + tenantId + '/' + randomUUID() + '/' + sanitizeName(originalName);
}
