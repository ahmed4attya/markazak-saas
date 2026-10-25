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
  const rl = await rateLimit('questions:' + s.userId, 60, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'محاولات كثيرة — انتظر قليلا' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } });
  const { searchParams } = new URL(req.url);
  const domain = (searchParams.get('domain') || '').trim();
  const courseId = (searchParams.get('courseId') || '').trim();
  const status = (searchParams.get('status') || '').trim();
  const difficulty = (searchParams.get('difficulty') || '').trim();
  const q = (searchParams.get('q') || '').trim();
  const hasPassage = (searchParams.get('hasPassage') || '').trim();
  const hasImage = (searchParams.get('hasImage') || '').trim();

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

  if (domain && DOMAINS.includes(domain)) {
    vals.push(domain);
    sql += ' and domain=$' + vals.length;
  }
  if (courseId) {
    vals.push(courseId);
    sql += ' and course_id=$' + vals.length;
  }
  if (status && ['active', 'review', 'disabled'].includes(status)) {
    vals.push(status);
    sql += ' and status=$' + vals.length;
  }
  if (difficulty && !isNaN(Number(difficulty))) {
    vals.push(Number(difficulty));
    sql += ' and difficulty=$' + vals.length;
  }
  if (hasPassage === 'true' || hasPassage === '1') {
    sql += " and passage is not null and trim(passage) != ''";
  } else if (hasPassage === 'false' || hasPassage === '0') {
    sql += " and (passage is null or trim(passage) = '')";
  }
  if (hasImage === 'true' || hasImage === '1') {
    sql += " and image_url is not null and trim(image_url) != ''";
  } else if (hasImage === 'false' || hasImage === '0') {
    sql += " and (image_url is null or trim(image_url) = '')";
  }
  if (q) {
    vals.push(`%${q}%`);
    const p = vals.length;
    sql += ` and (text ilike $${p} or topic ilike $${p} or skill ilike $${p} or subject ilike $${p} or explanation ilike $${p})`;
  }

  sql += ' order by created_at desc limit 400';
  return NextResponse.json((await query(sql, vals)).rows);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const b = (await req.json()) as {
      courseId?: string | null;
      domain?: string;
      subject?: string;
      topic?: string;
      skill?: string;
      difficulty?: number;
      kind?: string;
      text?: string;
      options?: string[];
      correctIndex?: number;
      explanation?: string;
      passage?: string | null;
      imageUrl?: string | null;
      image_url?: string | null;
    };
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
    const passage = typeof b.passage === 'string' ? b.passage.trim() : null;
    const imageUrl = typeof b.imageUrl === 'string' ? b.imageUrl.trim() : (typeof b.image_url === 'string' ? b.image_url.trim() : null);

    const ins = (await query(
      `insert into questions(
        tenant_id, course_id, domain, subject, topic, skill, difficulty, kind, text, options, correct_index, explanation, created_by, passage, image_url
      ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`,
      [s.tenantId, courseId, domain, b.subject || null, b.topic || null, b.skill || null, difficulty, kind, text, JSON.stringify(options), correctIndex, b.explanation || null, s.userId, passage, imageUrl]
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
  const b = (await req.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    text?: string;
    options?: string[];
    correctIndex?: number;
    correct_index?: number;
    explanation?: string;
    passage?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    difficulty?: number;
    domain?: string;
    subject?: string;
    topic?: string;
    skill?: string;
    courseId?: string | null;
    course_id?: string | null;
  };
  const id = String(b.id || '').trim();
  if (!id) return NextResponse.json({ error: 'معرف السؤال مطلوب' }, { status: 400 });

  const existingRows = (await query('select * from questions where id=$1 and tenant_id=$2', [id, s.tenantId])).rows;
  if (!existingRows.length) return NextResponse.json({ error: 'السؤال غير موجود' }, { status: 404 });
  const q = existingRows[0];

  const allowed = isAdminRole(s.role)
    ? true
    : String(q.created_by || '') === s.userId && (!q.course_id || await canAccessCourse(s, String(q.course_id)));
  if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  // If this is solely a status toggle:
  const isOnlyStatus = Object.keys(b).filter((k) => k !== 'id').length === 1 && b.status !== undefined;
  if (isOnlyStatus) {
    const status = String(b.status || '');
    if (!['active', 'review', 'disabled'].includes(status)) {
      return NextResponse.json({ error: 'حالة السؤال غير صالحة' }, { status: 400 });
    }
    const r = (await query('update questions set status=$3 where id=$1 and tenant_id=$2 returning *', [id, s.tenantId, status])).rows[0];
    await logAudit({ tenantId: s.tenantId, userId: s.userId, action: 'question.status', entity: 'question', entityId: id, metadata: { status } });
    return NextResponse.json(r);
  }

  // Full or partial question update:
  const sets: string[] = [];
  const vals: any[] = [id, s.tenantId];

  if (typeof b.text === 'string') {
    const trimmed = b.text.trim();
    if (!trimmed) return NextResponse.json({ error: 'نص السؤال مطلوب' }, { status: 400 });
    vals.push(trimmed);
    sets.push(`text=$${vals.length}`);
  }

  if (b.options !== undefined) {
    const opts = Array.isArray(b.options) ? b.options.map((x) => String(x || '').trim()).filter(Boolean) : [];
    if (opts.length < 2 || opts.length > 6) return NextResponse.json({ error: 'الخيارات يجب أن تكون بين 2 و6' }, { status: 400 });
    vals.push(JSON.stringify(opts));
    sets.push(`options=$${vals.length}`);
  }

  const ci = b.correctIndex !== undefined ? b.correctIndex : b.correct_index;
  if (ci !== undefined) {
    const num = Number(ci);
    if (isNaN(num) || num < 0) return NextResponse.json({ error: 'الإجابة الصحيحة غير صالحة' }, { status: 400 });
    vals.push(num);
    sets.push(`correct_index=$${vals.length}`);
  }

  if (b.explanation !== undefined) {
    vals.push(b.explanation ? String(b.explanation).trim() : null);
    sets.push(`explanation=$${vals.length}`);
  }

  if (b.passage !== undefined) {
    vals.push(b.passage ? String(b.passage).trim() : null);
    sets.push(`passage=$${vals.length}`);
  }

  const img = b.imageUrl !== undefined ? b.imageUrl : b.image_url;
  if (img !== undefined) {
    vals.push(img ? String(img).trim() : null);
    sets.push(`image_url=$${vals.length}`);
  }

  if (b.difficulty !== undefined) {
    const diff = Math.min(5, Math.max(1, Math.round(Number(b.difficulty) || 3)));
    vals.push(diff);
    sets.push(`difficulty=$${vals.length}`);
  }

  if (b.domain !== undefined) {
    if (!DOMAINS.includes(b.domain)) return NextResponse.json({ error: 'التصنيف الرئيسي غير صالح' }, { status: 400 });
    vals.push(b.domain);
    sets.push(`domain=$${vals.length}`);
  }

  if (b.subject !== undefined) {
    vals.push(b.subject ? String(b.subject).trim() : null);
    sets.push(`subject=$${vals.length}`);
  }

  if (b.topic !== undefined) {
    vals.push(b.topic ? String(b.topic).trim() : null);
    sets.push(`topic=$${vals.length}`);
  }

  if (b.skill !== undefined) {
    vals.push(b.skill ? String(b.skill).trim() : null);
    sets.push(`skill=$${vals.length}`);
  }

  const cid = b.courseId !== undefined ? b.courseId : b.course_id;
  if (cid !== undefined) {
    const resolvedCid = cid ? String(cid).trim() : null;
    if (resolvedCid && !(await canAccessCourse(s, resolvedCid))) {
      return NextResponse.json({ error: 'غير مصرح لهذه الدورة' }, { status: 403 });
    }
    vals.push(resolvedCid);
    sets.push(`course_id=$${vals.length}`);
  }

  if (b.status !== undefined) {
    const st = String(b.status || '');
    if (!['active', 'review', 'disabled'].includes(st)) {
      return NextResponse.json({ error: 'حالة السؤال غير صالحة' }, { status: 400 });
    }
    vals.push(st);
    sets.push(`status=$${vals.length}`);
  }

  if (sets.length === 0) {
    return NextResponse.json(q);
  }

  const updateSql = `update questions set ${sets.join(', ')} where id=$1 and tenant_id=$2 returning *`;
  const updated = (await query(updateSql, vals)).rows[0];

  await logAudit({
    tenantId: s.tenantId,
    userId: s.userId,
    action: 'question.update',
    entity: 'question',
    entityId: id,
    metadata: { fields: Object.keys(b).filter((k) => k !== 'id') },
  });

  return NextResponse.json(updated);
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
