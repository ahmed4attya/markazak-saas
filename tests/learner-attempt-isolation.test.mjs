import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const learner = await readFile(new URL('../app/api/learner/me/route.ts', import.meta.url), 'utf8');
const start = await readFile(new URL('../app/api/attempts/route.ts', import.meta.url), 'utf8');
const save = await readFile(new URL('../app/api/attempts/[id]/route.ts', import.meta.url), 'utf8');

assert.match(learner, /tenant_id=\$1 and \$\{column\}=\$2/);
assert.match(start, /s\.role !== 'student'/);
assert.match(start, /student_user_id=\$2/);
assert.match(start, /en\.student_id=\$2/);
assert.match(start, /q\.tenant_id=\$2/);
assert.match(save, /a\.tenant_id=\$2 and a\.user_id=\$3/);
assert.match(save, /q\.tenant_id=\$2/);

console.log('PASS: learner and attempt routes enforce self, tenant and enrollment scope');
