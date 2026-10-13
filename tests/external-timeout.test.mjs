import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('app/api/ai/route.ts', 'utf8');
assert.match(source, /fetch\(process\.env\.AI_API_URL/);
assert.match(source, /signal:\s*AbortSignal\.timeout\(15000\)/);
console.log('PASS: external AI request has a bounded timeout');
