import { loadLocalEnv } from "./env"

loadLocalEnv()

async function main() {
  const { pool } = await import("../lib/db")
  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    console.log("")
    console.log("==============================================")
    console.log("   English Demo Data Seed - Markazak SaaS")
    console.log("==============================================")
    console.log("")

    // --------------------------------------------------
    // 1. Get existing test account and tenant
    // --------------------------------------------------

    const accountResult = await client.query(
      `
      SELECT
        u.id AS user_id,
        u.tenant_id,
        t.id AS tenant_id
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      WHERE lower(u.email) = lower($1)
      `,
      ["admin@center.sa"],
    )

    if (accountResult.rows.length !== 1) {
      throw new Error(
        `Expected exactly one admin@center.sa account, found ${accountResult.rows.length}`,
      )
    }

    const { user_id: adminId, tenant_id: tenantId } =
      accountResult.rows[0]

    console.log("Using tenant:", tenantId)
    console.log("Admin account:", adminId)
    console.log("")

    // --------------------------------------------------
    // 2. Normalize admin and tenant to English
    // --------------------------------------------------

    await client.query(
      `
      UPDATE users
      SET
        name = 'System Administrator',
        active = true,
        updated_at = now()
      WHERE id = $1
      `,
      [adminId],
    )

    await client.query(
      `
      UPDATE tenants
      SET
        name = 'Al Riyadh Training Academy',
        slug = 'alriyadh',
        timezone = 'Asia/Riyadh',
        currency = 'SAR',
        locale = 'en-SA',
        plan = 'pro',
        status = 'active',
        updated_at = now()
      WHERE id = $1
      `,
      [tenantId],
    )

    // --------------------------------------------------
    // 3. System settings
    // --------------------------------------------------

    await client.query(
      `
      INSERT INTO settings (
        tenant_id,
        data
      )
      VALUES (
        $1,
        $2::jsonb
      )
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = now()
      `,
      [
        tenantId,
        JSON.stringify({
          academy_name: "Al Riyadh Training Academy",
          language: "en",
          timezone: "Asia/Riyadh",
          currency: "SAR",
          date_format: "YYYY-MM-DD",
          phone: "+966500000000",
          email: "info@alriyadh-academy.test",
          address: "Riyadh, Saudi Arabia",
        }),
      ],
    )

    // --------------------------------------------------
    // 4. Subscription
    // --------------------------------------------------

    await client.query(
      `
      INSERT INTO subscriptions (
        tenant_id,
        plan,
        status,
        current_period_end
      )
      VALUES (
        $1,
        'pro',
        'trialing',
        now() + interval '30 days'
      )
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        plan = EXCLUDED.plan,
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end
      `,
      [tenantId],
    )

    // --------------------------------------------------
    // 5. Clean previous demo data for this tenant
    // --------------------------------------------------

    console.log("Cleaning previous English demo data...")

    await client.query(
      `
      DELETE FROM payments
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM invoices
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM attendance
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM enrollments
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM certificates
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM groups
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM students
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM teachers
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM classrooms
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    await client.query(
      `
      DELETE FROM courses
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    console.log("Previous demo data removed.")
    console.log("")

    // --------------------------------------------------
    // 6. Courses
    // --------------------------------------------------

    const courses = [
      {
        code: "ENG-101",
        name: "English Communication",
        category: "Languages",
        duration: 40,
        capacity: 20,
        price: 1200,
        description:
          "Practical English communication skills for everyday and professional situations.",
        objectives:
          "Improve speaking, listening, vocabulary and professional communication.",
        requirements: "Basic English knowledge.",
      },
      {
        code: "IT-101",
        name: "Computer Fundamentals",
        category: "Information Technology",
        duration: 30,
        capacity: 20,
        price: 950,
        description:
          "Introduction to computers, operating systems, files and productivity tools.",
        objectives:
          "Build strong practical computer skills for study and work.",
        requirements: "No previous experience required.",
      },
      {
        code: "WEB-201",
        name: "Web Development",
        category: "Programming",
        duration: 60,
        capacity: 18,
        price: 1800,
        description:
          "Modern web development using HTML, CSS, JavaScript and practical projects.",
        objectives:
          "Build responsive websites and understand modern web development concepts.",
        requirements: "Basic computer skills.",
      },
      {
        code: "OFF-201",
        name: "Microsoft Office Professional",
        category: "Productivity",
        duration: 36,
        capacity: 22,
        price: 1100,
        description:
          "Practical Microsoft Word, Excel and PowerPoint training.",
        objectives:
          "Create professional documents, spreadsheets and presentations.",
        requirements: "Basic computer skills.",
      },
    ]

    const courseIds: Record<string, string> = {}

    for (const course of courses) {
      const result = await client.query(
        `
        INSERT INTO courses (
          tenant_id,
          name,
          code,
          category,
          duration_hours,
          capacity,
          price,
          description,
          objectives,
          requirements,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active'
        )
        RETURNING id
        `,
        [
          tenantId,
          course.name,
          course.code,
          course.category,
          course.duration,
          course.capacity,
          course.price,
          course.description,
          course.objectives,
          course.requirements,
        ],
      )

      courseIds[course.code] = result.rows[0].id
    }

    console.log(`Courses created: ${courses.length}`)

    // --------------------------------------------------
    // 7. Teachers
    // --------------------------------------------------

    const teachers = [
      {
        name: "John Smith",
        phone: "+966501000001",
        email: "john.smith@alriyadh-academy.test",
        specialty: "English Language",
        bio: "English language instructor with practical classroom experience.",
        hourlyRate: 120,
      },
      {
        name: "Michael Brown",
        phone: "+966501000002",
        email: "michael.brown@alriyadh-academy.test",
        specialty: "Information Technology",
        bio: "IT instructor focused on practical computer skills.",
        hourlyRate: 140,
      },
      {
        name: "David Wilson",
        phone: "+966501000003",
        email: "david.wilson@alriyadh-academy.test",
        specialty: "Web Development",
        bio: "Web developer and instructor specializing in modern web technologies.",
        hourlyRate: 160,
      },
      {
        name: "Sarah Johnson",
        phone: "+966501000004",
        email: "sarah.johnson@alriyadh-academy.test",
        specialty: "Office Applications",
        bio: "Productivity software trainer specializing in Microsoft Office.",
        hourlyRate: 110,
      },
    ]

    const teacherIds: string[] = []

    for (const teacher of teachers) {
      const result = await client.query(
        `
        INSERT INTO teachers (
          tenant_id,
          name,
          phone,
          email,
          specialty,
          bio,
          hourly_rate,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
        RETURNING id
        `,
        [
          tenantId,
          teacher.name,
          teacher.phone,
          teacher.email,
          teacher.specialty,
          teacher.bio,
          teacher.hourlyRate,
        ],
      )

      teacherIds.push(result.rows[0].id)
    }

    console.log(`Teachers created: ${teachers.length}`)

    // --------------------------------------------------
    // 8. Classrooms
    // --------------------------------------------------

    const classrooms = [
      {
        name: "Room A",
        capacity: 20,
        location: "First Floor",
        equipment: "Projector, Smart Board, Wi-Fi",
      },
      {
        name: "Room B",
        capacity: 22,
        location: "First Floor",
        equipment: "Projector, Whiteboard, Wi-Fi",
      },
      {
        name: "Computer Lab",
        capacity: 18,
        location: "Second Floor",
        equipment: "18 PCs, Projector, High-Speed Internet",
      },
      {
        name: "Training Hall",
        capacity: 30,
        location: "Ground Floor",
        equipment: "Projector, Audio System, Smart Board",
      },
    ]

    const classroomIds: string[] = []

    for (const classroom of classrooms) {
      const result = await client.query(
        `
        INSERT INTO classrooms (
          tenant_id,
          name,
          capacity,
          location,
          equipment,
          status
        )
        VALUES ($1,$2,$3,$4,$5,'active')
        RETURNING id
        `,
        [
          tenantId,
          classroom.name,
          classroom.capacity,
          classroom.location,
          classroom.equipment,
        ],
      )

      classroomIds.push(result.rows[0].id)
    }

    console.log(`Classrooms created: ${classrooms.length}`)

    // --------------------------------------------------
    // 9. Students
    // --------------------------------------------------

    const students = [
      ["STU-001", "James Anderson", "male", "1998-03-12", "Saudi", "0551000001", "james.anderson@test.com"],
      ["STU-002", "Emma Williams", "female", "1999-07-21", "Saudi", "0551000002", "emma.williams@test.com"],
      ["STU-003", "Daniel Taylor", "male", "2000-01-15", "Saudi", "0551000003", "daniel.taylor@test.com"],
      ["STU-004", "Olivia Thomas", "female", "1997-11-08", "Saudi", "0551000004", "olivia.thomas@test.com"],
      ["STU-005", "William Moore", "male", "1996-05-19", "Egyptian", "0551000005", "william.moore@test.com"],
      ["STU-006", "Sophia Martin", "female", "2001-09-03", "Egyptian", "0551000006", "sophia.martin@test.com"],
      ["STU-007", "Benjamin Jackson", "male", "1998-12-27", "Jordanian", "0551000007", "benjamin.jackson@test.com"],
      ["STU-008", "Ava Thompson", "female", "2000-04-14", "Jordanian", "0551000008", "ava.thompson@test.com"],
      ["STU-009", "Henry White", "male", "1995-08-30", "Indian", "0551000009", "henry.white@test.com"],
      ["STU-010", "Mia Harris", "female", "2002-02-11", "Indian", "0551000010", "mia.harris@test.com"],
      ["STU-011", "Lucas Clark", "male", "1999-10-06", "Pakistani", "0551000011", "lucas.clark@test.com"],
      ["STU-012", "Charlotte Lewis", "female", "2001-06-24", "Pakistani", "0551000012", "charlotte.lewis@test.com"],
    ]

    const studentIds: string[] = []

    for (const student of students) {
      const result = await client.query(
        `
        INSERT INTO students (
          tenant_id,
          student_no,
          name,
          gender,
          birth_date,
          nationality,
          phone,
          email,
          guardian_name,
          guardian_phone,
          address,
          emergency_contact,
          notes,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,'active'
        )
        RETURNING id
        `,
        [
          tenantId,
          student[0],
          student[1],
          student[2],
          student[3],
          student[4],
          student[5],
          student[6],
          "Demo Guardian",
          "+966551000000",
          "Riyadh, Saudi Arabia",
          "+966551000099",
          "English demo student record.",
        ],
      )

      studentIds.push(result.rows[0].id)
    }

    console.log(`Students created: ${students.length}`)

    // --------------------------------------------------
    // 10. Groups
    // --------------------------------------------------

    const groupDefinitions = [
      {
        name: "English Communication - Evening",
        course: "ENG-101",
        teacher: 0,
        classroom: 0,
        room: "Room A",
        mode: "onsite",
        start: "2026-09-01",
        end: "2026-10-30",
        startTime: "17:00",
        endTime: "19:00",
        days: "Sunday, Tuesday, Thursday",
      },
      {
        name: "Computer Fundamentals - Morning",
        course: "IT-101",
        teacher: 1,
        classroom: 2,
        room: "Computer Lab",
        mode: "onsite",
        start: "2026-09-01",
        end: "2026-10-15",
        startTime: "09:00",
        endTime: "11:00",
        days: "Monday, Wednesday",
      },
      {
        name: "Web Development - Evening",
        course: "WEB-201",
        teacher: 2,
        classroom: 2,
        room: "Computer Lab",
        mode: "onsite",
        start: "2026-09-05",
        end: "2026-11-30",
        startTime: "18:00",
        endTime: "20:30",
        days: "Saturday, Monday, Wednesday",
      },
      {
        name: "Microsoft Office Professional",
        course: "OFF-201",
        teacher: 3,
        classroom: 1,
        room: "Room B",
        mode: "onsite",
        start: "2026-09-10",
        end: "2026-10-25",
        startTime: "16:00",
        endTime: "18:00",
        days: "Sunday, Tuesday",
      },
    ]

    const groupIds: string[] = []

    for (const group of groupDefinitions) {
      const result = await client.query(
        `
        INSERT INTO groups (
          tenant_id,
          course_id,
          teacher_id,
          classroom_id,
          name,
          capacity,
          room,
          mode,
          start_date,
          end_date,
          start_time,
          end_time,
          days,
          status
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::varchar,
          $6::integer,
          $7::varchar,
          $8::varchar,
          $9::date,
          $10::date,
          $11::time,
          $12::time,
          $13::varchar,
          $14::varchar
        )
        RETURNING id
        `,
        [
          tenantId,
          courseIds[group.course],
          teacherIds[group.teacher],
          classroomIds[group.classroom],
          group.name,
          20,
          group.room,
          group.mode,
          group.start,
          group.end,
          group.startTime,
          group.endTime,
          group.days,
          "active",
        ],
      )

      groupIds.push(result.rows[0].id)
    }

    console.log(`Groups created: ${groupDefinitions.length}`)

    // --------------------------------------------------
    // 11. Fix group capacity values
    // --------------------------------------------------

    await client.query(
      `
      UPDATE groups
      SET capacity = 20
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    // --------------------------------------------------
    // 12. Enrollments
    // --------------------------------------------------

    const enrollmentMap = [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [5, 0],
      [6, 1],
      [7, 1],
      [8, 1],
      [9, 1],
      [10, 1],
      [11, 1],
      [0, 2],
      [2, 2],
      [4, 2],
      [6, 2],
      [8, 2],
      [10, 2],
      [1, 3],
      [3, 3],
      [5, 3],
      [7, 3],
      [9, 3],
      [11, 3],
    ]

    for (const [studentIndex, groupIndex] of enrollmentMap) {
      const courseCode = groupDefinitions[groupIndex].course
      const price = courses.find(
        (course) => course.code === courseCode,
      )?.price ?? 0

      await client.query(
        `
        INSERT INTO enrollments (
          tenant_id,
          group_id,
          student_id,
          status,
          price,
          discount
        )
        VALUES ($1,$2,$3,'active',$4,0)
        `,
        [
          tenantId,
          groupIds[groupIndex],
          studentIds[studentIndex],
          price,
        ],
      )
    }

    console.log(`Enrollments created: ${enrollmentMap.length}`)

    // --------------------------------------------------
    // 13. Attendance
    // --------------------------------------------------

    const attendanceStatuses = [
      "present",
      "present",
      "present",
      "late",
      "absent",
      "excused",
    ]

    let attendanceCount = 0

    for (let groupIndex = 0; groupIndex < groupIds.length; groupIndex++) {
      const enrolled = enrollmentMap.filter(
        ([, currentGroup]) => currentGroup === groupIndex,
      )

      for (let index = 0; index < enrolled.length; index++) {
        const [studentIndex] = enrolled[index]

        for (let day = 0; day < 3; day++) {
          const date = new Date(2026, 8, 15 + day * 2)
            .toISOString()
            .slice(0, 10)

          const status =
            attendanceStatuses[
              (index + day + groupIndex) %
                attendanceStatuses.length
            ]

          await client.query(
            `
            INSERT INTO attendance (
              tenant_id,
              group_id,
              student_id,
              attendance_date,
              status,
              check_in,
              notes
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7
            )
            ON CONFLICT (group_id, student_id, attendance_date)
            DO NOTHING
            `,
            [
              tenantId,
              groupIds[groupIndex],
              studentIds[studentIndex],
              date,
              status,
              status === "absent"
                ? null
                : `${date}T09:00:00+03:00`,
              status === "late"
                ? "Arrived 15 minutes late."
                : status === "excused"
                  ? "Approved absence."
                  : null,
            ],
          )

          attendanceCount++
        }
      }
    }

    console.log(`Attendance records created: ${attendanceCount}`)

    // --------------------------------------------------
    // 14. Invoices
    // --------------------------------------------------

    const invoiceIds: string[] = []

    for (let index = 0; index < studentIds.length; index++) {
      const amount = [1200, 1200, 950, 950, 1800, 1800, 1100, 1100, 1200, 950, 1800, 1100][index]

      const result = await client.query(
        `
        INSERT INTO invoices (
          tenant_id,
          student_id,
          number,
          amount,
          due_date,
          status,
          notes
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7
        )
        RETURNING id
        `,
        [
          tenantId,
          studentIds[index],
          `INV-2026-${String(index + 1).padStart(4, "0")}`,
          amount,
          `2026-09-${String(20 + (index % 10)).padStart(2, "0")}`,
          index < 8 ? "paid" : index < 10 ? "partial" : "unpaid",
          "English demo invoice.",
        ],
      )

      invoiceIds.push(result.rows[0].id)
    }

    console.log(`Invoices created: ${invoiceIds.length}`)

    // --------------------------------------------------
    // 15. Payments
    // --------------------------------------------------

    for (let index = 0; index < 8; index++) {
      const amounts = [1200, 1200, 950, 950, 1800, 900, 1100, 1100]

      await client.query(
        `
        INSERT INTO payments (
          tenant_id,
          invoice_id,
          amount,
          method,
          reference,
          paid_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6
        )
        `,
        [
          tenantId,
          invoiceIds[index],
          amounts[index],
          index % 2 === 0 ? "cash" : "card",
          `PAY-2026-${String(index + 1).padStart(4, "0")}`,
          `2026-09-${String(10 + index).padStart(2, "0")}T10:00:00+03:00`,
        ],
      )
    }

    // Additional partial payment
    await client.query(
      `
      INSERT INTO payments (
        tenant_id,
        invoice_id,
        amount,
        method,
        reference,
        paid_at
      )
      VALUES (
        $1,$2,$3,'bank_transfer',$4,$5
      )
      `,
      [
        tenantId,
        invoiceIds[9],
        500,
        "PAY-2026-0009",
        "2026-09-18T11:00:00+03:00",
      ],
    )

    console.log("Payments created: 9")

    // --------------------------------------------------
    // 16. Certificates
    // --------------------------------------------------

    const certificates = [
      {
        student: 0,
        course: "ENG-101",
        number: "CERT-2026-0001",
        grade: "Excellent",
      },
      {
        student: 2,
        course: "IT-101",
        number: "CERT-2026-0002",
        grade: "Very Good",
      },
      {
        student: 4,
        course: "WEB-201",
        number: "CERT-2026-0003",
        grade: "Excellent",
      },
    ]

    for (const certificate of certificates) {
      await client.query(
        `
        INSERT INTO certificates (
          tenant_id,
          student_id,
          course_id,
          number,
          issued_at,
          grade,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,'issued'
        )
        `,
        [
          tenantId,
          studentIds[certificate.student],
          courseIds[certificate.course],
          certificate.number,
          "2026-09-20",
          certificate.grade,
        ],
      )
    }

    console.log(`Certificates created: ${certificates.length}`)

    // --------------------------------------------------
    // 17. Notifications for admin
    // --------------------------------------------------

    await client.query(
      `
      DELETE FROM notifications
      WHERE tenant_id = $1
      `,
      [tenantId],
    )

    const notifications = [
      [
        "Welcome to Markazak",
        "Your English demo training center is ready for testing.",
        "system",
      ],
      [
        "Payment Received",
        "A demo payment has been recorded successfully.",
        "payment",
      ],
      [
        "Attendance Review",
        "Some students have late or absent attendance records.",
        "attendance",
      ],
      [
        "New Enrollment",
        "A new student enrollment has been added to the demo data.",
        "enrollment",
      ],
    ]

    for (const notification of notifications) {
      await client.query(
        `
        INSERT INTO notifications (
          tenant_id,
          user_id,
          title,
          body,
          type
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          tenantId,
          adminId,
          notification[0],
          notification[1],
          notification[2],
        ],
      )
    }

    console.log(`Notifications created: ${notifications.length}`)

    // --------------------------------------------------
    // 18. Commit
    // --------------------------------------------------

    await client.query("COMMIT")

    console.log("")
    console.log("==============================================")
    console.log("English demo data created successfully.")
    console.log("==============================================")
    console.log("")
    console.log("Login:")
    console.log("Email    : admin@center.sa")
    console.log("Password : admin123")
    console.log("")
    console.log("Tenant:")
    console.log("Al Riyadh Training Academy")
    console.log("")
    console.log("Demo data:")
    console.log(`Students      : ${students.length}`)
    console.log(`Teachers      : ${teachers.length}`)
    console.log(`Courses       : ${courses.length}`)
    console.log(`Classrooms    : ${classrooms.length}`)
    console.log(`Groups        : ${groupDefinitions.length}`)
    console.log(`Enrollments   : ${enrollmentMap.length}`)
    console.log(`Attendance    : ${attendanceCount}`)
    console.log(`Invoices      : ${invoiceIds.length}`)
    console.log(`Payments      : 9`)
    console.log(`Certificates  : ${certificates.length}`)
    console.log(`Notifications : ${notifications.length}`)
    console.log("")
  } catch (error) {
    await client.query("ROLLBACK")

    console.error("")
    console.error("Seed failed. Transaction rolled back.")
    console.error(error)

    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()

