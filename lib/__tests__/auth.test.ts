import { describe, it, expect, vi } from 'vitest';
import { signSession, getSession } from '../auth';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';

describe('Auth Tests', () => {
  it('should accept a valid JWT', async () => {
    const session = { userId: '1', tenantId: 't1', role: 'admin', name: 'N', email: 'e' };
    const token = await signSession(session);
    (cookies as any).mockReturnValue({ get: (k: string) => k === 'session' ? { value: token } : null });
import { describe, it, expect, vi } from 'vitest';
import { signSession, getSession } from '../auth';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';

describe('Auth Tests', () => {
  it('should accept a valid JWT', async () => {
    const session = { userId: '1', tenantId: 't1', role: 'admin', name: 'N', email: 'e' };
    const token = await signSession(session);
    (cookies as any).mockReturnValue({ get: (k: string) => k === 'session' ? { value: token } : null });
    const result = await getSession();
    expect(result).toMatchObject(session);
  });

  it('should reject missing JWT', async () => {
    (cookies as any).mockReturnValue({ get: () => null });
    const result = await getSession();
    expect(result).toBeNull();
  });
});

  });

  it('should reject missing JWT', async () => {
    (cookies as any).mockReturnValue({ get: () => null });
    const result = await getSession();
    expect(result).toBeNull();
  });
});
