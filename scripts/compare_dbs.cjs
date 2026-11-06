const { Pool } = require('pg');

async function checkLocal() {
  const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/training_center';
  const pool = new Pool({ connectionString: localUrl });
  try {
    const res = await pool.query('SELECT count(*) as count FROM questions');
    console.log('Local DB questions count:', res.rows[0].count);
    const tenants = await pool.query('SELECT id, name FROM tenants');
    console.log('Local DB tenants:', tenants.rows);
  } catch (e) {
    console.log('Local DB error:', e.message);
  } finally {
    await pool.end();
  }
}

async function checkNeon() {
  const neonUrl = process.env.DATABASE_URL || process.env.TARGET_DATABASE_URL;
  if (!neonUrl) {
    console.log('Skipping remote DB check: DATABASE_URL not set in environment.');
    return;
  }
  const pool = new Pool({ connectionString: neonUrl });
  try {
    const res = await pool.query('SELECT count(*) as count FROM questions');
    console.log('Remote Prod DB questions count:', res.rows[0].count);
    const tenants = await pool.query('SELECT id, name FROM tenants');
    console.log('Remote DB tenants:', tenants.rows);
  } catch (e) {
    console.log('Remote DB error:', e.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  await checkLocal();
  await checkNeon();
}

main();
