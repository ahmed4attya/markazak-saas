import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { teacherCourseIds, canAccessCourse } from '@/lib/access';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

const DOMAINS = ['quant', 'verbal', 'achievement'];

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const rl = await rateLimit('questions:' + s.userId, 30, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'محاولات كثيرة — انتظر قليلا' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } });
  const { searchParams } = new URL(req.url);
  const domain = (searchParams.get('domain') || '').trim();
  const courseId = (searchParams.get('courseId') || '').trim();
  let sql = 'select * from questions where tenant_id=$1';
  const vals: any[] = [s.tenantId];
  if (!isAdminRole(s.role)) {
    if (s.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const ids = await teacherCourseIds(s.userId, s.tenantId);
    if (!ids.length) return NextResponse.json([]);
    vals.push(ids);
    sql += ' and (course_id = ANY($' + vals.length + ') or (course_id is null and created_by=$' + (vals.length + 1) + '))';
    vals.push(s.userId);
    if (courseId && ids.indexOf(courseId) < 0) return NextResponse.json([]);
  }
  if (domain) { vals.push(domain); sql += ' and domain=$' + vals.length; }
  if (courseId) { vals.push(courseId); sql += ' and course_id=$' + vals.length; }
  sql += ' order by created_at desc limit 300';
  return NextResponse.json((await query(sql, vals)).rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const b = (await req.json()) as { courseId?: string | null; domain?: string; subject?: string; topic?: string; skill?: string; difficulty?: number; kind?: string; text?: string; options?: string[]; correctIndex?: number; explanation?: string };
    const courseId = b.courseId || null;
    if (courseId) {
      if (!(await canAccessCourse(s, courseId))) return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    } else if (!isAdminRole(s.role)) {
      return NextResponse.json({ error: 'الأسئلة العامة للمدير فقط — اربط سؤالك بدورة' }, { status: 403 });
    }
    const domain = typeof b.domain === 'string' ? b.domain : '';
    if (DOMAINS.indexOf(domain) < 0) return NextResponse.json({ error: 'التصنيف الرئيسي غير صالح' }, { status: 400 });
    const text = typeof b.text === 'string' ? b.text.trim() : '';
    if (!text) return NextResponse.json({ error: 'نص السؤال مطلوب' }, { status: 400 });
    const options = Array.isArray(b.options) ? b.options.map((x) => String(x || '').trim()).filter(Boolean) : [];
    if (options.length < 2 || options.length > 6) return NextResponse.json({ error: 'الخيارات يجب أن تكون بين 2 و6' }, { status: 400 });
    const correctIndex = typeof b.correctIndex === 'number' ? b.correctIndex : -1;
    if (correctIndex < 0 || correctIndex >= options.length) return NextResponse.json({ error: 'حدد الإجابة الصحيحة' }, { status: 400 });
    const difficulty = typeof b.difficulty === 'number' ? Math.min(5, Math.max(1, Math.round(b.difficulty))) : 3;
    const kind = b.kind === 'truefalse' ? 'truefalse' : 'mcq';
    const ins = (await query(
      'insert into questions(tenant_id,course_id,domain,subject,topic,skill,difficulty,kind,text,options,correct_index,explanation,created_by) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *',
      [s.tenantId, courseId, domain, b.subject || null, b.topic || null, b.skill || null, difficulty, kind, text, JSON.stringify(options), correctIndex, b.explanation || null, s.userId]
    )).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'question.create', entity: 'question', entityId: String(ins.id) });
    return NextResponse.json(ins, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  const id = String(b.id || '');
  const status = String(b.status || '');
  if (!id || !['active', 'review', 'disabled'].includes(status)) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const r = (await query('update questions set status=$3 where id=$1 and tenant_id=$2 returning id, status', [id, s.tenantId, status])).rows[0] as any;
  if (!r) return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'question.status', entity: 'question', entityId: id, metadata: { status } });
  return NextResponse.json(r);
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'bad request' }, { status: 400 });
  const rows = (await query('select * from questions where id=$1 and tenant_id=$2', [id, s.tenantId])).rows;
  if (!rows.length) return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });
  const q = rows[0];
  const allowed = isAdminRole(s.role)
    ? true
    : String(q.created_by || '') === s.userId && (!q.course_id || await canAccessCourse(s, String(q.course_id)));
  if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  await query('delete from questions where id=$1 and tenant_id=$2', [id, s.tenantId]);
  await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'question.delete', entity: 'question', entityId: id });
  return NextResponse.json({ ok: true });
}



