import { z } from 'zod';

export const lessonInputSchema = z.object({
  courseId: z.string().uuid(),
  videoId: z.string().uuid().nullable().optional().default(null),
  position: z.number().int().min(1).max(10000),
  title: z.string().trim().min(2).max(255),
  description: z.string().trim().max(10000).optional().default(''),
  body: z.string().trim().max(100000).optional().default(''),
  durationMinutes: z.number().int().min(0).max(10000).default(0),
  published: z.boolean().default(false),
});

export const lessonProgressSchema = z.object({
  completed: z.boolean(),
  secondsWatched: z.number().int().min(0).max(86400).default(0),
});
