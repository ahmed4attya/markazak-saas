import {NextResponse} from 'next/server';import {query} from '@/lib/db';import {signSession} from '@/lib/auth';import {rateLimit} from '@/lib/rate-limit';import bcrypt from 'bcryptjs';import {z} from 'zod'
export async function POST(req:Request){
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  try{
    const b=await req.json();
    const emailForLimit=String(b?.email||'').toLowerCase().trim();
    const limitKey=`login:${ip}:${emailForLimit}`;
    
    // Using the new rateLimit implementation
    const limiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });
    try {
      await limiter.check(5, limitKey);
    } catch {
      return NextResponse.json({error:'Too many requests. Please try again later.'}, {status: 429 });
    }

    const x=z.object({email:z.string().email(),password:z.string().min(1)}).parse(b);
    const r=await query<any>('select id,tenant_id,email,name,password_hash,role,active from users where lower(email)=lower($1) limit 1',[x.email]);
    const u=r.rows[0];
    if(!u||!u.active||!(u.password_hash&&await bcrypt.compare(x.password,u.password_hash)))return NextResponse.json({error:'بيانات الدخول غير صحيحة'},{status:401});
    const token=await signSession({userId:u.id,tenantId:u.tenant_id,role:u.role,name:u.name,email:u.email});
    const res=NextResponse.json({ok:true,user:{name:u.name,email:u.email,role:u.role}});
    res.cookies.set('session',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:604800});
    return res
  }catch(e){
    return NextResponse.json({error:'تعذر تسجيل الدخول'},{status:400})
  }
}
