const { Pool } = require('pg');

async function checkLocal() {
  const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/training_center' });
  try {
    const res = await pool.query('SELECT count(*) as count FROM questions');
    console.log('Local DB (localhost:5432) questions count:', res.rows[0].count);
    const tenants = await pool.query('SELECT id, name FROM tenants');
    console.log('Local DB tenants:', tenants.rows);
  } catch (e) {
    console.log('Local DB error:', e.message);
  } finally {
    await pool.end();
  }
}

async function checkNeon() {
  const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_37bqXYjIahCz@ep-green-river-b2gmr2y5-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });
  try {
    const res = await pool.query('SELECT count(*) as count FROM questions');
    console.log('Neon Prod DB questions count:', res.rows[0].count);
    const tenants = await pool.query('SELECT id, name FROM tenants');
    console.log('Neon DB tenants:', tenants.rows);
  } catch (e) {
    console.log('Neon DB error:', e.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  await checkLocal();
  await checkNeon();
}

main();
