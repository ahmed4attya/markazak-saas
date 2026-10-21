const { Pool } = require('pg');
async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await pool.query('SELECT 1');
    console.log('DB_STATUS: ALIVE');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('DB_STATUS: DEAD', e.message);
    process.exit(1);
  }
}
run();
