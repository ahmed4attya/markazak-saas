import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const list = await readFile(new URL('../app/api/assignments/route.ts', import.meta.url), 'utf8');
const submit = await readFile(new URL('../app/api/assignments/[id]/submit/route.ts', import.meta.url), 'utf8');
const grade = await readFile(new URL('../app/api/submissions/[id]/route.ts', import.meta.url), 'utf8');

assert.match(schema, /create table if not exists assignments/);
assert.match(schema, /create table if not exists submissions/);
assert.match(list, /a\.tenant_id=\$1/);
assert.match(list, /st\.tenant_id=\$1 and st\.\$\{linkColumn\}=\$2/);
assert.match(list, /s\.role === 'student' \|\| s\.role === 'guardian'/);
assert.match(submit, /en\.student_id=\$3/);
assert.match(submit, /en\.status='active'/);
assert.match(grade, /sub\.tenant_id=\$2/);
assert.match(grade, /canAccessCourse\(s, String\(submission\.course_id\)\)/);

console.log('PASS: assignment, submission and grading boundaries are tenant and role scoped');
