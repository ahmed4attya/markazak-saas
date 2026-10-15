import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const t = (await query('select name from tenants where id=$1', [s.tenantId])).rows[0] as any;
  return NextResponse.json({
    name: s.name,
    email: s.email,
    userId: s.userId,
    role: s.role,
    tenantName: t?.name || '',
  });
}
