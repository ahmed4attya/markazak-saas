// bl-diag.mjs — C2-r3 — تشخيص تحذيرات BL الأربعة. قراءة فقط. لا يطبع أسرارًا ولا توكنات.
import fs from 'fs';
import pgDefault from 'pg';
import { SignJWT } from 'jose';
const { Pool } = pgDefault;

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']/, '').replace(/["']$/, '');
  }
  return out;
}
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const dbUrl = env.DATABASE_URL || env.POSTGRES_URL || '';
let du;
try { du = new URL(dbUrl); } catch (_) { console.log('DIAG_NO_DB_URL'); process.exit(4); }
if (!['127.0.0.1','localhost','::1'].includes(du.hostname)) { console.log('DIAG_DB_ABORT_NOT_LOCAL'); process.exit(3); }

async function main() {
  const pool = new Pool({ connectionString: dbUrl, max: 1, connectionTimeoutMillis: 10000 });
  try {
    const t = await pool.query("select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1");
    const tables = t.rows.map(r => r.table_name);
    console.log('TABLES=' + tables.join(','));
    for (const tb of tables) {
      try { const c = await pool.query(`select count(*)::int as n from "${tb}"`); console.log(`COUNT ${tb} = ${c.rows[0].n}`); }
      catch (_) { console.log(`COUNT ${tb} = ERR`); }
    }
    const keep = tables.filter(x => /exam|assign|attend|attempt|guardian|student|course|enroll|question/i.test(x));
    for (const tb of keep) {
      try {
        const c = await pool.query("select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position", [tb]);
        console.log(`COLS ${tb}: ` + c.rows.map(r => r.column_name + ':' + r.data_type).join(', '));
      } catch (_) {}
    }
    for (const tb of keep) {
      try {
        const c = await pool.query("select column_name from information_schema.columns where table_schema='public' and table_name=$1", [tb]);
        const names = c.rows.map(r => r.column_name);
        if (names.includes('guardian_id') || names.includes('guardianId')) {
          const rows = await pool.query(`select * from "${tb}" limit 8`);
          console.log(`GUARDIAN_LINK ${tb}: ` + JSON.stringify(rows.rows).slice(0, 900));
        }
      } catch (_) {}
    }
    const u = await pool.query("select left(id::text,8) as id8, role, tenant_id is not null as has_tenant from users order by role");
    console.log('USERS=' + JSON.stringify(u.rows));
  } finally { await pool.end(); }

  const BASE = process.env.BL_BASE || 'http://127.0.0.1:3000';
  const bh = new URL(BASE).hostname;
  if (!['127.0.0.1','localhost','::1'].includes(bh)) { console.log('DIAG_BASE_ABORT_NOT_LOCAL'); return; }
  const secret = env.AUTH_SECRET || '';
  if (secret.length < 32) { console.log('DIAG_NO_SECRET — skip HTTP part'); return; }
  let serverUp = false;
  try { const h = await fetch(BASE + '/api/health'); serverUp = h.status < 500; } catch (_) {}
  if (!serverUp) { console.log('DIAG_SERVER_DOWN — shghghl npm run dev then rerun'); return; }

  const pool2 = new Pool({ connectionString: dbUrl, max: 1, connectionTimeoutMillis: 10000 });
  let users;
  try { users = (await pool2.query('select id as "userId", tenant_id as "tenantId", role, name, email from users order by role')).rows; }
  finally { await pool2.end(); }
  const key = new TextEncoder().encode(secret);
  const sessions = {};
  for (const role of ['student','guardian']) {
    const u2 = users.find(x => x.role === role);
    if (!u2) continue;
    const token = await new SignJWT({ userId: u2.userId, tenantId: u2.tenantId, role: u2.role, name: u2.name, email: u2.email })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(key);
    sessions[role] = 'session=' + token;
  }
  async function raw(method, p, cookie, body) {
    const headers = {};
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (cookie) headers['cookie'] = cookie;
    const res = await fetch(BASE + p, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: 'manual' });
    const txt = await res.text();
    return { status: res.status, body: txt.replace(/\s+/g, ' ').slice(0, 600) };
  }
  const FU = '00000000-0000-0000-0000-000000000000';
  const probes = [
    ['W1 student GET /api/learner/attendance', 'GET', '/api/learner/attendance', sessions.student, undefined],
    ['W2 guardian GET /api/learner/exams', 'GET', '/api/learner/exams', sessions.guardian, undefined],
    ['W3 guardian GET /api/learner/assignments', 'GET', '/api/learner/assignments', sessions.guardian, undefined],
    ['W4 student POST /api/learner/attempts/submit (foreign)', 'POST', '/api/learner/attempts/submit', sessions.student, { attemptId: FU, c: {} }],
  ];
  for (const [label, method, p, cookie, body] of probes) {
    if (!cookie) { console.log(label + ' -> SKIP (no session)'); continue; }
    try { const r = await raw(method, p, cookie, body); console.log(`${label} -> ${r.status} BODY: ${r.body}`); }
    catch (_) { console.log(label + ' -> FETCH_ERR'); }
  }
}
main().catch(() => { console.log('DIAG_FAIL'); process.exit(5); });
