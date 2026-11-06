import { z } from 'zod';

export const examInputSchema = z.object({
  title: z.string().trim().min(2).max(255),
  courseId: z.string().uuid().nullable().optional().default(null),
  kind: z.enum(['practice', 'simulation']).default('practice'),
  durationMinutes: z.number().int().min(1).max(600).nullable().optional().default(null),
  randomize: z.boolean().default(true),
  questionIds: z.array(z.string().uuid()).min(1).max(200),
});

export type ExamInput = z.infer<typeof examInputSchema>;
