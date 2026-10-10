import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// Aggregates for the Quick Contact sidebar (admin/manager only).
// Late payers: invoices unpaid/partial with student names & phones.
// Today's absentees: students absent on today's attendance records.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const late = (await query(
    `select i.id as invoice_id, i.number, i.amount, i.due_date, st.name as student_name, st.phone as student_phone
     from invoices i left join students st on st.id = i.student_id
     where i.tenant_id=$1 and i.status in ('unpaid','partial')
     order by i.due_date asc limit 20`,
    [s.tenantId]
  )).rows;
  const absent = (await query(
    `select a.id, a.attendance_date, st.name as student_name, st.phone as student_phone
     from attendance a left join students st on st.id = a.student_id
     where a.tenant_id=$1 and a.status='absent' and a.attendance_date = current_date
     order by a.attendance_date desc limit 20`,
    [s.tenantId]
  )).rows;
  return NextResponse.json({ late, absent });
}

// Send in-app notification(s). owner: { to: 'student' | 'absent-all', ... }
export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = (await req.json()) as { title?: string; body?: string; userId?: string; toAllAbsent?: boolean };
  const title = typeof b.title === 'string' ? b.title.slice(0, 200) : '';
  const body = typeof b.body === 'string' ? b.body.slice(0, 1000) : '';
  if (!title || !body) return NextResponse.json({ error: 'العنوان والنص مطلوبان' }, { status: 400 });
  let count = 0;
  if (b.userId) {
    await query('insert into notifications(tenant_id,user_id,title,body,type) values($1,$2,$3,$4,$5)', [s.tenantId, b.userId, title, body, 'quick-contact']);
    count = 1;
  } else if (b.toAllAbsent) {
    const absentees = (await query(
      `select distinct st.id as uid from attendance a join students st on st.id=a.student_id
       where a.tenant_id=$1 and a.status='absent' and a.attendance_date=current_date and st.id is not null`,
      [s.tenantId]
    )).rows;
    for (const r of absentees as { uid: string }[]) {
      await query('insert into notifications(tenant_id,user_id,title,body,type) values($1,$2,$3,$4,$5)', [s.tenantId, r.uid, title, body, 'quick-contact']);
      count++;
    }
  } else {
    return NextResponse.json({ error: 'حدد المستلم' }, { status: 400 });
  }
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'notification.send', entity: 'notification', metadata: { count, title } });
  return NextResponse.json({ ok: true, sent: count }, { status: 201 });
}