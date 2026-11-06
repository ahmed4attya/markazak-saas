// M2-V0 evidence: LIVE behavioral matrix mirroring tests/m1-security.spec.ts
// (the approved five-scenario spec — file deliberately untracked via .gitignore).
// Target: LOCAL staging only (Docker DB + server on http://localhost:3000).
// AUTH_SECRET is read from .env.local at runtime and NEVER printed.
// JWT claims match lib/session.ts Session shape: { userId, tenantId, role, name, email }.
// Exit code 0 = all cells PASS, 1 = any FAIL (usable as a gate).
const fs = require('fs');
const axios = require('axios');
const { SignJWT } = require('jose');

const BASE = 'http://localhost:3000';
const raw = (fs.readFileSync('.env.local', 'utf8').match(/^AUTH_SECRET=(.+)$/m) || [])[1] || '';
if (!raw) {
  console.error('ERROR: AUTH_SECRET not found in .env.local. Fail-closed.');
  process.exit(1);
}
const secret = new TextEncoder().encode(raw.replace(/^["']|["']$/g, ''));

const forge = (role, extra = {}) =>
  new SignJWT({ role, ...extra })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

const http = axios.create({ baseURL: BASE, validateStatus: () => true, maxRedirects: 0 });

let pass = 0;
let fail = 0;
function judge(label, ok, detail) {
  console.log(`${label} -> ${ok ? 'PASS' : 'FAIL'} ${detail || ''}`);
  if (ok) pass++; else fail++;
}

(async () => {
  console.log('--- M2-V0 LIVE MATRIX (mirrors tests/m1-security.spec.ts) ---');

  // S1: unauthenticated -> redirect (pages) / 401 (API)
  for (const p of ['/users', '/finance', '/settings']) {
    const r = await http.get(p);
    judge(`S1 GET ${p} [guest]`, r.status === 307 && /\/login/.test(r.headers.location || ''), `got ${r.status} loc=${r.headers.location || '-'}`);
  }
  for (const p of ['/api/users', '/api/settings', '/api/plans']) {
    const r = await http.get(p);
    judge(`S1 GET ${p} [guest]`, r.status === 401, `got ${r.status}`);
  }

  // S2: teacher (jose-forged cookie with the real local AUTH_SECRET)
  const t = await forge('teacher');
  const r2 = await http.get('/api/users', { headers: { cookie: `session=${t}` } });
  judge('S2 GET /api/users [teacher]', r2.status === 403, `got ${r2.status}`);
  const r2b = await http.get('/finance', { headers: { cookie: `session=${t}` } });
  judge('S2 GET /finance [teacher]', r2b.status === 307 && /\/dashboard/.test(r2b.headers.location || ''), `got ${r2b.status} loc=${r2b.headers.location || '-'}`);

  // S3: tenant isolation (foreign-tenant admin cannot patch another tenant's real student)
  // Amendment 2026-10-22b (S-ENV-04): a5-PRE proved the live local DB had no app schema (42P01 relation students) and 'tenant-A' is not a valid uuid; after local schema reset + canonical seed, this probe uses a valid-format NONEXISTENT tenant uuid against a REAL seeded student. Strict 404; 200 = isolation breach = hard stop.
  const t3 = await forge('admin', { tenantId: '99999999-9999-9999-9999-999999999999' });
  const s3base = (typeof BASE !== 'undefined') ? BASE : 'http://localhost:3000';
  const r3res = await fetch(s3base + '/api/students/22222222-2222-2222-2222-222222222222', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie: `session=${t3}` },
    body: JSON.stringify({ name: '__s3_probe__' })
  });
  if (r3res.status !== 404) console.log('S3_BODY:', JSON.stringify(await r3res.json().catch(() => null)));
  judge('S3 PATCH /api/students/:id [foreign valid-uuid tenant -> real seeded student]', r3res.status === 404, `got ${r3res.status}`);

  // S3b: positive control (SAME admin role over the REAL tenant patches its OWN real student, idempotent status) — proves the 404 above is tenant scoping, not a broken handler.
  const t3b = await forge('admin', { tenantId: '11111111-1111-1111-1111-111111111111' });
  const r3bres = await fetch(s3base + '/api/students/22222222-2222-2222-2222-222222222222', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie: `session=${t3b}` },
    body: JSON.stringify({ status: 'active' })
  });
  if (r3bres.status !== 200) console.log('S3B_BODY:', JSON.stringify(await r3bres.json().catch(() => null)));
  judge('S3b PATCH /api/students/:id [real tenant -> own real student (idempotent)]', r3bres.status === 200, `got ${r3bres.status}`);

  // S4: corrupt session token
  const r4 = await http.get('/api/users', { headers: { cookie: 'session=garbage.token.value' } });
  judge('S4 GET /api/users [corrupt cookie]', r4.status === 401, `got ${r4.status}`);

  // S5: login rate limit -> 429 within 12 attempts
  let last = 0;
  for (let i = 1; i <= 12; i++) {
    const r5 = await http.post('/api/auth/login', { email: 'rl-probe@example.com', password: 'wrong' });
    last = r5.status;
    if (last === 429) break;
  }
  judge('S5 POST /api/auth/login x<=12 [rate limit]', last === 429, `last=${last}`);

  console.log(`--- SUMMARY: pass=${pass} fail=${fail} ---`);
  process.exitCode = fail === 0 ? 0 : 1;
})().catch((e) => {
  console.error('MATRIX_ERROR', e.message);
  process.exitCode = 1;
});
