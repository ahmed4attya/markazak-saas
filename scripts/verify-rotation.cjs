// M2-0: verify rotation outcome on PRODUCTION. READ-ONLY.
// Usage: node scripts/verify-rotation.cjs "<rotation-file-path>"  (path printed by rotate-passwords.cjs)
// The rotation file lives under audit-out/ (git-ignored). Its path contains no secret.
// FAIL-CLOSED: PROD_DATABASE_URL env only; absence = exit 1.
const { Pool } = require('pg');
const fs = require('fs');
const bcrypt = require('bcryptjs');

function mask(email) {
  const [user, domain] = email.split('@');
  return user.slice(0, 3) + '***@' + domain;
}

(async () => {
  const url = process.env.PROD_DATABASE_URL;
  if (!url) {
    console.error('ERROR: PROD_DATABASE_URL is missing. Fail-closed.');
    process.exit(1);
  }
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error('ERROR: rotation file path argument missing or file not found. Fail-closed.');
    process.exit(1);
  }
  const creds = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).map((line) => {
    const [email, pwd] = line.trim().split(/\s+/);
    return { email, pwd };
  });
  if (creds.length !== 5 || creds.some((c) => !c.email || !c.pwd)) {
    console.error(`ERROR: expected 5 valid lines, found ${creds.length}. Fail-closed.`);
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    let fails = 0;
    for (const c of creds) {
      const r = (await pool.query('select password_hash from users where email = $1', [c.email])).rows[0];
      if (!r) {
        console.log(`${mask(c.email)} -> FAIL (not found)`);
        fails++;
        continue;
      }
      const ok = await bcrypt.compare(c.pwd, r.password_hash);
      console.log(`${mask(c.email)} -> ${ok ? 'PASS' : 'FAIL'}`);
      if (!ok) fails++;
    }
    console.log(fails === 0 ? 'VERIFY_SUCCESS' : 'VERIFY_FAIL count=' + fails);
    process.exitCode = fails === 0 ? 0 : 1;
  } finally {
    await pool.end();
  }
})();
