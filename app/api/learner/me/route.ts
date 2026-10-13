import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role === 'student') {
    const row = (await query('select name from students where user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows[0];
    return NextResponse.json({ name: row?.name || s.name, role: s.role });
  }
  if (s.role === 'guardian') {
    const children = (await query('select name from students where guardian_user_id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows;
    return NextResponse.json({ name: s.name + (children.length ? ' — (' + children.map((c: any) => c.name).join('، ') + ')' : ''), role: s.role });
  }
  return NextResponse.json({ name: s.name, role: s.role });
}