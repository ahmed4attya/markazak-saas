import assert from 'node:assert/strict';
import { examInputSchema } from '../lib/exam-contract';

const valid = examInputSchema.parse({
  title: 'محاكاة قدرات كمي',
  courseId: '00000000-0000-4000-8000-000000000001',
  kind: 'simulation',
  durationMinutes: 120,
  randomize: true,
  questionIds: ['00000000-0000-4000-8000-000000000002'],
});
assert.equal(valid.kind, 'simulation');
assert.throws(() => examInputSchema.parse({ title: 'x', questionIds: [] }));
assert.throws(() => examInputSchema.parse({ title: 'valid title', questionIds: ['not-a-uuid'] }));
console.log('PASS: exam input contract validates title, type, duration and question ids');
