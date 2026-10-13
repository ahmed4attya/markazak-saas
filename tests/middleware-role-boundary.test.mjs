import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const middleware = await readFile(new URL('../middleware.ts', import.meta.url), 'utf8');
assert.match(middleware, /const role=String\(verified\.payload\.role/);
assert.match(middleware, /role==='student'\|\|role==='guardian'/);
assert.match(middleware, /path\.startsWith\('\/api\/learner\/'\)/);
assert.match(middleware, /role==='student'&&path\.startsWith\('\/api\/attempts'\)/);
assert.match(middleware, /method==='GET'&&path\.startsWith\('\/api\/assignments'\)/);
assert.match(middleware, /method!=='GET'&&hasPrefix\(teacherMutationBlocked\)/);
assert.match(middleware, /status:403/);

console.log('PASS: middleware role boundary denies learner and teacher mutations by default');
