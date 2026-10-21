const { Pool } = require('pg');
async function run() {
    const pool = new Pool({ connectionString: process.env.PROD_DATABASE_URL });
    try {
        const res = await pool.query('SELECT role, count(*) FROM users GROUP BY role');
        console.log('--- PROD ROLE CENSUS ---');
        res.rows.forEach(row => console.log(`${row.role}: ${row.count}`));
    } catch (e) {
        console.error('CENSUS_FAIL', e.message);
    } finally {
        await pool.end();
    }
}
run();
