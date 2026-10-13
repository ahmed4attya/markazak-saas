import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../app/api/attempts/[id]/route.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../app/portal/attempts/[id]/page.tsx', import.meta.url), 'utf8');

assert.match(api, /where a\.id=\$1 and a\.tenant_id=\$2 and a\.user_id=\$3/);
assert.match(api, /const review = attempt\.finished_at/);
assert.match(page, /fetch\('\/api\/attempts\/' \+ id\)/);
assert.match(page, /body\.review/);
assert.match(page, /body\.attempt\.answers/);

console.log('PASS: attempt UI reads only the current attempt and reveals review after submission');
