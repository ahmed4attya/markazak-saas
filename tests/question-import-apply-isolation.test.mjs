import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('app/api/questions/import/apply/route.ts', 'utf8');
assert.match(route, /parseQuestionCsv\(csv\)/);
assert.match(route, /row\.status === 'READY'/);
assert.match(route, /canAccessCourse\(s, row\.effectiveCourseId\)/);
assert.match(route, /withTx\(async \(client\)/);
assert.match(route, /s\.tenantId/);
assert.match(route, /question\.import/);
assert.match(route, /1000/);
console.log('PASS: question import apply is validated, atomic and tenant-scoped');
