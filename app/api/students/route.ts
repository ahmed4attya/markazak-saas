import {NextResponse} from 'next/server';
import {query,safeError} from '@/lib/db';
import {getSession} from '@/lib/auth';
import {studentSchema} from '@/lib/validation';
import {assertPlanQuota} from '@/lib/quota';

export async function GET(req:Request){
  const s=await getSession();
  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});

  const u=new URL(req.url);
  const q=(u.searchParams.get('q')||'').trim();
  const type=(u.searchParams.get('type')||'').toLowerCase();
  const status=(u.searchParams.get('status')||'').toLowerCase();

  let sql = 'select id,student_no,name,phone,email,identity_no,status,type,user_id,guardian_user_id,created_at from students where tenant_id=$1';
  const vals: any[] = [s.tenantId];

  if (q) {
    vals.push(`%${q}%`);
    const p = vals.length;
    sql += ` and (name ilike $${p} or student_no ilike $${p} or phone ilike $${p} or email ilike $${p} or identity_no ilike $${p})`;
  }
  if (type === 'center' || type === 'online') {
    vals.push(type);
    sql += ` and type=$${vals.length}`;
  }
  if (['active', 'inactive', 'graduated', 'suspended'].includes(status)) {
    vals.push(status);
    sql += ` and status=$${vals.length}`;
  }

  sql += ' order by created_at desc limit 500';
  const r = await query(sql, vals);
  return NextResponse.json(r.rows);
}

export async function POST(req:Request){
  const s=await getSession();
  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});

  try{
    await assertPlanQuota(s.tenantId, 'students');
    const body=await req.json();
    const x=studentSchema.parse(body);
    const rawType=(typeof body.type==='string')?body.type.trim().toLowerCase():'center';
    const stype=(rawType==='center'||rawType==='online')?rawType:'center';

    const r=await query(
      'insert into students(tenant_id,student_no,name,phone,email,identity_no,status,type) values($1,$2,$3,$4,$5,$6,$7,$8) returning *',
      [s.tenantId,x.student_no,x.name,x.phone,x.email,x.identity_no,x.status,stype]
    );

    return NextResponse.json(r.rows[0],{status:201});
  }catch(e:any){
    return NextResponse.json({ error: safeError(e) },{status:400});
  }
}
