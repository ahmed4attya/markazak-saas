// bl-matrix2.mjs — Track B-L live matrix v2 — LOCAL ONLY. Sessions minted locally
// (jose HS256 + .env.local AUTH_SECRET + local users table) — equivalent to login;
// authN path itself is covered by frozen m1 tests. Never prints secrets/tokens.
import fs from 'fs';
import pgDefault from 'pg';
import { SignJWT } from 'jose';
const { Pool } = pgDefault;

const BASE = process.env.BL_BASE || 'http://127.0.0.1:3000';
const bh = new URL(BASE).hostname;
if (!['127.0.0.1','localhost','::1'].includes(bh)) { console.log('BL_ABORT_NOT_LOCAL'); process.exit(3); }

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
const secret = env.AUTH_SECRET || '';
const dbUrl = env.DATABASE_URL || env.POSTGRES_URL || '';
if (secret.length < 32) { console.log('BL_NO_LOCAL_SECRET (تحقق من .env.local)'); process.exit(4); }
let du; try { du = new URL(dbUrl); } catch (_) { console.log('BL_NO_LOCAL_DB_URL (قل لي أي ملف يحمل DATABASE_URL المحلي)'); process.exit(4); }
if (!['127.0.0.1','localhost','::1'].includes(du.hostname)) { console.log('BL_DB_ABORT_NOT_LOCAL host=hidden'); process.exit(3); }

let hardStop = 0, warns = 0; const results = [];
function rec(id, label, status, expect, verdict) {
  results.push(1); console.log(`${id} ${label} -> ${status} (expect ${expect}) ${verdict}`);
  if (verdict === 'HARD_STOP') hardStop++;
  if (verdict.startsWith('WARN')) warns++;
}
async function req(method, p, opt = {}) {
  const headers = {};
  if (opt.body !== undefined) headers['content-type'] = 'application/json';
  if (opt.cookie) headers['cookie'] = opt.cookie;
  const res = await fetch(BASE + p, { method, headers, body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined, redirect: 'manual' });
  let json = null; try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}
function vDenied(s) { if (s >= 200 && s < 300) return 'HARD_STOP'; if ([401,403,404,405,307].includes(s)) return 'ok'; return 'WARN'; }
function vOk(s) { if (s >= 200 && s < 300) return 'OK'; if (s === 403) return 'BL_BROKEN'; return 'WARN'; }

(async () => {
  try { await req('GET', '/api/health'); } catch (_) { console.log('BL_SERVER_DOWN — شغّل npm run dev ثم أعد البلوك'); process.exit(9); }
  const pool = new Pool({ connectionString: dbUrl, max: 1, connectionTimeoutMillis: 10000 });
  let users;
  try { users = (await pool.query('select id as "userId", tenant_id as "tenantId", role, name, email from users order by role')).rows; }
  finally { await pool.end(); }
  console.log('LOCAL_USERS=' + users.length);
  const key = new TextEncoder().encode(secret);
  const sessions = {};
  for (const role of ['student','guardian','teacher','admin']) {
    const u = users.find(x => x.role === role);
    if (!u) { console.log('NO_LOCAL_USER role=' + role); continue; }
    const token = await new SignJWT({ userId: u.userId, tenantId: u.tenantId, role: u.role, name: u.name, email: u.email })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(key);
    sessions[role] = 'session=' + token;
  }
  console.log('SESSIONS=' + JSON.stringify(Object.keys(sessions)));
  if (!sessions.student) { console.log('BL_NO_STUDENT_USER_LOCAL'); process.exit(7); }

  const LEARNER = ['me','courses','exams','assignments','attempts','attendance','files','videos','mistakes','notifications','progress','training','ai-explain','redeem'];
  for (const r of LEARNER) { const x = await req('GET','/api/learner/'+r); rec('BL1','unauth GET /api/learner/'+r,x.status,'401',vDenied(x.status)); }
  for (const r of ['redeem','attempts','attempts/submit','assignments','mistakes','training','ai-explain','notifications']) { const x = await req('POST','/api/learner/'+r,{ body:{} }); rec('BL2','unauth POST /api/learner/'+r,x.status,'401',vDenied(x.status)); }

  const st = { cookie: sessions.student };
  for (const r of ['me','courses','exams','assignments','attempts','attendance','files','videos','mistakes','notifications','progress','training']) { const x = await req('GET','/api/learner/'+r,st); rec('BL3','student GET /api/learner/'+r,x.status,'200',vOk(x.status)); }

  if (sessions.guardian) {
    const gu = { cookie: sessions.guardian };
    for (const r of ['me','courses','exams','assignments','attempts','attendance','files','videos','mistakes','progress']) { const x = await req('GET','/api/learner/'+r,gu); rec('BL4','guardian GET /api/learner/'+r,x.status,'200',vOk(x.status)); }
  } else console.log('BL4 skipped: no local guardian user');

  if (sessions.teacher) {
    const t = { cookie: sessions.teacher };
    const x1 = await req('GET','/api/learner/me',t);
    rec('BL5','teacher GET learner/me (fallthrough موثق)',x1.status,'200-self',x1.status===200?'KNOWN':'WARN');
    const x2 = await req('POST','/api/learner/redeem',{ ...t, body:{} });
    rec('BL6','teacher POST learner/redeem',x2.status,'403',x2.status===403?'ok':(x2.status<300?'HARD_STOP':'WARN'));
  } else console.log('BL5/6 skipped: no local teacher user');

  for (const p of ['/api/students','/api/users','/api/invoices','/api/audit','/api/settings']) { const x = await req('GET',p,st); rec('BL7','student GET '+p,x.status,'401/403/404',vDenied(x.status)); }

  const FU = '00000000-0000-0000-0000-000000000000';
  const s1 = await req('POST','/api/learner/attempts/submit',{ ...st, body:{ attemptId: FU, answers:{ order:[], c:{} } } });
  rec('BL8','student POST attempts/submit foreign-attempt',s1.status,'404',s1.status===404?'ok':(s1.status<300?'HARD_STOP':'WARN'));
  const s2 = await req('POST','/api/learner/mistakes',{ ...st, body:{ questionId: FU } });
  rec('BL9','student POST mistakes foreign-question',s2.status,'404/400',[404,400].includes(s2.status)?'ok':(s2.status<300?'HARD_STOP':'WARN'));
  const s3 = await req('GET','/api/learner/files?courseId='+FU,st);
  rec('BL10','student GET files?courseId=foreign',s3.status,'200-empty',s3.status===200?(Array.isArray(s3.json)&&s3.json.length===0?'ok':'WARN-ROWS'):'WARN');

  console.log('---');
  console.log(`BL_SUMMARY probes=${results.length} hard_stop=${hardStop} warn=${warns} sessions=${Object.keys(sessions).length}`);
  if (hardStop > 0) { console.log('BL_VERDICT: HARD-STOP — قف فورًا'); process.exit(1); }
  console.log('BL_VERDICT: PASS-FAILCLOSED');
})().catch(() => { console.log('BL_FAIL'); process.exit(5); });
