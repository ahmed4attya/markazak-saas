import fs from 'node:fs'
import path from 'node:path'
import { loadLocalEnv } from './env'

loadLocalEnv()

async function main() {
  const { pool } = await import('../lib/db')
  const schemaPath = path.join(process.cwd(), 'db', 'schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')

  let lastError: unknown
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      await pool.query(sql)
      console.log('Database migrated successfully')
      await pool.end()
      return
    } catch (error) {
      lastError = error
      if (attempt === 15) break
      console.log(`Waiting for PostgreSQL... attempt ${attempt}/15`)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  await pool.end()
  throw lastError
}

main().catch((error) => {
  console.error('Database migration failed')
  console.error(error)
  process.exitCode = 1
})
