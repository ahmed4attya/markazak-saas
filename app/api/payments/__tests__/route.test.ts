import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';
import { getSession, isAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth');
vi.mock('@/lib/db');
vi.mock('next/server', () => ({
  NextResponse: { json: vi.fn((data, opts) => ({ data, status: opts?.status })) }
}));

describe('Payments API', () => {
  it('should create payment for valid data', async () => {
    (getSession as any).mockResolvedValue({ tenantId: 't1', role: 'admin' });
    (isAdmin as any).mockReturnValue(true);
    (query as any).mockResolvedValue({ rows: [{ amount: 100, paid: 0 }] });
    
    const req = new Request('http://loc/api/payments', { 
      method: 'POST', 
      body: JSON.stringify({ invoice_id: '550e8400-e29b-41d4-a716-446655440000', amount: 50, method: 'cash' }) 
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('should reject invalid amount', async () => {
    (getSession as any).mockResolvedValue({ tenantId: 't1', role: 'admin' });
    (isAdmin as any).mockReturnValue(true);
    const req = new Request('http://loc/api/payments', { 
      method: 'POST', 
      body: JSON.stringify({ amount: -10 }) 
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
