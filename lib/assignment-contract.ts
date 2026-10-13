import { z } from 'zod';

export const assignmentInputSchema = z.object({
  courseId: z.string().uuid(),
  groupId: z.string().uuid().nullable().optional().default(null),
  title: z.string().trim().min(2).max(255),
  description: z.string().trim().max(10000).optional().default(''),
  dueAt: z.string().datetime({ offset: true }).nullable().optional().default(null),
  points: z.number().min(1).max(100000).default(100),
});

export const submissionInputSchema = z.object({
  answerText: z.string().trim().max(50000).optional().default(''),
  attachmentKey: z.string().trim().max(1000).optional().default(''),
});
