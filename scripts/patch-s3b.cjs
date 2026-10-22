const fs = require('fs');
function patchFile(path, oldLF, newLF, label) {
  let src;
  try { src = fs.readFileSync(path, 'utf8'); } catch (e) {
    console.error('PATCH_FAIL[' + label + ']: cannot read ' + path); process.exit(1);
  }
  const crlf = src.includes('\r\n');
  const oldStr = crlf ? oldLF.split('\n').join('\r\n') : oldLF;
  const newStr = crlf ? newLF.split('\n').join('\r\n') : newLF;
  if (!src.includes(oldStr)) { console.error('PATCH_FAIL[' + label + ']: old block not found in ' + path); process.exit(1); }
  if (src.includes(newStr)) { console.error('PATCH_FAIL[' + label + ']: new block already present'); process.exit(1); }
  fs.copyFileSync(path, path + '.bak-s3b');
  const out = src.replace(oldStr, function () { return newStr; });
  if (out === src || !out.includes(newStr)) { console.error('PATCH_FAIL[' + label + ']: replace produced no change'); process.exit(1); }
  fs.writeFileSync(path, out);
  const re = fs.readFileSync(path, 'utf8');
  if (!re.includes(newStr) || re.includes(oldStr)) { console.error('PATCH_FAIL[' + label + ']: post-write verification failed'); process.exit(1); }
  console.log('PATCH_OK[' + label + ']: ' + path + (crlf ? ' (CRLF)' : ' (LF)'));
}
const specOld = [
  "test('Tenant A -> Tenant B = 403/404 (PATCH - route exports no GET, 405 evidence 2026-10-22)', async ({ request }) => {",
  "  const t = await forge('admin', { tenantId: 'tenant-A' });",
  "  expect([403, 404]).toContain((await request.patch(BASE + '/api/students/00000000-0000-0000-0000-00000000000B', { data: { name: '__s3_probe__' }, headers: { cookie: `session=${t}` } })).status());",
  "});"
].join('\n');
const specNew = [
  "test('Foreign valid-uuid tenant -> real seeded student = 404 (S-ENV-04 reset 2026-10-22; 200 = isolation breach = hard stop)', async ({ request }) => {",
  "  const t = await forge('admin', { tenantId: '99999999-9999-9999-9999-999999999999' });",
  "  const r = await request.patch(BASE + '/api/students/22222222-2222-2222-2222-222222222222', { data: { name: '__s3_probe__' }, headers: { cookie: `session=${t}` } });",
  "  expect(r.status()).toBe(404);",
  "});",
  "",
  "test('Positive control: real tenant -> own real student = 200 (S-ENV-04 reset 2026-10-22)', async ({ request }) => {",
  "  const t = await forge('admin', { tenantId: '11111111-1111-1111-1111-111111111111' });",
  "  const r = await request.patch(BASE + '/api/students/22222222-2222-2222-2222-222222222222', { data: { status: 'active' }, headers: { cookie: `session=${t}` } });",
  "  expect(r.status()).toBe(200);",
  "});"
].join('\n');
const matrixOld = [
  "  // S3: tenant isolation (admin of tenant-A patches tenant-B resource id)",
  "  // Amendment 2026-10-22: /api/students/[id] exports PATCH/DELETE only (GET = 405, matrix evidence); valid-field body exercises the full handler path; judged 403/404; 200 would mean isolation breach.",
  "  const t3 = await forge('admin', { tenantId: 'tenant-A' });",
  "  const s3base = (typeof BASE !== 'undefined') ? BASE : 'http://localhost:3000';",
  "  const r3res = await fetch(s3base + '/api/students/00000000-0000-0000-0000-00000000000B', {",
  "    method: 'PATCH',",
  "    headers: { 'content-type': 'application/json', cookie: `session=${t3}` },",
  "    body: JSON.stringify({ name: '__s3_probe__' })",
  "  });",
  "  judge('S3 PATCH /api/students/:id [admin@tenant-A -> tenant-B id]', [403, 404].includes(r3res.status), `got ${r3res.status}`);"
].join('\n');
const matrixNew = [
  "  // S3: tenant isolation (foreign-tenant admin cannot patch another tenant's real student)",
  "  // Amendment 2026-10-22b (S-ENV-04): a5-PRE proved the live local DB had no app schema (42P01 relation students) and 'tenant-A' is not a valid uuid; after local schema reset + canonical seed, this probe uses a valid-format NONEXISTENT tenant uuid against a REAL seeded student. Strict 404; 200 = isolation breach = hard stop.",
  "  const t3 = await forge('admin', { tenantId: '99999999-9999-9999-9999-999999999999' });",
  "  const s3base = (typeof BASE !== 'undefined') ? BASE : 'http://localhost:3000';",
  "  const r3res = await fetch(s3base + '/api/students/22222222-2222-2222-2222-222222222222', {",
  "    method: 'PATCH',",
  "    headers: { 'content-type': 'application/json', cookie: `session=${t3}` },",
  "    body: JSON.stringify({ name: '__s3_probe__' })",
  "  });",
  "  if (r3res.status !== 404) console.log('S3_BODY:', JSON.stringify(await r3res.json().catch(() => null)));",
  "  judge('S3 PATCH /api/students/:id [foreign valid-uuid tenant -> real seeded student]', r3res.status === 404, `got ${r3res.status}`);",
  "",
  "  // S3b: positive control (SAME admin role over the REAL tenant patches its OWN real student, idempotent status) — proves the 404 above is tenant scoping, not a broken handler.",
  "  const t3b = await forge('admin', { tenantId: '11111111-1111-1111-1111-111111111111' });",
  "  const r3bres = await fetch(s3base + '/api/students/22222222-2222-2222-2222-222222222222', {",
  "    method: 'PATCH',",
  "    headers: { 'content-type': 'application/json', cookie: `session=${t3b}` },",
  "    body: JSON.stringify({ status: 'active' })",
  "  });",
  "  if (r3bres.status !== 200) console.log('S3B_BODY:', JSON.stringify(await r3bres.json().catch(() => null)));",
  "  judge('S3b PATCH /api/students/:id [real tenant -> own real student (idempotent)]', r3bres.status === 200, `got ${r3bres.status}`);"
].join('\n');
patchFile('tests/m1-security.spec.ts', specOld, specNew, 'spec');
patchFile('scripts/live-matrix.cjs', matrixOld, matrixNew, 'matrix');
console.log('PATCH_ALL_OK');
