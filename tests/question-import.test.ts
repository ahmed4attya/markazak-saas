import assert from 'node:assert/strict';
import { parseQuestionCsv } from '../lib/question-import';

const rows = parseQuestionCsv('domain,text,options,correctIndex,difficulty\nquant,"كم 2+2؟","2|3|4|5",2,1\nwrong,"ناقص",x,4,9');
assert.equal(rows.length, 2);
assert.equal(rows[0].status, 'READY');
assert.equal(rows[1].status, 'DISABLED');
assert.ok(rows[1].issues.length >= 2);
console.log('PASS: question CSV dry-run validates and disables invalid rows');
