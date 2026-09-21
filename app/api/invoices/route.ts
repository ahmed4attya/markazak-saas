import {NextResponse} from 'next/server';import {query,safeError} from '@/lib/db';import {getSession,isAdmin} from '@/lib/auth';import {invoiceSchema} from '@/lib/validation';import {logAudit} from '@/lib/audit';import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });

export async function GET(){const s=await getSession();if(!s)return NextResponse.json({error:'unauthorized'},{status:401});try{return NextResponse.json((await query(`select i.*,st.name student_name,coalesce((select sum(p.amount) from payments p where p.invoice_id=i.id),0)::numeric paid from invoices i left join students st on st.id=i.student_id where i.tenant_id=$1 order by i.created_at desc limit 500`,[s.tenantId])).rows)}catch(e:any){return NextResponse.json({error:safeError(e)},{status:500})}}
export async function POST(req:Request){
  const s=await getSession();
  if(!s)return NextResponse.json({error:'unauthorized'},{status:401});
  if(!isAdmin(s.role))return NextResponse.json({error:'الصلاحية دي للإدارة بس'},{status:403});

  try {
    const ip = req.headers.get("x-forwarded-for") || "anonymous";
    await limiter.check(10, ip);
  } catch {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let x;try{x=invoiceSchema.parse(await req.json())}catch(e:any){return NextResponse.json({error:safeError(e,'بيانات الفاتورة غير صالحة')},{status:400})}
try{const st=await query('select id from students where id=$1 and tenant_id=$2',[x.student_id,s.tenantId]);if(!st.rows[0])return NextResponse.json({error:'الطالب ده مش موجود عندك'},{status:404});const number=x.number||`INV-${Date.now()}`;const r=await query('insert into invoices(tenant_id,student_id,number,amount,due_date,status) values($1,$2,$3,$4,$5,$6) returning *',[s.tenantId,x.student_id,number,x.amount,x.due_date,x.status]);await logAudit({tenantId:s.tenantId,userId:s.userId,action:'invoice.create',entity:'invoice',entityId:r.rows[0].id,metadata:{amount:x.amount,student_id:x.student_id}});return NextResponse.json(r.rows[0],{status:201})}catch(e:any){return NextResponse.json({error:safeError(e,'تعذر إنشاء الفاتورة')},{status:400})}}
