import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { SignJWT } from 'jose';

const BASE = 'http://localhost:3000';
const raw = readFileSync('.env.local', 'utf8').match(/^AUTH_SECRET=(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '') ?? 'dev-only-insecure-secret-change-me-before-prod';
const secret = new TextEncoder().encode(raw);
// ⚠️ أسماء الclaims (role/tenantId/...) يجب أن تطابق ما تقرأه lib/session.ts — تحقق وعدّل
const forge = (role: string, extra: Record<string, unknown> = {}) =>
  new SignJWT({ role, ...extra }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('1h').sign(secret);

test('Unauth -> Protected = 401 / Redirect', async ({ page, request }) => {
  for (const p of ['/users', '/finance', '/settings']) { await page.goto(BASE + p); expect(page.url()).toContain('/login'); }
  for (const p of ['/api/users', '/api/settings', '/api/plans']) { expect((await request.get(BASE + p)).status()).toBe(401); }
});

test('Teacher -> Admin Routes = 403/Redirect', async ({ page, request }) => {
  const t = await forge('teacher');
  expect((await request.get(BASE + '/api/users', { headers: { cookie: `session=${t}` } })).status()).toBe(403);
  await page.context().addCookies([{ name: 'session', value: t, url: BASE }]);
  await page.goto(BASE + '/finance');
  expect(page.url()).toContain('/dashboard');
});

test('Foreign valid-uuid tenant -> real seeded student = 404 (S-ENV-04 reset 2026-10-22; 200 = isolation breach = hard stop)', async ({ request }) => {
  const t = await forge('admin', { tenantId: '99999999-9999-9999-9999-999999999999' });
  const r = await request.patch(BASE + '/api/students/22222222-2222-2222-2222-222222222222', { data: { name: '__s3_probe__' }, headers: { cookie: `session=${t}` } });
  expect(r.status()).toBe(404);
});

test('Positive control: real tenant -> own real student = 200 (S-ENV-04 reset 2026-10-22)', async ({ request }) => {
  const t = await forge('admin', { tenantId: '11111111-1111-1111-1111-111111111111' });
  const r = await request.patch(BASE + '/api/students/22222222-2222-2222-2222-222222222222', { data: { status: 'active' }, headers: { cookie: `session=${t}` } });
  expect(r.status()).toBe(200);
});

test('Invalid Token = 401', async ({ request }) => {
  expect((await request.get(BASE + '/api/users', { headers: { cookie: 'session=garbage.token.value' } })).status()).toBe(401);
});

test('Rate Limit -> 429', async ({ request }) => {
  let last = 0;
  for (let i = 1; i <= 12; i++) {
    last = (await request.post(BASE + '/api/auth/login', { data: { email: 'rl-probe@example.com', password: 'wrong' } })).status();
    if (last === 429) break;
  }
  expect(last).toBe(429);
});