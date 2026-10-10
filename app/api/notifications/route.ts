import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rows = (await query(
    'select * from notifications where user_id=$1 and tenant_id=$2 order by created_at desc limit 20',
    [s.userId, s.tenantId]
  )).rows;
  const unread = (await query(
    'select count(*)::int as c from notifications where user_id=$1 and tenant_id=$2 and read_at is null',
    [s.userId, s.tenantId]
  )).rows[0].c;
  return NextResponse.json({ rows, unread });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = (await req.json()) as { action?: string; id?: string };
  if (b.action === 'read-all') {
    await query('update notifications set read_at=now() where user_id=$1 and tenant_id=$2 and read_at is null', [s.userId, s.tenantId]);
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'read' && b.id) {
    await query('update notifications set read_at=now() where id=$1 and user_id=$2 and tenant_id=$3', [b.id, s.userId, s.tenantId]);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'bad request' }, { status: 400 });
}