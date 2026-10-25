// prod-census.cjs — M2-V0-b1 — READ-ONLY prod census + known-literal exposure check.
// Answers: (1) users count + roles; (2) is ANY account (esp. the 6th, outside the
// 5 rotation targets) still on a repo-known password generation?
// Prints masks, roles, uuids, booleans ONLY. Never prints literals, hashes, full
// emails, or raw error messages. Fail-closed: neon host only, repo root only.
const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const KNOWN_EMAILS = [
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
  try { return execSync('git show ' + ref, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }); }
  catch (_) { return ''; }
}

(async () => {
  const url = process.env.PROD_DATABASE_URL;
  if (!url) { console.log('CENSUS_NO_URL'); process.exit(1); }
  let u; try { u = new URL(url); } catch (e) { console.log('CENSUS_BAD_URL'); process.exit(2); }
  if (!/\.neon\.tech$/.test(u.hostname)) { console.log('CENSUS_ABORT_NOT_NEON host=hidden'); process.exit(3); }
  if (!fs.existsSync('package.json')) { console.log('CENSUS_NOT_REPO_ROOT'); process.exit(4); }

  const rot = gitShow('45cfad0:scripts/rotate-passwords.cjs');
  const rotPwd = [...rot.matchAll(/pwd:\s*'([^']+)'/g)].map((m) => m[1]);
  const seed = gitShow('a035d94:scripts/seed-live.ts');
  const seedCand = [];
  for (const line of seed.split(/\r?\n/)) {
    if (!/pass/i.test(line)) continue;
    for (const m of line.matchAll(/'([^']{4,})'|"([^"]{4,})"/g)) seedCand.push(m[1] || m[2]);
  }
  console.log(`CENSUS sources: rotate-literals=${rotPwd.length} seed-live-candidates=${seedCand.length} (values never printed)`);

  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15000 });
  try {
    const r = await pool.query('select id, email, role, tenant_id, password_hash from users order by email');
    console.log('USERS_COUNT=' + r.rows.length);
    const roles = {};
    for (const row of r.rows) roles[row.role] = (roles[row.role] || 0) + 1;
    console.log('ROLES=' + JSON.stringify(roles));
    let exposed = 0; let sixthCount = 0;
    for (const row of r.rows) {
      const isKnown = KNOWN_EMAILS.includes(row.email);
      if (!isKnown) sixthCount++;
      const tag = isKnown ? 'known-5' : 'SIXTH';
      const base = `${tag} ${mask(row.email)} role=${row.role} tenant=${row.tenant_id}`;
      if (!row.password_hash) { console.log(base + ' hash=ABSENT'); continue; }
      let rotActive = false;
      for (const c of rotPwd) { if (await bcrypt.compare(c, row.password_hash)) { rotActive = true; break; } }
      let seedActive = false;
      for (const c of seedCand) { if (await bcrypt.compare(c, row.password_hash)) { seedActive = true; break; } }
      if (rotActive || seedActive) exposed++;
      console.log(`${base} rotate-literal-active=${rotActive ? 'YES' : 'no'} seed-live-active=${seedActive ? 'YES' : 'no'}`);
    }
    console.log('SIXTH_COUNT=' + sixthCount);
    if (exposed === 0) {
      console.log('CENSUS_RESULT: NO-KNOWN-LITERAL-ACTIVE (all accounts on unknown generations)');
    } else {
      console.log(`CENSUS_RESULT: ${exposed} account(s) on repo-known literals — S-SEC-04-class exposure, rotation follow-up required (owner decision)`);
    }
  } finally { await pool.end(); }
})().catch((e) => { console.log('CENSUS_FAIL code=' + (e.code || 'UNKNOWN')); process.exit(5); });
