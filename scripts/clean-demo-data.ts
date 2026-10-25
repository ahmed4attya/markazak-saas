import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { loadLocalEnv } from "./env"

loadLocalEnv()

const DB_CONTAINER = "training-center-saas-db-1"
const DB_USER = "postgres"
const DB_NAME = "training_center"

const BACKUP_DIR = path.join(
  process.cwd(),
  "backups",
  `demo-clean-${new Date().toISOString().replace(/[:.]/g, "-")}`,
)

fs.mkdirSync(BACKUP_DIR, { recursive: true })

const backupFile = path.join(BACKUP_DIR, "training_center.sql")

function maskDatabaseUrl(url: string | undefined) {
  if (!url) return "NOT SET"

  return url.replace(
    /:\/\/([^:]+):([^@]+)@/,
    (_match, user) => `://${user}:********@`,
  )
}

function createBackup() {
  console.log("1) إنشاء Backup كامل من PostgreSQL داخل Docker...")
  console.log("")

  try {
    const dump = execFileSync(
      "docker",
      [
        "exec",
        DB_CONTAINER,
        "pg_dump",
        "-U",
        DB_USER,
        "-d",
        DB_NAME,
        "--format=plain",
        "--no-owner",
        "--no-privileges",
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 50 * 1024 * 1024,
      },
    )

    fs.writeFileSync(backupFile, dump, "utf8")
  } catch (error) {
    console.error("")
    console.error("تعذر إنشاء Backup من حاوية PostgreSQL.")
    console.error("لم يتم حذف أي بيانات.")
    console.error("")
    throw error
  }

  if (!fs.existsSync(backupFile) || fs.statSync(backupFile).size === 0) {
    throw new Error("Backup file was not created correctly")
  }

  console.log("Backup completed successfully.")
  console.log(`Backup size: ${fs.statSync(backupFile).size} bytes`)
  console.log(`Backup file: ${backupFile}`)
  console.log("")
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured")
  }

  console.log("")
  console.log("==============================================")
  console.log("   تنظيف البيانات التجريبية - مركزك SaaS")
  console.log("==============================================")
  console.log("")

  console.log("Database:", maskDatabaseUrl(process.env.DATABASE_URL))
  console.log("Docker DB:", DB_CONTAINER)
  console.log("")

  createBackup()

  const { pool } = await import("../lib/db")
  const client = await pool.connect()

  const countTables = [
    "users",
    "students",
    "teachers",
    "courses",
    "classrooms",
    "groups",
    "enrollments",
    "attendance",
    "invoices",
    "payments",
    "certificates",
    "notifications",
    "audit_logs",
    "subscriptions",
    "settings",
    "plans",
    "tenants",
  ]

  try {
    console.log("2) قراءة عدد السجلات قبل التنظيف...")
    console.log("")

    const before: Record<string, number> = {}

    for (const table of countTables) {
      const result = await client.query(
        `SELECT COUNT(*)::int AS count FROM "${table}"`,
      )

      before[table] = result.rows[0].count
      console.log(`${table.padEnd(18)} ${before[table]}`)
    }

    console.log("")

    const accountResult = await client.query(
      `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.tenant_id,
        t.name AS tenant_name,
        t.slug AS tenant_slug
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      WHERE lower(u.email) = lower($1)
      `,
      ["admin@center.sa"],
    )

    if (accountResult.rows.length !== 1) {
      throw new Error(
        `Expected exactly one test account admin@center.sa, found ${accountResult.rows.length}`,
      )
    }

    const account = accountResult.rows[0]

    console.log("3) حساب التجربة الذي سيتم الاحتفاظ به:")
    console.log("")
    console.log("Email      :", account.email)
    console.log("Name       :", account.name)
    console.log("Role       :", account.role)
    console.log("Tenant     :", account.tenant_name)
    console.log("Tenant Slug:", account.tenant_slug)
    console.log("")

    console.log("4) بدء Transaction...")
    await client.query("BEGIN")

    console.log("حذف payments...")
    await client.query("DELETE FROM payments")

    console.log("حذف invoices...")
    await client.query("DELETE FROM invoices")

    console.log("حذف attendance...")
    await client.query("DELETE FROM attendance")

    console.log("حذف enrollments...")
    await client.query("DELETE FROM enrollments")

    console.log("حذف certificates...")
    await client.query("DELETE FROM certificates")

    console.log("حذف groups...")
    await client.query("DELETE FROM groups")

    console.log("حذف students...")
    await client.query("DELETE FROM students")

    console.log("حذف teachers...")
    await client.query("DELETE FROM teachers")

    console.log("حذف classrooms...")
    await client.query("DELETE FROM classrooms")

    console.log("حذف courses...")
    await client.query("DELETE FROM courses")

    console.log("حذف notifications...")
    await client.query("DELETE FROM notifications")

    console.log("حذف audit_logs...")
    await client.query("DELETE FROM audit_logs")

    console.log("حذف subscriptions...")
    await client.query("DELETE FROM subscriptions")

    console.log("حذف settings...")
    await client.query("DELETE FROM settings")

    console.log("حذف جميع المستخدمين باستثناء حساب التجربة...")
    await client.query(
      `
      DELETE FROM users
      WHERE lower(email) <> lower($1)
      `,
      ["admin@center.sa"],
    )

    console.log("تحديث المؤسسة المرتبطة بحساب التجربة...")
    await client.query(
      `
      UPDATE tenants
      SET
        name = 'أكاديمية الريادة',
        status = 'active',
        updated_at = now()
      WHERE id = $1
      `,
      [account.tenant_id],
    )

    await client.query("COMMIT")

    console.log("")
    console.log("==============================================")
    console.log("تم تنظيف البيانات التجريبية بنجاح")
    console.log("==============================================")
    console.log("")

    console.log("الحساب المحفوظ:")
    console.log("Email: admin@center.sa")
    console.log("Password: admin123")
    console.log("")

    console.log("Tenant:", account.tenant_name)
    console.log("")

    console.log("5) التحقق من النتائج...")
    console.log("")

    for (const table of countTables) {
      const result = await client.query(
        `SELECT COUNT(*)::int AS count FROM "${table}"`,
      )

      const count = result.rows[0].count
      console.log(`${table.padEnd(18)} ${count}`)
    }

    console.log("")

    const verifyAccount = await client.query(
      `
      SELECT email, name, role, tenant_id
      FROM users
      WHERE lower(email) = lower($1)
      `,
      ["admin@center.sa"],
    )

    if (verifyAccount.rows.length !== 1) {
      throw new Error("CRITICAL: test account verification failed")
    }

    console.log("حساب التجربة موجود بعد التنظيف.")
    console.log("")
    console.log("Backup محفوظ في:")
    console.log(backupFile)
  } catch (error) {
    try {
      await client.query("ROLLBACK")
      console.error("")
      console.error("حدث خطأ. تم تنفيذ ROLLBACK.")
      console.error("لم يتم اعتماد عملية الحذف.")
    } catch (rollbackError) {
      console.error("Rollback failed:", rollbackError)
    }

    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error("")
  console.error("تنظيف البيانات فشل.")
  console.error(error)
  process.exitCode = 1
})
