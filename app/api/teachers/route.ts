import {NextResponse} from 'next/server';
import {query,safeError} from '@/lib/db';
import {getSession} from '@/lib/auth';
import {teacherSchema} from '@/lib/validation';
import {assertPlanQuota} from '@/lib/quota';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const u = new URL(req.url);
  const q = (u.searchParams.get('q') || '').trim();
  const status = (u.searchParams.get('status') || '').trim();
  const specialty = (u.searchParams.get('specialty') || '').trim();

  let sql = 'select * from teachers where tenant_id=$1';
  const vals: any[] = [s.tenantId];

  if (q) {
    vals.push(`%${q}%`);
    const p = vals.length;
    sql += ` and (name ilike $${p} or phone ilike $${p} or email ilike $${p} or specialty ilike $${p})`;
  }
  if (status && ['active', 'inactive'].includes(status)) {
    vals.push(status);
    sql += ` and status=$${vals.length}`;
  }
  if (specialty) {
    vals.push(`%${specialty}%`);
    sql += ` and specialty ilike $${vals.length}`;
  }

  sql += ' order by created_at desc limit 500';
  return NextResponse.json((await query(sql, vals)).rows);
}

export async function POST(req:Request){
  const s=await getSession();
  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});
  try{
    await assertPlanQuota(s.tenantId, 'teachers');
    const x=teacherSchema.parse(await req.json());
    return NextResponse.json(
      (await query('insert into teachers(tenant_id,name,phone,email,specialty,status) values($1,$2,$3,$4,$5,$6) returning *',
        [s.tenantId,x.name,x.phone,x.email,x.specialty,x.status]
      )).rows[0],
      {status:201}
    );
  }catch(e:any){
    return NextResponse.json({ error: safeError(e) },{status:400});
  }
}
