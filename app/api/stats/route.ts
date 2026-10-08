import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query, safeError } from "@/lib/db";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const [students, teachers, courses, groups, attendance] = await Promise.all(
      [
        query(
          `
          select
            count(*)::int as total,
            count(*) filter (where status = 'active')::int as active,
            count(*) filter (where status = 'graduated')::int as graduated,
            count(*) filter (where status = 'suspended')::int as suspended,
            count(*) filter (where type = 'center')::int as center,
            count(*) filter (where type = 'online')::int as online
          from students
          where tenant_id = $1
        `,
          [session.tenantId],
        ),

        query(
          `
          select
            count(*)::int as total,
            count(*) filter (where status = 'active')::int as active,
            count(*) filter (where status = 'inactive')::int as inactive,
            count(distinct nullif(trim(specialty), ''))::int as specialties
          from teachers
          where tenant_id = $1
        `,
          [session.tenantId],
        ),

        query(
          `
          select
            count(*)::int as total,
            count(*) filter (where status = 'active')::int as active,
            count(*) filter (where status = 'draft')::int as draft,
            count(*) filter (where status = 'archived')::int as archived
          from courses
          where tenant_id = $1
        `,
          [session.tenantId],
        ),

        query(
          `
          select
            count(*)::int as total,
            count(*) filter (where status = 'active')::int as active,
            count(*) filter (where status = 'scheduled')::int as scheduled,
            count(*) filter (where status = 'completed')::int as completed
          from groups
          where tenant_id = $1
        `,
          [session.tenantId],
        ),

        query(
          `
          select
            count(*)::int as total,
            count(*) filter (where status = 'present')::int as present,
            count(*) filter (where status = 'absent')::int as absent,
            count(*) filter (where status = 'late')::int as late,
            count(*) filter (where status = 'excused')::int as excused
          from attendance
          where tenant_id = $1
        `,
          [session.tenantId],
        ),
      ],
    );

    return NextResponse.json({
      students: students.rows[0],
      teachers: teachers.rows[0],
      courses: courses.rows[0],
      groups: groups.rows[0],
      attendance: attendance.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: safeError(error, "تعذر تحميل الإحصائيات") },
      { status: 500 },
    );
  }
}
