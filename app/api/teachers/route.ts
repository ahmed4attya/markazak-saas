import {NextResponse} from 'next/server';
import {query,safeError} from '@/lib/db';
import {getSession} from '@/lib/auth';
import {teacherSchema} from '@/lib/validation';
import {assertPlanQuota} from '@/lib/quota';
import bcrypt from 'bcryptjs';

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

  if (s.role === 'teacher') {
    return NextResponse.json({ error: 'غير مصرح للمعلم بإضافة معلمين' }, { status: 403 });
  }

  try{
    await assertPlanQuota(s.tenantId, 'teachers');
    const x=teacherSchema.parse(await req.json());

    // Requirement 1: Check or create linked user account for teacher
    let userId: string | null = null;
    const cleanEmail = (x.email || '').trim().toLowerCase();
    const teacherLogin = cleanEmail || `${(x.phone || 'teacher').replace(/\D/g, '')}@teacher.markazak.internal`;

    const existingUser = await query(
      'select id from users where tenant_id=$1 and email=$2',
      [s.tenantId, teacherLogin]
    );

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      const defaultPassword = x.phone && x.phone.length >= 8 ? x.phone : 'teacher1234';
      const hash = await bcrypt.hash(defaultPassword, 10);
      const newUser = await query(
        `insert into users (tenant_id, name, email, password_hash, role, phone, active)
         values ($1, $2, $3, $4, 'teacher', $5, true)
         returning id`,
        [s.tenantId, x.name, teacherLogin, hash, x.phone || '']
      );
      userId = newUser.rows[0].id;
    }

    const r = await query(
      'insert into teachers(tenant_id,name,phone,email,specialty,status,user_id) values($1,$2,$3,$4,$5,$6,$7) returning *',
      [s.tenantId,x.name,x.phone,x.email,x.specialty,x.status,userId]
    );

    return NextResponse.json(r.rows[0], {status:201});
  }catch(e:any){
    return NextResponse.json({ error: safeError(e) },{status:400});
  }
}
