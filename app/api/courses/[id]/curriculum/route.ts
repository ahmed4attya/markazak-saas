import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { id: courseId } = await params;

    const courseRes = await query(
      `select c.*,
              coalesce((select string_agg(u.name, '، ') from course_teachers ct join users u on u.id = ct.teacher_user_id where ct.course_id = c.id), '') as teacher_names
       from courses c
       where c.id = $1 and c.tenant_id = $2`,
      [courseId, s.tenantId]
    );

    if (!courseRes.rows.length) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    const course = courseRes.rows[0];

    const modulesRes = await query(
      `select * from modules
       where course_id = $1 and tenant_id = $2
       order by sort_order asc, created_at asc`,
      [courseId, s.tenantId]
    );

    const lessonsRes = await query(
      `select * from lessons
       where course_id = $1 and tenant_id = $2
       order by sort_order asc, created_at asc`,
      [courseId, s.tenantId]
    );

    // Nest lessons under their respective modules
    const lessonsByModule: Record<string, unknown[]> = {};
    for (const lesson of lessonsRes.rows) {
      const mid = String(lesson.module_id);
      if (!lessonsByModule[mid]) lessonsByModule[mid] = [];
      lessonsByModule[mid].push(lesson);
    }

    const modulesWithLessons = modulesRes.rows.map((m) => ({
      ...m,
      lessons: lessonsByModule[String(m.id)] || [],
    }));

    return NextResponse.json({
      course,
      modules: modulesWithLessons,
      totalModules: modulesRes.rows.length,
      totalLessons: lessonsRes.rows.length,
    });
  } catch (e) {
    return NextResponse.json({ error: safeError(e) }, { status: 400 });
  }
}
