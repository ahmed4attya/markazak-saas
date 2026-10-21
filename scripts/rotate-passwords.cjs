const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function rotate() {
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
            const hash = await bcrypt.hash(acc.pwd, 12);
            await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, acc.email]);
            console.log(`Updated: ${acc.email.split("@")[0]}***@...`);
        }
        console.log('ROTATION_SUCCESS');
    } catch (e) {
        console.error('ROTATION_FAIL', e.message);
    } finally {
        await pool.end();
    }
}
rotate();
