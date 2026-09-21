import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const tenantId = session.tenantId;

    const [
      summary,
      students,
      teachers,
      courses,
      groups,
      attendance,
      finance,
      teacherPerformance,
      coursePerformance,
      invoices,
      payments
    ] = await Promise.all([

      query(
        `
        select
          (select count(*)::int from students where tenant_id = $1) as students,
          (select count(*)::int from teachers where tenant_id = $1) as teachers,
          (select count(*)::int from courses where tenant_id = $1) as courses,
          (select count(*)::int from groups where tenant_id = $1) as groups,
          (select count(*)::int from enrollments where tenant_id = $1) as enrollments,
          (select count(*)::int from attendance where tenant_id = $1) as attendance_records,
          (
            select count(*)::int
            from attendance
            where tenant_id = $1
              and status = 'present'
          ) as present,
          (
            select count(*)::int
            from attendance
            where tenant_id = $1
              and status = 'absent'
          ) as absent,
          coalesce(
            (select sum(amount)::numeric from payments where tenant_id = $1),
            0
          ) as revenue,
          coalesce(
            (
              select sum(i.amount - coalesce(p.paid, 0))
              from invoices i
              left join (
                select invoice_id, sum(amount) as paid
                from payments
                where tenant_id = $1
                group by invoice_id
              ) p on p.invoice_id = i.id
              where i.tenant_id = $1
            ),
            0
          ) as outstanding
        `,
        [tenantId]
      ),

      query(
        `
        select
          count(*)::int as total,
          count(*) filter (where status = 'active')::int as active,
          count(*) filter (where status = 'inactive')::int as inactive,
          count(*) filter (where status = 'graduated')::int as graduated,
          count(*) filter (where status = 'suspended')::int as suspended
        from students
        where tenant_id = $1
        `,
        [tenantId]
      ),

      query(
        `
        select
          count(*)::int as total,
          count(*) filter (where status = 'active')::int as active,
          count(*) filter (where status = 'inactive')::int as inactive
        from teachers
        where tenant_id = $1
        `,
        [tenantId]
      ),

      query(
        `
        select
          count(*)::int as total,
          count(*) filter (where status = 'active')::int as active,
          count(*) filter (where status = 'draft')::int as draft,
          count(*) filter (where status = 'archived')::int as archived,
          coalesce(sum(price), 0)::numeric as catalog_value
        from courses
        where tenant_id = $1
        `,
        [tenantId]
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
        [tenantId]
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
        [tenantId]
      ),

      query(
        `
        select
          count(*)::int as invoices,
          coalesce(sum(amount), 0)::numeric as invoiced,
          coalesce(
            sum(case when status = 'paid' then amount else 0 end),
            0
          )::numeric as paid_invoices,
          coalesce(
            sum(case when status = 'unpaid' then amount else 0 end),
            0
          )::numeric as unpaid_invoices,
          coalesce(
            sum(case when status = 'partial' then amount else 0 end),
            0
          )::numeric as partial_invoices,
          coalesce(
            (select sum(amount) from payments where tenant_id = $1),
            0
          )::numeric as payments_total
        from invoices
        where tenant_id = $1
        `,
        [tenantId]
      ),

      query(
        `
        select
          t.id,
          t.name,
          t.specialty,
          t.status,
          count(distinct g.id)::int as groups_count,
          count(distinct e.id)::int as students_count
        from teachers t
        left join groups g
          on g.teacher_id = t.id
         and g.tenant_id = $1
        left join enrollments e
          on e.group_id = g.id
         and e.tenant_id = $1
        where t.tenant_id = $1
        group by t.id, t.name, t.specialty, t.status
        order by students_count desc, t.name
        `,
        [tenantId]
      ),

      query(
        `
        select
          c.id,
          c.name,
          c.category,
          c.duration_hours,
          c.price,
          c.status,
          count(distinct g.id)::int as groups_count,
          count(distinct e.id)::int as students_count,
          coalesce(
            sum(
              case
                when e.id is not null
                then greatest(coalesce(e.price, 0) - coalesce(e.discount, 0), 0)
                else 0
              end
            ),
            0
          )::numeric as enrollment_value
        from courses c
        left join groups g
          on g.course_id = c.id
         and g.tenant_id = $1
        left join enrollments e
          on e.group_id = g.id
         and e.tenant_id = $1
        where c.tenant_id = $1
        group by
          c.id,
          c.name,
          c.category,
          c.duration_hours,
          c.price,
          c.status
        order by students_count desc, c.name
        `,
        [tenantId]
      ),

      query(
        `
        select
          i.id,
          i.number,
          i.amount,
          i.status,
          i.due_date,
          s.name as student_name,
          coalesce(
            (
              select sum(p.amount)
              from payments p
              where p.invoice_id = i.id
                and p.tenant_id = $1
            ),
            0
          )::numeric as paid
        from invoices i
        join students s on s.id = i.student_id
        where i.tenant_id = $1
        order by i.due_date desc nulls last, i.id desc
        limit 20
        `,
        [tenantId]
      ),

      query(
        `
        select
          p.id,
          p.amount,
          p.method,
          p.reference,
          p.invoice_id,
          i.number as invoice_number,
          s.name as student_name
        from payments p
        join invoices i on i.id = p.invoice_id
        join students s on s.id = i.student_id
        where p.tenant_id = $1
        order by p.id desc
        limit 20
        `,
        [tenantId]
      )
    ]);

    const summaryRow = summary.rows[0] || {};
    const attendanceRow = attendance.rows[0] || {};

    const totalAttendance = Number(attendanceRow.total || 0);
    const present = Number(attendanceRow.present || 0);
    const absent = Number(attendanceRow.absent || 0);
    const late = Number(attendanceRow.late || 0);
    const excused = Number(attendanceRow.excused || 0);

    return NextResponse.json({
      summary: {
        ...summaryRow,
        attendance_rate:
          totalAttendance > 0
            ? Number(((present / totalAttendance) * 100).toFixed(1))
            : 0,
        absence_rate:
          totalAttendance > 0
            ? Number(((absent / totalAttendance) * 100).toFixed(1))
            : 0
      },

      students: students.rows[0] || {},
      teachers: teachers.rows[0] || {},
      courses: courses.rows[0] || {},
      groups: groups.rows[0] || {},

      attendance: {
        ...attendanceRow,
        attendance_rate:
          totalAttendance > 0
            ? Number(((present / totalAttendance) * 100).toFixed(1))
            : 0,
        absence_rate:
          totalAttendance > 0
            ? Number(((absent / totalAttendance) * 100).toFixed(1))
            : 0,
        late_rate:
          totalAttendance > 0
            ? Number(((late / totalAttendance) * 100).toFixed(1))
            : 0,
        excused_rate:
          totalAttendance > 0
            ? Number(((excused / totalAttendance) * 100).toFixed(1))
            : 0
      },

      finance: finance.rows[0] || {},
      teacherPerformance: teacherPerformance.rows,
      coursePerformance: coursePerformance.rows,
      invoices: invoices.rows,
      payments: payments.rows
    });

  } catch (error) {
    console.error('Reports API error:', error);

    return NextResponse.json(
      {
        error: 'تعذر تحميل التقارير'
      },
      { status: 500 }
    );
  }
}