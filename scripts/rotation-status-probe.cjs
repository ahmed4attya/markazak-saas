// S-SEC-04 pre-rotation probe. READ-ONLY. Answers ONE question without printing any secret:
// which credential generation is currently ACTIVE on production?
//   Source A: literals committed in 45cfad0:scripts/rotate-passwords.cjs (did the broken rotation ever run?)
//   Source B: literals in a035d94:scripts/seed-live.ts (are original seed creds still active?)
// YES on source A = predictable repo-known passwords are LIVE -> emergency rotation.
// FAIL-CLOSED: PROD_DATABASE_URL env only. Run from repo root (needs local git history).
const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
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

function gitShow(ref) {
  try {
    return execSync('git show ' + ref, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  } catch (_) {
    return '';
  }
}

(async () => {
  const url = process.env.PROD_DATABASE_URL;
  if (!url) {
    console.error('ERROR: PROD_DATABASE_URL is missing. Fail-closed.');
    process.exit(1);
  }
  if (!fs.existsSync('package.json')) {
    console.error('ERROR: run from the repository root. Fail-closed.');
    process.exit(1);
  }

  const rot = gitShow('45cfad0:scripts/rotate-passwords.cjs');
  const rotPwd = [...rot.matchAll(/pwd:\s*'([^']+)'/g)].map((m) => m[1]);
  const rotEmail = [...rot.matchAll(/email:\s*'([^']+)'/g)].map((m) => m[1]);

  const seed = gitShow('a035d94:scripts/seed-live.ts');
  const seedCand = [];
  for (const line of seed.split(/\r?\n/)) {
    if (!/pass/i.test(line)) continue;
    for (const m of line.matchAll(/'([^']{4,})'|"([^"]{4,})"/g)) seedCand.push(m[1] || m[2]);
  }

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    console.log(`PROBE sources: rotate-literals=${rotPwd.length} seed-live-candidates=${seedCand.length} (values never printed)`);
    let knownActive = 0;
    let missing = 0;
    for (const email of EMAILS) {
      const r = (await pool.query('select password_hash from users where email = $1', [email])).rows[0];
      if (!r) {
        console.log(`${mask(email)} -> ACCOUNT_NOT_FOUND`);
        missing++;
        continue;
      }
      let rotActive = false;
      const idx = rotEmail.indexOf(email);
      if (idx >= 0 && rotPwd[idx]) rotActive = await bcrypt.compare(rotPwd[idx], r.password_hash);
      let seedActive = false;
      for (const c of seedCand) {
        if (await bcrypt.compare(c, r.password_hash)) { seedActive = true; break; }
      }
      if (rotActive || seedActive) knownActive++;
      console.log(`${mask(email)} -> rotate-literal-active=${rotActive ? 'YES' : 'no'} seed-live-active=${seedActive ? 'YES' : 'no'}`);
    }
    if (missing === EMAILS.length) {
      console.log('PROBE_RESULT: ACCOUNTS_NOT_FOUND (emails mismatch on prod — resolve before rotation)');
    } else if (knownActive === 0) {
      console.log('PROBE_RESULT: NO-KNOWN-LITERAL-ACTIVE (passwords are of unknown generation)');
    } else {
      console.log(`PROBE_RESULT: ${knownActive} account(s) running on repo-known literals — rotate immediately (S-SEC-04)`);
    }
  } finally {
    await pool.end();
  }
})().catch((e) => { console.error('PROBE_ERROR', e.message); process.exitCode = 1; });
