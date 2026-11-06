import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const list = await readFile(new URL('../app/api/exams/route.ts', import.meta.url), 'utf8');
const detail = await readFile(new URL('../app/api/exams/[id]/route.ts', import.meta.url), 'utf8');

assert.match(list, /where e\.tenant_id=\$1/);
assert.match(list, /questions where tenant_id=\$1/);
assert.match(list, /withTx\(async \(client\)/);
assert.match(detail, /where e\.id=\$1 and e\.tenant_id=\$2/);
assert.match(detail, /q\.tenant_id=\$2/);
assert.match(detail, /delete from exams where id=\$1 and tenant_id=\$2/);

console.log('PASS: exam routes preserve tenant and transactional guards');
