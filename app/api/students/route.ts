import {NextResponse} from 'next/server';
import {query,safeError} from '@/lib/db';
import {getSession} from '@/lib/auth';
import {studentSchema} from '@/lib/validation';
import {assertPlanQuota} from '@/lib/quota';
import bcrypt from 'bcryptjs';

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

  // Requirement 5: Teacher cannot register students. Allowed roles: owner, manager, admin, staff.
  if(s.role === 'teacher'){
    return NextResponse.json({error:'غير مصرح للمعلم بتسجيل الطلاب، هذه الصلاحية للإدارة فقط'},{status:403});
  }

  try{
    await assertPlanQuota(s.tenantId, 'students');
    const body=await req.json();
    const x=studentSchema.parse(body);
    const rawType=(typeof body.type==='string')?body.type.trim().toLowerCase():'center';
    const stype=(rawType==='center'||rawType==='online')?rawType:'center';

    // Requirement 4: Generate unique student_no automatically if not provided or empty
    let studentNo = (x.student_no || '').trim();
    if (!studentNo) {
      // Find the next sequential number for this tenant
      const year = new Date().getFullYear();
      const countRes = await query(
        `select count(*)::int as c from students where tenant_id = $1`,
        [s.tenantId]
      );
      const nextNum = (countRes.rows[0]?.c || 0) + 1;
      studentNo = `STD-${year}-${String(nextNum).padStart(4, '0')}`;

      // Ensure uniqueness within tenant
      let attempt = 0;
      while (attempt < 5) {
        const dupCheck = await query(
          'select 1 from students where tenant_id=$1 and student_no=$2',
          [s.tenantId, studentNo]
        );
        if (dupCheck.rows.length === 0) break;
        attempt++;
        studentNo = `STD-${year}-${String(nextNum + attempt).padStart(4, '0')}`;
      }
    }

    // Requirement 1 & 4: Check or create linked user account for student portal
    let userId: string | null = null;
    const cleanEmail = (x.email || '').trim().toLowerCase();
    const studentLogin = cleanEmail || `${studentNo.toLowerCase()}@student.markazak.internal`;

    const existingUser = await query(
      'select id from users where tenant_id=$1 and email=$2',
      [s.tenantId, studentLogin]
    );

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      const defaultPassword = x.phone && x.phone.length >= 8 ? x.phone : (studentNo.length >= 8 ? studentNo : '12345678');
      const hash = await bcrypt.hash(defaultPassword, 10);
      const newUser = await query(
        `insert into users (tenant_id, name, email, password_hash, role, phone, active)
         values ($1, $2, $3, $4, 'student', $5, true)
         returning id`,
        [s.tenantId, x.name, studentLogin, hash, x.phone || '']
      );
      userId = newUser.rows[0].id;
    }

    const r=await query(
      'insert into students(tenant_id,student_no,name,phone,email,identity_no,status,type,user_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *',
      [s.tenantId,studentNo,x.name,x.phone,x.email,x.identity_no,x.status,stype,userId]
    );

    return NextResponse.json(r.rows[0],{status:201});
  }catch(e:any){
    return NextResponse.json({ error: safeError(e) },{status:400});
  }
}
