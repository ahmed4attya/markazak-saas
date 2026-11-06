import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { z } from 'zod';

const moduleSchema = z.object({
  course_id: z.string().uuid('معرف الدورة غير صالح'),
  title: z.string().min(1, 'عنوان الوحدة مطلوب').max(200),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().optional().default(0),
});

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = (searchParams.get('courseId') || '').trim();

  if (!courseId) {
    return NextResponse.json({ error: 'courseId مطلوب' }, { status: 400 });
  }

  try {
    const r = await query(
      `select m.*,
              coalesce((select count(*)::int from lessons l where l.module_id = m.id), 0) as lessons_count
       from modules m
       where m.tenant_id = $1 and m.course_id = $2
       order by m.sort_order asc, m.created_at asc`,
      [s.tenantId, courseId]
    );

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
    const x = moduleSchema.parse(body);

    // Verify course belongs to tenant
    const courseRes = await query('select id from courses where id = $1 and tenant_id = $2', [
      x.course_id,
      s.tenantId,
    ]);
    if (!courseRes.rows.length) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    const r = await query(
      `insert into modules (tenant_id, course_id, title, description, sort_order)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [s.tenantId, x.course_id, x.title, x.description || null, x.sort_order]
    );

    const created = r.rows[0];
    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'module.create',
      entity: 'module',
      entityId: created.id,
      metadata: { courseId: x.course_id, title: x.title },
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
  if (!id) return NextResponse.json({ error: 'معرف الوحدة مطلوب' }, { status: 400 });

  try {
    const r = await query('delete from modules where id = $1 and tenant_id = $2 returning id', [
      id,
      s.tenantId,
    ]);
    if (!r.rows.length) return NextResponse.json({ error: 'الوحدة غير موجودة' }, { status: 404 });

    await logAudit({
      tenantId: s.tenantId,
      userId: s.userId,
      action: 'module.delete',
      entity: 'module',
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
