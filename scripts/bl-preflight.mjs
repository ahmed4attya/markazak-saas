// BL preflight — env presence (never prints values), local DB ping, dev server ping.
import fs from 'node:fs';
import pg from 'pg';
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const pick = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : null; };
const dbUrl = pick('DATABASE_URL');
const secret = pick('AUTH_SECRET');
console.log('ENV DATABASE_URL: ' + (dbUrl ? 'present' : 'MISSING'));
if (dbUrl) { const at = dbUrl.lastIndexOf('@'); const host = at >= 0 ? dbUrl.slice(at + 1).split('/')[0] : '?'; console.log('ENV DB host: ' + host); }
console.log('ENV AUTH_SECRET: ' + (secret ? ('present len=' + secret.length) : 'MISSING'));
let dbOk = false;
if (dbUrl) {
  try { const c = new pg.Client({ connectionString: dbUrl }); await c.connect();
    const r = await c.query('select count(*)::int as n from users');
    dbOk = true; console.log('DB_OK users=' + r.rows[0].n); await c.end();
  } catch (e) { console.log('DB_FAIL: ' + (e.code || '') + ' ' + e.message); }
} else { console.log('DB_SKIP: no url'); }
let srvOk = false;
try { const res = await fetch('http://localhost:3000/api/learner/me'); srvOk = true; console.log('DEV_SERVER_UP http=' + res.status + ' (expect 401)'); }
catch (e) { console.log('DEV_SERVER_DOWN: ' + e.message); }
console.log('PREFLIGHT ' + (dbOk && srvOk ? 'PASS' : 'FAIL'));
process.exitCode = (dbOk && srvOk) ? 0 : 1;