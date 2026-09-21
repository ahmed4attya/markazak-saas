import {NextResponse} from 'next/server';
import {query,safeError} from '@/lib/db';
import {getSession} from '@/lib/auth';
import {studentSchema} from '@/lib/validation';

export async function GET(req:Request){
  const s=await getSession();
  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});

  const u=new URL(req.url);
  const q=u.searchParams.get('q')||'';

  const r=await query(
    'select id,student_no,name,phone,email,identity_no,status,created_at from students where tenant_id=$1 and (name ilike $2 or student_no ilike $2 or phone ilike $2) order by created_at desc limit 500',
    [s.tenantId,`%${q}%`]
  );

  return NextResponse.json(r.rows);
}

export async function POST(req:Request){
  const s=await getSession();
  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});

  try{
    const x=studentSchema.parse(await req.json());

    const r=await query(
      'insert into students(tenant_id,student_no,name,phone,email,identity_no,status) values($1,$2,$3,$4,$5,$6,$7) returning *',
      [s.tenantId,x.student_no,x.name,x.phone,x.email,x.identity_no,x.status]
    );

    return NextResponse.json(r.rows[0],{status:201});
  }catch(e:any){
    return NextResponse.json({ error: safeError(e) },{status:400});
  }
}