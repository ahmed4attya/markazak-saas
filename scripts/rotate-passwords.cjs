// M2-0: rotate the five live credentials on PRODUCTION (Neon).
// FAIL-CLOSED: PROD_DATABASE_URL env only; absence = exit 1. No fallback, no local DB.
// SECRET-FREE SOURCE: no credential literals in this file. Supersedes the version committed
// in 45cfad0/7f4100e which contained plaintext literals (incident S-SEC-04, docs/DEV-LOG.md).
// Secrets are generated at runtime (crypto.randomBytes(18), base64 = openssl rand -base64 18
// equivalent), written ONCE to audit-out/ (git-ignored), never printed to stdout.
// Hashing: bcryptjs rounds 12 — same library and compare path as app/api/auth/login.
// Single transaction; verified BEFORE COMMIT; user-count invariance asserted (sixth user untouched).
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const EMAILS = [
  'mohammed@alkhwarizmi.sa',
  'sara@alkhwarizmi.sa',
  'abukhalid@alkhwarizmi.sa',
  'khaled@alkhwarizmi.sa',
  'omar@alkhwarizmi.sa',
];

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
  const pool = new Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();
  try {
    const found = await client.query('select email from users where email = any($1::text[])', [EMAILS]);
    if (found.rows.length !== EMAILS.length) {
      throw new Error(`preflight failed: expected ${EMAILS.length} accounts, found ${found.rows.length}`);
    }
    const before = (await client.query('select count(*)::int as n from users')).rows[0].n;

    await client.query('BEGIN');
    const creds = [];
    for (const email of EMAILS) {
      const pwd = crypto.randomBytes(18).toString('base64');
      const hash = await bcrypt.hash(pwd, 12);
      const r = await client.query('update users set password_hash = $1 where email = $2', [hash, email]);
      if (r.rowCount !== 1) throw new Error(`update failed for ${mask(email)}`);
      creds.push({ email, pwd });
    }
    for (const c of creds) {
      const h = (await client.query('select password_hash from users where email = $1', [c.email])).rows[0];
      if (!h || !(await bcrypt.compare(c.pwd, h.password_hash))) {
        throw new Error(`verify failed for ${mask(c.email)}`);
      }
    }
    const after = (await client.query('select count(*)::int as n from users')).rows[0].n;
    if (after !== before) throw new Error(`user count changed ${before} -> ${after}; aborting`);
    await client.query('COMMIT');

    const outDir = path.join(process.cwd(), 'audit-out');
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(outDir, `rotation-${stamp}.txt`);
    fs.writeFileSync(outFile, creds.map((c) => `${c.email} ${c.pwd}`).join('\n') + '\n', { mode: 0o600 });
    console.log('ROTATION_SUCCESS accounts=5 users_before=' + before + ' users_after=' + after);
    console.log('SECRETS_FILE_LOCAL_GITIGNORED=' + outFile);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) { /* connection already closed */ }
    console.error('ROTATION_FAIL', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
