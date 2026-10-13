import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('app/api/reports/learning/route.ts', 'utf8');
assert.match(route, /isAdminRole\(s\.role\).*s\.role !== 'teacher'/s);
assert.match(route, /teacherCourseIds\(s\.userId, s\.tenantId\)/);
assert.match(route, /c\.tenant_id=\$1/);
assert.match(route, /e\.tenant_id=\$1/);
assert.match(route, /a\.tenant_id=\$1/);
assert.match(route, /sub\.tenant_id=a\.tenant_id/);
assert.match(route, /courseId/);
console.log('PASS: learning report is tenant and teacher-course scoped');
