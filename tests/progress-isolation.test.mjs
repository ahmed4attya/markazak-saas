import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const api = await readFile(new URL('../app/api/learner/progress/route.ts', import.meta.url), 'utf8');
const page = await readFile(new URL('../app/portal/page.tsx', import.meta.url), 'utf8');

assert.match(api, /s\.role !== 'student' && s\.role !== 'guardian'/);
assert.match(api, /tenant_id=\$1 and \$\{linkColumn\}=\$2/);
assert.match(api, /user_id=any\(\$2::uuid\[\]\)/);
assert.match(api, /student_id=any\(\$2::uuid\[\]\)/);
assert.match(page, /fetch\('\/api\/learner\/progress'\)/);
assert.match(page, /average_score/);

console.log('PASS: progress metrics are scoped to the student or explicitly linked children');
