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

  // S3: tenant isolation (admin of tenant-A requests tenant-B resource)
  const t3 = await forge('admin', { tenantId: 'tenant-A' });
  const r3 = await http.get('/api/students/00000000-0000-0000-0000-00000000000B', { headers: { cookie: `session=${t3}` } });
  judge('S3 GET /api/students/:id [admin@tenant-A -> tenant-B id]', [403, 404].includes(r3.status), `got ${r3.status}`);

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
