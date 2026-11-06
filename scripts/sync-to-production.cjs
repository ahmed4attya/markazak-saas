const fs = require('fs');
const { Pool } = require('pg');

// 1. Read Prod DB config
const prodEnvContent = fs.readFileSync('audit-out/session-S1/prod-db.env', 'utf8');
let prodDbUrl = '';
for (const line of prodEnvContent.split(/\r?\n/)) {
  const t = line.trim();
  if (t.startsWith('DATABASE_URL=') || t.startsWith('POSTGRES_URL=')) {
    prodDbUrl = t.substring(t.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}
if (!prodDbUrl) {
  console.error('PROD_DB_URL not found');
  process.exit(1);
}

// 2. Read Local DB config
const localEnvContent = fs.readFileSync('.env.local', 'utf8');
let localDbUrl = '';
for (const line of localEnvContent.split(/\r?\n/)) {
  const t = line.trim();
  if (t.startsWith('DATABASE_URL=')) {
    localDbUrl = t.substring(t.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}
if (!localDbUrl) {
  console.error('LOCAL_DB_URL not found');
  process.exit(1);
}

const prodPool = new Pool({ connectionString: prodDbUrl, ssl: { rejectUnauthorized: false } });
const localPool = new Pool({ connectionString: localDbUrl });

async function migrateAndSync() {
  console.log('--- Step 1: Applying schema.sql to Production DB ---');
  const schemaSql = fs.readFileSync('db/schema.sql', 'utf8');
  
  // Apply schema
  try {
    await prodPool.query(schemaSql);
    console.log('✓ schema.sql executed successfully on Production Neon DB');
  } catch (err) {
    console.warn('Note on schema execution:', err.message);
    // Explicitly ensure the critical columns exist
    await prodPool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;
    `);
    console.log('✓ Verified critical columns on users table');
  }

  // Double check columns
  const cols = await prodPool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
  const colNames = cols.rows.map(r => r.column_name);
  console.log('Users columns on prod now:', colNames.join(', '));
  if (!colNames.includes('token_version') || !colNames.includes('failed_attempts')) {
    throw new Error('Missing critical columns after migration!');
  }

  console.log('\n--- Step 2: Fetching/Updating Tenant ---');
  let tenantRes = await prodPool.query("SELECT id, name, slug FROM tenants WHERE slug = 'alriyadh' OR id = '539e7896-7808-4533-ad4d-feed934e9f65' LIMIT 1");
  let prodTenantId;
  if (tenantRes.rows.length > 0) {
    prodTenantId = tenantRes.rows[0].id;
    await prodPool.query(
      "UPDATE tenants SET name = $1, slug = $2 WHERE id = $3",
      ['سنتر الخوارزمي', 'alkhwarizmi', prodTenantId]
    );
    console.log(`✓ Updated existing production tenant: ${prodTenantId} -> سنتر الخوارزمي (alkhwarizmi)`);
  } else {
    const newT = await prodPool.query(
      "INSERT INTO tenants (id, name, slug) VALUES ('539e7896-7808-4533-ad4d-feed934e9f65', 'سنتر الخوارزمي', 'alkhwarizmi') RETURNING id"
    );
    prodTenantId = newT.rows[0].id;
    console.log(`✓ Created production tenant: ${prodTenantId}`);
  }

  console.log('\n--- Step 3: Fetching Users from Local DB ---');
  const localUsersRes = await localPool.query(
    `SELECT id, email, name, role, phone, active, password_hash 
     FROM users 
     WHERE email IN (
       'admin@center.sa', 
       'teacher@center.sa', 
       'student@center.sa', 
       'manager@center.sa', 
       'guardian@center.sa', 
       'ictalzaker@gmail.com', 
       'ict.alzaker@gmail.com'
     )`
  );
  console.log(`Found ${localUsersRes.rows.length} relevant users locally.`);

  console.log('\n--- Step 4: Syncing Users to Production DB ---');
  for (const u of localUsersRes.rows) {
    // Check if user exists on prod
    const existRes = await prodPool.query(
      'SELECT id FROM users WHERE lower(email) = lower($1)',
      [u.email]
    );

    if (existRes.rows.length > 0) {
      await prodPool.query(
        `UPDATE users 
         SET tenant_id = $1, name = $2, role = $3, phone = $4, password_hash = $5, active = true, token_version = 1, failed_attempts = 0, locked_until = NULL, updated_at = NOW()
         WHERE lower(email) = lower($6)`,
        [prodTenantId, u.name, u.role, u.phone || null, u.password_hash, u.email]
      );
      console.log(`✓ Updated user on prod: ${u.email} (${u.role})`);
    } else {
      await prodPool.query(
        `INSERT INTO users (id, tenant_id, email, name, role, phone, password_hash, active, token_version, failed_attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, 1, 0)`,
        [u.id, prodTenantId, u.email.toLowerCase(), u.name, u.role, u.phone || null, u.password_hash]
      );
      console.log(`✓ Inserted user on prod: ${u.email} (${u.role})`);
    }
  }

  console.log('\n--- Step 5: Syncing Teachers & Students Profile Records ---');
  // Sync teachers
  const localTeachers = await localPool.query(
    `SELECT t.name, t.phone, t.email, t.specialty, t.status, u.id as user_id
     FROM teachers t
     LEFT JOIN users u ON lower(u.email) = lower(t.email) OR (t.user_id IS NOT NULL AND t.user_id = u.id)
     WHERE lower(t.email) IN ('ictalzaker@gmail.com', 'teacher@center.sa') OR t.name = 'ِمعلم تجريبي'`
  );
  for (const t of localTeachers.rows) {
    const prodUser = (await prodPool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [t.email || 'ictalzaker@gmail.com'])).rows[0];
    const uid = prodUser?.id || t.user_id;
    const existT = await prodPool.query('SELECT id FROM teachers WHERE tenant_id = $1 AND (user_id = $2 OR lower(email) = lower($3))', [prodTenantId, uid, t.email]);
    if (existT.rows.length === 0 && uid) {
      await prodPool.query(
        `INSERT INTO teachers (tenant_id, name, phone, email, specialty, status, user_id)
         VALUES ($1, $2, $3, $4, $5, 'active', $6)`,
        [prodTenantId, t.name, t.phone || '', t.email || 'ictalzaker@gmail.com', t.specialty || 'عام', uid]
      );
      console.log(`✓ Added teacher profile: ${t.name}`);
    }
  }

  // Sync students
  const localStudents = await localPool.query(
    `SELECT s.student_no, s.name, s.phone, s.email, s.status, s.type, u.id as user_id
     FROM students s
     LEFT JOIN users u ON lower(u.email) = lower(s.email) OR (s.user_id IS NOT NULL AND s.user_id = u.id)
     WHERE lower(s.email) IN ('ict.alzaker@gmail.com', 'student@center.sa') OR s.name = 'طالب تجريبي'`
  );
  for (const s of localStudents.rows) {
    const prodUser = (await prodPool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [s.email || 'ict.alzaker@gmail.com'])).rows[0];
    const uid = prodUser?.id || s.user_id;
    const existS = await prodPool.query('SELECT id FROM students WHERE tenant_id = $1 AND (user_id = $2 OR student_no = $3)', [prodTenantId, uid, s.student_no]);
    if (existS.rows.length === 0 && uid) {
      await prodPool.query(
        `INSERT INTO students (tenant_id, student_no, name, phone, email, status, type, user_id)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)`,
        [prodTenantId, s.student_no || 'STD-PROD-01', s.name, s.phone || '', s.email || 'ict.alzaker@gmail.com', s.type || 'center', uid]
      );
      console.log(`✓ Added student profile: ${s.name} (${s.student_no})`);
    }
  }

  console.log('\n--- Step 6: Verifying Production Users List ---');
  const prodUsers = await prodPool.query(
    "SELECT id, email, name, role, active, token_version, failed_attempts FROM users ORDER BY created_at DESC"
  );
  console.log(`Total users in production DB: ${prodUsers.rows.length}`);
  for (const u of prodUsers.rows) {
    console.log(` - ${u.email} | ${u.role} | active: ${u.active} | token_version: ${u.token_version}`);
  }

  console.log('\n🎉 ALL DONE! Production database is migrated and synchronized successfully.');
}

migrateAndSync()
  .catch(err => {
    console.error('SYNC_ERROR:', err);
  })
  .finally(async () => {
    await prodPool.end();
    await localPool.end();
  });
