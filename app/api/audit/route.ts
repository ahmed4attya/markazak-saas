import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const entity = (searchParams.get('entity') || '').trim();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const pageSize = 50;
  const where = ['a.tenant_id = $1'];
  const vals: string[] = [s.tenantId];
  if (entity) { vals.push(entity); where.push('a.entity = $' + vals.length); }
  const whereSql = where.join(' and ');
  const total = (await query('select count(*)::int as c from audit_logs a where ' + whereSql, vals)).rows[0].c;
  const rows = (await query(
    'select a.id, a.action, a.entity, a.entity_id, a.metadata, a.created_at, u.name as user_name from audit_logs a left join users u on u.id = a.user_id where ' + whereSql + ' order by a.created_at desc limit ' + pageSize + ' offset ' + ((page - 1) * pageSize),
    vals
  )).rows;
  return NextResponse.json({ rows, total, page, pageSize });
}