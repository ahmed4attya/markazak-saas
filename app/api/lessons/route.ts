import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const lessonSchema = z.object({
  module_id: z.string().uuid('معرف الوحدة غير صالح'),
  course_id: z.string().uuid('معرف الدورة غير صالح'),
  title: z.string().min(1, 'عنوان الدرس مطلوب').max(200),
  content: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  duration_minutes: z.number().int().nonnegative().optional().default(0),
  sort_order: z.number().int().optional().default(0),
  is_free_preview: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const moduleId = (searchParams.get('moduleId') || '').trim();
  const courseId = (searchParams.get('courseId') || '').trim();

  if (!moduleId && !courseId) {
    return NextResponse.json({ error: 'moduleId أو courseId مطلوب' }, { status: 400 });
  }

  try {
    let sql = 'select * from lessons where tenant_id = $1';
    const params: unknown[] = [s.tenantId];

    if (moduleId) {
      params.push(moduleId);
      sql += ` and module_id = $${params.length}`;
    }
    if (courseId) {
      params.push(courseId);
      sql += ` and course_id = $${params.length}`;
    }

    sql += ' order by sort_order asc, created_at asc';

    const r = await query(sql, params);
    return NextResponse.json(r.rows);
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const x = lessonSchema.parse(body);

    // Verify module belongs to tenant
    const modRes = await query(
      'select id from modules where id = $1 and tenant_id = $2 and course_id = $3',
      [x.module_id, s.tenantId, x.course_id]
    );
    if (!modRes.rows.length) {
      return NextResponse.json({ error: 'الوحدة أو الدورة غير موجودة' }, { status: 404 });
    }

    const r = await query(
      `insert into lessons (
         tenant_id, module_id, course_id, title, content, video_url,
         duration_minutes, sort_order, is_free_preview
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       returning *`,
      [
        s.tenantId,
        x.module_id,
        x.course_id,
        x.title,
        x.content || null,
        x.video_url || null,
        x.duration_minutes,
        x.sort_order,
        x.is_free_preview,
      ]
    );

    const created = r.rows[0];
    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'lesson.create',
      entity: 'lesson',
      entityId: created.id,
      metadata: { moduleId: x.module_id, courseId: x.course_id, title: x.title },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdmin(s.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || '').trim();
  if (!id) return NextResponse.json({ error: 'معرف الدرس مطلوب' }, { status: 400 });

  try {
    const r = await query('delete from lessons where id = $1 and tenant_id = $2 returning id', [
      id,
      s.tenantId,
    ]);
    if (!r.rows.length) return NextResponse.json({ error: 'الدرس غير موجود' }, { status: 404 });

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'lesson.delete',
      entity: 'lesson',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
