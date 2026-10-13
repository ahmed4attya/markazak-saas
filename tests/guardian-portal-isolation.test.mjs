import assert from 'node:assert/strict';
import fs from 'node:fs';

const exams = fs.readFileSync('app/api/learner/exams/route.ts', 'utf8');
const assignments = fs.readFileSync('app/api/assignments/route.ts', 'utf8');
const portal = fs.readFileSync('app/portal/page.tsx', 'utf8');
assert.match(exams, /s\.role !== 'student' && s\.role !== 'guardian'/);
assert.match(exams, /st\.tenant_id=\$1 and st\.\$\{linkColumn\}=\$2/);
assert.match(assignments, /s\.role === 'student' \|\| s\.role === 'guardian'/);
assert.match(assignments, /st\.tenant_id=\$1 and st\.\$\{linkColumn\}=\$2/);
assert.match(portal, /learner\.role === 'guardian'/);
console.log('PASS: guardian portal remains linked and read-only');
