import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const access = await readFile(new URL('../lib/access.ts', import.meta.url), 'utf8');
const questions = await readFile(new URL('../app/api/questions/route.ts', import.meta.url), 'utf8');
const assignments = await readFile(new URL('../app/api/course-teachers/route.ts', import.meta.url), 'utf8');

assert.match(access, /teacherCourseIds\(userId: string, tenantId: string\)/);
assert.match(access, /c\.tenant_id=\$2/);
assert.match(access, /c\.tenant_id=\$3/);
assert.match(questions, /teacherCourseIds\(s\.userId, s\.tenantId\)/);
assert.match(questions, /created_by.*canAccessCourse\(s, String\(q\.course_id\)\)/s);
assert.match(assignments, /c\.tenant_id=\$2 and u\.tenant_id=\$2/);
assert.match(assignments, /join courses c on c\.id=ct\.course_id and c\.tenant_id=\$3/);
assert.match(assignments, /join users u on u\.id=ct\.teacher_user_id and u\.tenant_id=\$3/);

console.log('PASS: access isolation source guards are present');
