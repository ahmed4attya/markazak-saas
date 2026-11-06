import bcrypt from 'bcryptjs'
import { loadLocalEnv } from './env'

loadLocalEnv()

async function main() {
  const { pool } = await import('../lib/db')
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const tenantResult = await client.query(
      `insert into tenants(name, slug, plan)
       values('أكاديمية الريادة', 'alriyadah', 'pro')
       on conflict(slug) do update set name = excluded.name
       returning id`,
    )

    const tenantId = tenantResult.rows[0]?.id
    if (!tenantId) throw new Error('Unable to create seed tenant')

    const passwordHash = await bcrypt.hash('admin123', 12)

    await client.query(
      `insert into users(tenant_id, email, name, password_hash, role)
       values($1, 'admin@center.sa', 'مدير النظام', $2, 'owner')
       on conflict(email) do update set
         password_hash = excluded.password_hash,
         tenant_id = excluded.tenant_id,
         name = excluded.name,
         role = excluded.role,
         active = true`,
      [tenantId, passwordHash],
    )

    await client.query(
      `insert into plans(code, name, monthly_price, yearly_price, limits, features)
       values
       ('starter', 'Starter', 99, 990,
        '{"students":300,"teachers":20,"ai_requests":50}',
        '["students","courses","attendance","billing"]'),
       ('pro', 'Pro', 249, 2490,
        '{"students":2000,"teachers":100,"ai_requests":500}',
        '["all","ai","reports","api"]'),
       ('enterprise', 'Enterprise', 799, 7990,
        '{"students":-1,"teachers":-1,"ai_requests":-1}',
        '["all","sso","white_label","priority"]')
       on conflict(code) do update set
         name = excluded.name,
         monthly_price = excluded.monthly_price,
         yearly_price = excluded.yearly_price,
         limits = excluded.limits,
         features = excluded.features,
         active = true`,
    )

    await client.query('COMMIT')
    console.log('Seed complete')
    console.log('Login: admin@center.sa / admin123')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Database seed failed')
  console.error(error)
  process.exitCode = 1
})
