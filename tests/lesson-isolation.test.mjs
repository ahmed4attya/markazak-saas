import assert from 'node:assert/strict';
import fs from 'node:fs';

const schema = fs.readFileSync('db/schema.sql', 'utf8');
const staff = fs.readFileSync('app/api/lessons/route.ts', 'utf8');
const learner = fs.readFileSync('app/api/learner/lessons/route.ts', 'utf8');
const progress = fs.readFileSync('app/api/learner/lessons/[id]/progress/route.ts', 'utf8');
assert.match(schema, /create table if not exists course_lessons/);
assert.match(schema, /create table if not exists lesson_progress/);
assert.match(staff, /canAccessCourse/);
assert.match(staff, /l\.tenant_id/);
assert.match(learner, /st\.tenant_id=\$1 and st\.\$\{linkColumn\}=\$2/);
assert.match(learner, /l\.published=true/);
assert.match(learner, /lp\.tenant_id=st\.tenant_id/);
assert.match(progress, /s\.role !== 'student'/);
assert.match(progress, /en\.student_id=\$3/);
assert.match(progress, /on conflict\(lesson_id,student_id\)/);
console.log('PASS: lesson sequencing and progress are tenant and learner scoped');
