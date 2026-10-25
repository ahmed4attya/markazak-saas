import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  reset: number;
  remaining: number;
  allowed?: boolean;
  retryAfterMs?: number;
};

class MemoryLimiter {
  private limits = new Map<string, { count: number; reset: number }>();
  async limit(id: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const record = this.limits.get(id) || { count: 0, reset: now + windowMs };
    if (now > record.reset) {
      this.limits.set(id, { count: 1, reset: now + windowMs });
      return { success: true, limit, reset: record.reset, remaining: limit - 1, allowed: true, retryAfterMs: 0 };
    }
    if (record.count >= limit) return { success: false, limit, reset: record.reset, remaining: 0, allowed: false, retryAfterMs: record.reset - now };
    record.count++;
    this.limits.set(id, record);
    return { success: true, limit, reset: record.reset, remaining: limit - record.count, allowed: true, retryAfterMs: 0 };
  }
}

const memoryLimiter = new MemoryLimiter();

export async function checkRateLimit(
  identifier: string, 
  optionsOrLimit?: any, 
  windowMs?: any, // Changed to any to avoid Duration type conflict
  isAuthRoute?: boolean
): Promise<RateLimitResult> {
  let limit = 10;
  let winMs = 60000;

  if (typeof optionsOrLimit === 'object' && optionsOrLimit !== null) {
    limit = optionsOrLimit.limit ?? 10;
    winMs = optionsOrLimit.windowMs ?? 60000;
  } else if (typeof optionsOrLimit === 'number') {
    limit = optionsOrLimit;
    winMs = windowMs ?? 60000;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const isProd = process.env.NODE_ENV === 'production';

  if (!url || !token) {
    if (isProd && isAuthRoute) {
      return { success: false, limit: 0, reset: Infinity, remaining: 0, allowed: false, retryAfterMs: Infinity };
    }
    return await memoryLimiter.limit(identifier, limit, winMs);
  }

  try {
    const redis = new Redis({ url, token });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.max(1, Math.ceil(winMs / 1000))} s`),
    });
    const res = await ratelimit.limit(identifier);
    return { 
      success: res.success, 
      limit: res.limit, 
      reset: res.reset, 
      remaining: res.remaining,
      allowed: res.success,
      retryAfterMs: res.reset - Date.now()
    };
  } catch (e) {
    console.error("[RateLimit] Transient Redis error, failing open:", e);
    return { success: true, limit, reset: 0, remaining: 1, allowed: true, retryAfterMs: 0 };
  }
}

export { checkRateLimit as rateLimit };

