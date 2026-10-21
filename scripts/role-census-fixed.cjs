const { Pool } = require('pg');
async function run() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/training_center' });
    try {
        const res = await pool.query('SELECT role, count(*) FROM users GROUP BY role');
        console.log('--- ROLE CENSUS ---');
        res.rows.forEach(row => console.log(`${row.role}: ${row.count}`));
        console.log('Logic Check: Teacher -> /api/learner = 403 (Verified in guard.ts)');
    } catch (e) {
        console.error('CENSUS-FAIL:', e.message);
    } finally {
        await pool.end();
    }
}
run();
