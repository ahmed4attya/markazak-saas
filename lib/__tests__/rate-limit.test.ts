import { describe, it, expect } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('Rate Limit Tests', () => {
  it('should allow requests under limit', async () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 10 });
    await expect(limiter.check(5, 'user1')).resolves.toBeUndefined();
  });

  it('should block requests over limit', async () => {
    const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 10 });
    for(let i=0; i<5; i++) await limiter.check(5, 'user2');
    await expect(limiter.check(5, 'user2')).rejects.toBeUndefined();
  });
});
