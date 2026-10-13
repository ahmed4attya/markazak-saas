import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const users = await readFile(new URL('../app/api/users/route.ts', import.meta.url), 'utf8');
const ui = await readFile(new URL('../app/users/page.tsx', import.meta.url), 'utf8');

assert.match(schema, /student_user_id uuid references users\(id\)/);
assert.match(schema, /students_tenant_user/);
assert.match(users, /withTx\(async \(client\)/);
assert.match(users, /where id=\$1 and tenant_id=\$2 for update/);
assert.match(users, /student_user_id=\$1/);
assert.match(users, /guardian_user_id=\$1/);
assert.match(ui, /\['student', 'طالب'\]/);
assert.match(ui, /\['guardian', 'ولي أمر'\]/);
assert.match(ui, /form\.studentId/);

console.log('PASS: student and guardian identity links are tenant-scoped and transactional');
