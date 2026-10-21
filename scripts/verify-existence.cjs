const { Pool } = require('pg');
async function check() {
    const pool = new Pool({ connectionString: process.env.PROD_DATABASE_URL });
    const accounts = [
        'mohammed@alkhwarizmi.sa', 'sara@alkhwarizmi.sa', 'abukhalid@alkhwarizmi.sa', 'khaled@alkhwarizmi.sa', 'omar@alkhwarizmi.sa'
    ];
    try {
        let found = 0;
        for (const email of accounts) {
            const res = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
            if (res.rows.length > 0) found++;
        }
        console.log(`FOUND_COUNT: ${found}/5`);
    } catch (e) {
        console.error('CHECK_FAIL', e.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}
check();
