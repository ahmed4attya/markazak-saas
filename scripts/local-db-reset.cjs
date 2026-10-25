// local-db-reset.cjs — S-ENV-04 — LOCAL ONLY, host-guarded, fail-closed
const fs = require('fs');
const { Pool } = require('pg');
const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!raw) { console.log('RESET_NO_URL'); process.exit(2); }
let u; try { u = new URL(raw); } catch (e) { console.log('RESET_BAD_URL'); process.exit(2); }
if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') { console.log('RESET_ABORT_NOT_LOCAL'); process.exit(3); }
console.log('db_name=' + u.pathname.replace(/^\//, ''));
const pool = new Pool({ connectionString: raw, max: 1, connectionTimeoutMillis: 8000 });
(async () => {
  const b = await pool.query("select table_name from information_schema.tables where table_schema='public' order by table_name");
  console.log('TABLES_BEFORE=' + (b.rows.map(r => r.table_name).join(',') || '(empty)'));
  await pool.query('drop schema public cascade; create schema public;');
  const sql = fs.readFileSync('db/schema.sql', 'utf8').replace(/^\uFEFF/, '');
  await pool.query(sql);
  const a = await pool.query("select count(*)::int as c from information_schema.tables where table_schema='public'");
  console.log('TABLES_AFTER_COUNT=' + a.rows[0].c);
  console.log('RESET_OK');
  await pool.end();
})().catch(e => { console.log('RESET_FAIL code=' + (e.code || 'UNKNOWN')); process.exit(1); });
