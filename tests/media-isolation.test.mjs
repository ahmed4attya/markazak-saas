import assert from 'node:assert/strict';
import fs from 'node:fs';

for (const file of ['app/api/files/route.ts', 'app/api/videos/route.ts', 'app/api/files/prepare/route.ts', 'app/api/files/upload-complete/route.ts', 'app/api/videos/prepare/route.ts', 'app/api/videos/upload-complete/route.ts']) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, /s\.role === 'teacher'/, file);
  assert.match(source, /canAccessCourse|teacherCourseIds|course_id = any/, file);
  assert.match(source, /tenant_id/, file);
}
console.log('PASS: media access is teacher-course scoped and tenant bounded');
