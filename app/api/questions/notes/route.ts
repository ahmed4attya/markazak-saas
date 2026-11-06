import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const questionId = (searchParams.get('questionId') || '').trim();
  const status = (searchParams.get('status') || '').trim();

  let sql = `
    select qn.*, q.text as question_text, q.domain as question_domain
    from question_notes qn
    join questions q on q.id = qn.question_id and q.tenant_id = qn.tenant_id
    where qn.tenant_id = $1
  `;
  const vals: any[] = [s.tenantId];

  if (s.role === 'teacher') {
    vals.push(s.userId);
    sql += ` and qn.teacher_user_id = $${vals.length}`;
  }

  if (questionId) {
    vals.push(questionId);
    sql += ` and qn.question_id = $${vals.length}`;
  }

  if (status) {
    vals.push(status);
    sql += ` and qn.status = $${vals.length}`;
  }

  sql += ' order by qn.created_at desc limit 200';

  const rows = (await query(sql, vals)).rows;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const b = await req.json();
    const questionId = String(b.questionId || b.question_id || '').trim();
    const note = String(b.note || '').trim();

    if (!questionId || !note) {
      return NextResponse.json({ error: 'معرف السؤال ونص الملاحظة مطلوبان' }, { status: 400 });
    }

    // Verify question belongs to tenant
    const qCheck = await query('select id from questions where id=$1 and tenant_id=$2', [questionId, s.tenantId]);
    if (!qCheck.rows.length) {
      return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });
    }

    // Get teacher name
    const uRow = (await query('select name from users where id=$1 and tenant_id=$2', [s.userId, s.tenantId])).rows[0];
    const teacherName = uRow?.name || 'معلم';

    const ins = (await query(
      `insert into question_notes (tenant_id, question_id, teacher_user_id, teacher_name, note, status)
       values ($1, $2, $3, $4, $5, 'pending')
       returning *`,
      [s.tenantId, questionId, s.userId, teacherName, note]
    )).rows[0];

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'question_note.create',
      entity: 'question_note',
      entityId: String(ins.id),
      metadata: { questionId, noteLength: note.length },
    });

    return NextResponse.json(ins, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Only admin can resolve/reply to teacher notes
  if (!isAdminRole(s.role)) {
    return NextResponse.json({ error: 'الصلاحية للإدارة فقط' }, { status: 403 });
  }

  try {
    const b = await req.json();
    const id = String(b.id || '').trim();
    const status = String(b.status || 'resolved').trim();
    const adminReply = b.adminReply !== undefined ? String(b.adminReply).trim() : null;

    if (!id) return NextResponse.json({ error: 'معرف الملاحظة مطلوب' }, { status: 400 });

    const upd = (await query(
      `update question_notes
       set status = $1, admin_reply = $2, resolved_by = $3, resolved_at = now()
       where id = $4 and tenant_id = $5
       returning *`,
      [status, adminReply, s.userId, id, s.tenantId]
    )).rows[0];

    if (!upd) {
      return NextResponse.json({ error: 'الملاحظة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(upd);
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
