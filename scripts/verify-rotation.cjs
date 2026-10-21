const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function verify() {
    const url = process.env.PROD_DATABASE_URL;
    if (!url) {
        console.error('ERROR: PROD_DATABASE_URL is missing. Fail-closed.');
        process.exit(1);
    }
    const pool = new Pool({ connectionString: url });
    const accounts = [
        { email: 'mohammed@alkhwarizmi.sa', pwd: 'Rotated_Mhmd_2026_S3cr3t!' },
        { email: 'sara@alkhwarizmi.sa', pwd: 'Rotated_Sara_2026_S3cr3t!' },
        { email: 'abukhalid@alkhwarizmi.sa', pwd: 'Rotated_AbuK_2026_S3cr3t!' },
        { email: 'khaled@alkhwarizmi.sa', pwd: 'Rotated_Khaled_2026_S3cr3t!' },
        { email: 'omar@alkhwarizmi.sa', pwd: 'Rotated_Omar_2026_S3cr3t!' },
    ];

    try {
        for (const acc of accounts) {
            const res = await pool.query('SELECT password_hash FROM users WHERE email = $1', [acc.email]);
            if (res.rows.length === 0) {
                console.log(`${acc.email.split("@")[0]}***@... -> FAIL (Not found)`);
                continue;
            }
            const match = await bcrypt.compare(acc.pwd, res.rows[0].password_hash);
            console.log(`${acc.email.split("@")[0]}***@... -> ${match ? 'PASS' : 'FAIL'}`);
        }
    } catch (e) {
        console.error('VERIFY_ERROR', e.//password_hash);
    } finally {
        await pool.end();
    }
}
verify();
