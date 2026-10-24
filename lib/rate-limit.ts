// lib/rate-limit.ts - M1 foundation (unwired): Upstash sliding-window limiter.
// Fail-open contract: returns null when Upstash env is absent OR backend errors;
// callers MUST treat null as "allow" so local dev and outages never hard-block.
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const g = globalThis as unknown as { __markazakLimiter?: Ratelimit | null };

function createLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'markazak:rl',
    analytics: false,
  });
}

export const limiter: Ratelimit | null =
  g.__markazakLimiter ?? (g.__markazakLimiter = createLimiter());

export type RateVerdict = { ok: boolean; limit: number; remaining: number; reset: number };

export async function checkRate(identifier: string): Promise<RateVerdict | null> {
  if (!limiter) return null;
  try {
    const r = await limiter.limit(identifier);
    return { ok: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
  } catch (e) {
    console.error('rate-limit check failed (fail-open)', e);
    return null;
  }
}
