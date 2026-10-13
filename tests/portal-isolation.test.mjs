import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const exams = await readFile(new URL('../app/api/learner/exams/route.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../app/portal/page.tsx', import.meta.url), 'utf8');
const middleware = await readFile(new URL('../middleware.ts', import.meta.url), 'utf8');

assert.match(exams, /s\.role !== 'student' && s\.role !== 'guardian'/);
assert.match(exams, /st\.tenant_id=\$1 and st\.\$\{linkColumn\}=\$2/);
assert.match(exams, /en\.status='active'/);
assert.match(page, /fetch\('\/api\/attempts'/);
assert.match(middleware, /\/portal\/:path\*/);

console.log('PASS: student portal and learner exams are session-gated and enrollment-scoped');
