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
  fs.copyFileSync(path, path + '.bak-s3');
  const out = src.replace(oldStr, function () { return newStr; });
  if (out === src || !out.includes(newStr)) { console.error('PATCH_FAIL[' + label + ']: replace produced no change'); process.exit(1); }
  fs.writeFileSync(path, out);
  const re = fs.readFileSync(path, 'utf8');
  if (!re.includes(newStr) || re.includes(oldStr)) { console.error('PATCH_FAIL[' + label + ']: post-write verification failed'); process.exit(1); }
  console.log('PATCH_OK[' + label + ']: ' + path + (crlf ? ' (CRLF)' : ' (LF)'));
}
const specOld = [
  "test('Tenant A -> Tenant B = 403/404', async ({ request }) => {",
  "  const t = await forge('admin', { tenantId: 'tenant-A' });",
  "  expect([403, 404]).toContain((await request.get(BASE + '/api/students/00000000-0000-0000-0000-00000000000B', { headers: { cookie: `session=${t}` } })).status());",
  "});"
].join('\n');
const specNew = [
  "test('Tenant A -> Tenant B = 403/404 (PATCH - route exports no GET, 405 evidence 2026-10-22)', async ({ request }) => {",
  "  const t = await forge('admin', { tenantId: 'tenant-A' });",
  "  expect([403, 404]).toContain((await request.patch(BASE + '/api/students/00000000-0000-0000-0000-00000000000B', { data: { name: '__s3_probe__' }, headers: { cookie: `session=${t}` } })).status());",
  "});"
].join('\n');
const matrixOld = [
  "  // S3: tenant isolation (admin of tenant-A requests tenant-B resource)",
  "  const t3 = await forge('admin', { tenantId: 'tenant-A' });",
  "  const r3 = await http.get('/api/students/00000000-0000-0000-0000-00000000000B', { headers: { cookie: `session=${t3}` } });",
  "  judge('S3 GET /api/students/:id [admin@tenant-A -> tenant-B id]', [403, 404].includes(r3.status), `got ${r3.status}`);"
].join('\n');
const matrixNew = [
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
patchFile('tests/m1-security.spec.ts', specOld, specNew, 'spec');
patchFile('scripts/live-matrix.cjs', matrixOld, matrixNew, 'matrix');
console.log('PATCH_ALL_OK');
