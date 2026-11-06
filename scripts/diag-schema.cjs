// scripts/diag-schema.cjs — READ-ONLY: information_schema + count فقط
const { Pool } = require('pg');
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.LOCAL_DATABASE_URL;
if (!url) { console.log('DIAG_NO_URL'); process.exit(2); }
let hostClass = 'REDACTED-REMOTE';
try { const h = new URL(url).hostname; if (h === 'localhost' || h === '127.0.0.1') hostClass = 'localhost'; } catch (e) {}
console.log('host_class=' + hostClass);
const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 8000 });
(async () => {
  const r = await pool.query("select table_name, column_name, data_type from information_schema.columns where table_name in ('students','tenants','users') and column_name in ('id','tenant_id','updated_at','name') order by table_name, column_name");
  for (const row of r.rows) console.log(row.table_name + '.' + row.column_name + ' = ' + row.data_type);
  try {
    const t = await pool.query('select count(*)::int as c from tenants');
    console.log('tenants_count=' + t.rows[0].c);
  } catch (e) { console.log('tenants_count=ERR_' + (e.code || 'UNKNOWN')); }
  await pool.end();
  console.log('DIAG_SCHEMA_OK');
})().catch(e => { console.log('DIAG_FAIL code=' + (e.code || 'UNKNOWN')); process.exit(1); });
