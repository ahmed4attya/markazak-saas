const { Pool } = require('pg');
const pool = new Pool(); 
pool.query('SELECT role, COUNT(*)::int AS n FROM users GROUP BY role ORDER BY n DESC')
  .then(r => { console.table(r.rows); return pool.end(); })
  .catch(e => { console.error('CENSUS-FAIL:', e.message); process.exit(1); });
