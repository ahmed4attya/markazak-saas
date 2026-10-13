import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('app/api/assignments/[id]/submissions/route.ts', 'utf8');
assert.match(route, /a\.tenant_id=\$2/);
assert.match(route, /sub\.tenant_id=\$2/);
assert.match(route, /st\.tenant_id=sub\.tenant_id/);
assert.match(route, /canAccessCourse\(s, String\(assignment\.course_id\)\)/);
assert.match(route, /isAdminRole\(s\.role\).*s\.role !== 'teacher'/s);
console.log('PASS: gradebook route is tenant and course scoped');
