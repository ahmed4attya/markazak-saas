import { z } from 'zod';

export const activationCodeInputSchema = z.object({
  planCode: z.string().trim().min(2).max(40),
  maxUses: z.number().int().min(1).max(100000).default(1),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional().default(null),
});

export const redeemCodeSchema = z.object({ code: z.string().trim().min(8).max(128) });
