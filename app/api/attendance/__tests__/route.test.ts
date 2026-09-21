import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth');
vi.mock('@/lib/db');
vi.mock('next/server', () => ({
  NextResponse: { json: vi.fn((data, opts) => ({ data, status: opts?.status })) }
}));

describe('Attendance API', () => {
  it('should create record for valid data', async () => {
    (getSession as any).mockResolvedValue({ tenantId: 't1' });
    (query as any).mockResolvedValueOnce({ rows: [{id: 'e1'}] }).mockResolvedValueOnce({ rows: [{id: 'a1'}] });
    
    const req = new Request('http://loc/api/attendance', { 
      method: 'POST', 
      body: JSON.stringify({ group_id: '550e8400-e29b-41d4-a716-446655440000', student_id: '550e8400-e29b-41d4-a716-446655440001', attendance_date: '2023-01-01', status: 'present' }) 
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('should reject invalid student ID', async () => {
    (getSession as any).mockResolvedValue({ tenantId: 't1' });
    const req = new Request('http://loc/api/attendance', { 
      method: 'POST', 
      body: JSON.stringify({ student_id: 'invalid' }) 
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
