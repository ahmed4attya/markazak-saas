// seed-local-canonical.cjs — S-ENV-04 — LOCAL ONLY, host-guarded, bcryptjs, deterministic uuids
const { Pool } = require('pg');
const bcryptjs = require('bcryptjs');
const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!raw) { console.log('SEED_NO_URL'); process.exit(2); }
const u = new URL(raw);
if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') { console.log('SEED_ABORT_NOT_LOCAL'); process.exit(3); }
const TENANT = '11111111-1111-1111-1111-111111111111';
const ST1 = '22222222-2222-2222-2222-222222222222';
const ST2 = '22222222-2222-2222-2222-222222222223';
const pool = new Pool({ connectionString: raw, max: 1, connectionTimeoutMillis: 8000 });
(async () => {
  await pool.query('insert into tenants (id, name, slug) values ($1,$2,$3) on conflict (id) do update set name=excluded.name, slug=excluded.slug', [TENANT, '\u0645\u0631\u0643\u0632 \u0627\u0644\u062A\u062C\u0627\u0631\u0628 \u0627\u0644\u0645\u062D\u0644\u064A', 'local-lab']);
  const hash = await bcryptjs.hash('Local#1234', 10);
  const users = [
    ['admin@local.test', 'admin', 'Local Admin'],
    ['manager@local.test', 'manager', 'Local Manager'],
    ['teacher@local.test', 'teacher', 'Local Teacher'],
    ['guardian@local.test', 'guardian', 'Local Guardian'],
    ['student@local.test', 'student', 'Local Student'],
  ];
  for (const [email, role, name] of users) {
    await pool.query('insert into users (tenant_id, email, name, password_hash, role) values ($1,$2,$3,$4,$5) on conflict (email) do update set tenant_id=excluded.tenant_id, name=excluded.name, password_hash=excluded.password_hash, role=excluded.role', [TENANT, email, name, hash, role]);
  }
  const students = [
    [ST1, 'LAB-001', '\u0637\u0627\u0644\u0628 \u0641\u062D\u0635 \u0623'],
    [ST2, 'LAB-002', '\u0637\u0627\u0644\u0628 \u0641\u062D\u0635 \u0628'],
  ];
  for (const [id, no, name] of students) {
    await pool.query('insert into students (id, tenant_id, student_no, name, type, status) values ($1,$2,$3,$4,$5,$6) on conflict (id) do update set student_no=excluded.student_no, name=excluded.name, type=excluded.type, status=excluded.status', [id, TENANT, no, name, 'center', 'active']);
  }
  const cu = await pool.query('select count(*)::int as c from users');
  const cs = await pool.query('select count(*)::int as c from students');
  const ct = await pool.query('select count(*)::int as c from tenants');
  console.log('SEED_OK users=' + cu.rows[0].c + ' students=' + cs.rows[0].c + ' tenants=' + ct.rows[0].c);
  await pool.end();
})().catch(e => { console.log('SEED_FAIL code=' + (e.code || 'UNKNOWN')); process.exit(1); });
