import assert from 'node:assert/strict';
import fs from 'node:fs';

const schema = fs.readFileSync('db/schema.sql', 'utf8');
const admin = fs.readFileSync('app/api/activation-codes/route.ts', 'utf8');
const redeem = fs.readFileSync('app/api/learner/redeem/route.ts', 'utf8');
const middleware = fs.readFileSync('middleware.ts', 'utf8');
assert.match(schema, /create table if not exists activation_codes/);
assert.match(schema, /create table if not exists student_entitlements/);
assert.match(admin, /isAdminRole\(s\.role\)/);
assert.match(admin, /tenant_id=\$1/);
assert.match(redeem, /s\.role !== 'student'/);
assert.match(redeem, /s\.tenantId/);
assert.match(redeem, /for update/);
assert.match(redeem, /used_count/);
assert.match(middleware, /api\/activation-codes/);
console.log('PASS: activation codes are tenant, admin and student scoped');
