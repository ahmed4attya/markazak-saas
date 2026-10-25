import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { teacherCourseIds, teacherGroupIds } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const tenantId = s.tenantId;

    if (s.role === 'teacher') {
      const courseIds = await teacherCourseIds(s.userId, tenantId);
      const groupIds = await teacherGroupIds(s.userId, tenantId);

      const [courseStats, groupStats, attendanceStats, studentStats] = await Promise.all([
        courseIds.length > 0
          ? query(
              `select
                 count(*)::int as total,
                 count(*) filter (where status='active')::int as active,
                 count(*) filter (where status='draft')::int as draft,
                 count(*) filter (where status='archived')::int as archived
               from courses where tenant_id=$1 and id = any($2)`,
              [tenantId, courseIds]
            )
          : { rows: [{ total: 0, active: 0, draft: 0, archived: 0 }] },

        groupIds.length > 0
          ? query(
              `select
                 count(*)::int as total,
                 count(*) filter (where status='active')::int as active,
                 count(*) filter (where status='scheduled')::int as scheduled,
                 count(*) filter (where status='completed')::int as completed
               from groups where tenant_id=$1 and id = any($2)`,
              [tenantId, groupIds]
            )
          : { rows: [{ total: 0, active: 0, scheduled: 0, completed: 0 }] },

        groupIds.length > 0
          ? query(
              `select
                 count(*)::int as total,
                 count(*) filter (where status='present')::int as present,
                 count(*) filter (where status='absent')::int as absent,
                 count(*) filter (where status='late')::int as late,
                 count(*) filter (where status='excused')::int as excused
               from attendance where tenant_id=$1 and group_id = any($2)`,
              [tenantId, groupIds]
            )
          : { rows: [{ total: 0, present: 0, absent: 0, late: 0, excused: 0 }] },

        groupIds.length > 0
          ? query(
              `select
                 count(distinct s.id)::int as total,
                 count(distinct s.id) filter (where s.status='active')::int as active,
                 count(distinct s.id) filter (where s.status='graduated')::int as graduated,
                 count(distinct s.id) filter (where s.status='suspended')::int as suspended,
                 count(distinct s.id) filter (where s.type='center')::int as center,
                 count(distinct s.id) filter (where s.type='online')::int as online
               from enrollments e
               join students s on s.id=e.student_id
               where e.tenant_id=$1 and e.group_id = any($2)`,
              [tenantId, groupIds]
            )
          : { rows: [{ total: 0, active: 0, graduated: 0, suspended: 0, center: 0, online: 0 }] },
      ]);

      return NextResponse.json({
        students: studentStats.rows[0] || {},
        teachers: { total: 1, active: 1, inactive: 0, specialties: 1 },
        courses: courseStats.rows[0] || {},
        groups: groupStats.rows[0] || {},
        attendance: attendanceStats.rows[0] || {},
      }, { headers: { "cache-control": "no-store" } });
    }

    // Admin / Staff tenant stats
    const [students, teachers, courses, groups, attendance] = await Promise.all([
      query(
        `select
           count(*)::int as total,
           count(*) filter (where status='active')::int as active,
           count(*) filter (where status='graduated')::int as graduated,
           count(*) filter (where status='suspended')::int as suspended,
           count(*) filter (where type='center')::int as center,
           count(*) filter (where type='online')::int as online
         from students where tenant_id=$1`,
        [tenantId]
      ),
      query(
        `select
           count(*)::int as total,
           count(*) filter (where status='active')::int as active,
           count(*) filter (where status='inactive')::int as inactive,
           count(distinct specialty)::int as specialties
         from teachers where tenant_id=$1`,
        [tenantId]
      ),
      query(
        `select
           count(*)::int as total,
           count(*) filter (where status='active')::int as active,
           count(*) filter (where status='draft')::int as draft,
           count(*) filter (where status='archived')::int as archived
         from courses where tenant_id=$1`,
        [tenantId]
      ),
      query(
        `select
           count(*)::int as total,
           count(*) filter (where status='active')::int as active,
           count(*) filter (where status='scheduled')::int as scheduled,
           count(*) filter (where status='completed')::int as completed
         from groups where tenant_id=$1`,
        [tenantId]
      ),
      query(
        `select
           count(*)::int as total,
           count(*) filter (where status='present')::int as present,
           count(*) filter (where status='absent')::int as absent,
           count(*) filter (where status='late')::int as late,
           count(*) filter (where status='excused')::int as excused
         from attendance where tenant_id=$1`,
        [tenantId]
      ),
    ]);

    return NextResponse.json({
      students: students.rows[0] || {},
      teachers: teachers.rows[0] || {},
      courses: courses.rows[0] || {},
      groups: groups.rows[0] || {},
      attendance: attendance.rows[0] || {},
    }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: "stats_unavailable" }, { status: 500 });
  }
}
