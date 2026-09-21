const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()')
  .then(r => {
    console.log('OK Connected:', r.rows[0].now);
    process.exit(0);
  })
  .catch(e => {
    console.error('FAIL:', e.message);
    process.exit(1);
  });