// lib/rate-limit.ts - M1: Upstash sliding-window limiters (wired via middleware for public endpoints).
// Fail-open contract: returns null when Upstash env is absent OR backend errors;
// callers MUST treat null as "allow" so local dev and outages never hard-block.
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const g = globalThis as unknown as { __markazakLimiters?: Map<string, Ratelimit> };

function cache(): Map<string, Ratelimit> {
  if (!g.__markazakLimiters) g.__markazakLimiters = new Map();
  return g.__markazakLimiters;
}

function limiterFor(limit: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const key = String(limit);
  const hit = cache().get(key);
  if (hit) return hit;
  const redis = new Redis({ url, token });
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, '1 m'),
    prefix: 'markazak:rl:' + key,
    analytics: false,
  });
  cache().set(key, rl);
  return rl;
}

export type RateVerdict = { ok: boolean; limit: number; remaining: number; reset: number };

export async function checkRate(identifier: string, limit = 60): Promise<RateVerdict | null> {
  const rl = limiterFor(limit);
  if (!rl) return null;
  try {
    const r = await rl.limit(identifier);
    return { ok: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
  } catch (e) {
    console.error('rate-limit check failed (fail-open)', e);
    return null;
  }
}
