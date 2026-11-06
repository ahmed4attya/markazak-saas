// bl-st-matrix.mjs - Track B-ST staff authz matrix v1 - LOCAL ONLY (jose HS256 + .env.local AUTH_SECRET + local users table).
// GET authz-shape probes + role-gate POST probes. No data mutations by design; 2xx on POST probes = REVIEW flag only.
import { SignJWT } from "jose";
import { readFileSync } from "fs";
import pg from "pg";
const BASE = "http://localhost:3000";
function envParse(t) { const o = {}; for (const l of t.split(/\r?\n/)) { const s = l.trim(); if (!s || s.startsWith("#")) continue; const i = s.indexOf("="); if (i < 1) continue; let v = s.slice(i + 1).trim(); const q = String.fromCharCode(34); if (v.length > 1 && v.startsWith(q) && v.endsWith(q)) v = v.slice(1, -1); o[s.slice(0, i).trim()] = v; } return o; }
const env = envParse(readFileSync(".env.local", "utf8"));
if (!env.AUTH_SECRET || !env.DATABASE_URL) { console.log("FATAL: AUTH_SECRET or DATABASE_URL missing"); process.exit(2); }
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
let users = [];
try { users = (await pool.query("select id, tenant_id, role, name, email from users order by role")).rows; } catch (e) { console.log("FATAL_DB: " + e.message); process.exit(2); }
await pool.end();
console.log("LOCAL_USERS=" + users.length);
const sessions = {};
for (const role of [...new Set(users.map(u => String(u.role)))]) {
const u = users.find(x => String(x.role) === role);
const token = await new SignJWT({ userId: u.id, tenantId: u.tenant_id, role: u.role, name: u.name, email: u.email }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("2h").sign(new TextEncoder().encode(env.AUTH_SECRET));
sessions[role] = "session=" + token;
}
console.log("SESSIONS=" + JSON.stringify(Object.keys(sessions)));
let hard = 0, warn = 0, review = 0, probes = 0;
const grp = { unauth: true, learner: true, teacher: true, admin: true };
function rec(id, label, got, expect, verdict, group) { probes++; if (verdict === "HARD_STOP") hard++; if (verdict === "WARN") warn++; if (group && grp[group] !== undefined && verdict !== "ok") grp[group] = false; console.log(id + " " + label + " -> " + got + " (expect " + expect + ") " + verdict); }
async function req(method, path, cookie) { const h = {}; if (cookie) h.cookie = cookie; try { const r = await fetch(BASE + path, { method: method, headers: h, redirect: "manual" }); return r.status; } catch (e) { return 0; } }
const ADMIN_ONLY = ["/api/audit", "/api/settings", "/api/dashboard", "/api/activation-codes", "/api/leads", "/api/quick-contact", "/api/stats", "/api/users"];
const STAFF_ANY = ["/api/students", "/api/teachers", "/api/courses", "/api/attendance", "/api/groups", "/api/classrooms", "/api/enrollments", "/api/exams", "/api/assignments", "/api/gradebook", "/api/questions", "/api/files", "/api/videos", "/api/notifications", "/api/invoices", "/api/reports", "/api/certificates", "/api/plans", "/api/course-teachers"];
const LEARNER_HARD = ["/api/audit", "/api/settings", "/api/dashboard", "/api/activation-codes", "/api/leads", "/api/quick-contact", "/api/stats", "/api/users", "/api/invoices", "/api/payments", "/api/students", "/api/teachers"];
const LEARNER_SOFT = ["/api/courses", "/api/attendance", "/api/groups", "/api/classrooms", "/api/enrollments", "/api/exams", "/api/assignments", "/api/gradebook", "/api/questions", "/api/files", "/api/videos", "/api/notifications", "/api/reports", "/api/certificates", "/api/plans", "/api/course-teachers"];
const PARAM_OK = ["/api/gradebook"];
const TEACHER_DENY = ["/api/audit", "/api/settings", "/api/dashboard", "/api/activation-codes", "/api/leads", "/api/quick-contact", "/api/stats", "/api/users", "/api/reports"];
const TEACHER_ALLOW = ["/api/courses", "/api/exams", "/api/assignments", "/api/files", "/api/videos", "/api/notifications"];
const TEACHER_DUAL = ["/api/students", "/api/teachers", "/api/attendance", "/api/invoices", "/api/groups", "/api/classrooms", "/api/enrollments", "/api/gradebook", "/api/questions", "/api/plans", "/api/certificates", "/api/course-teachers"];
const hz = await req("GET", "/api/health", null); rec("ST0", "public GET /api/health (canary)", hz, "200", hz === 200 ? "ok" : "HARD_STOP", null);
for (const role of Object.keys(sessions)) { const got = await req("GET", "/api/me", sessions[role]); rec("ST0", role + " GET /api/me (canary)", got, "200", got === 200 ? "ok" : "HARD_STOP", null); }
for (const p of [...ADMIN_ONLY, ...STAFF_ANY]) { const got = await req("GET", p, null); let v; if (got === 401) v = "ok"; else if (got === 0 || got >= 500 || (got >= 200 && got < 300)) v = "HARD_STOP"; else v = "WARN"; rec("ST1", "unauth GET " + p, got, "401", v, "unauth"); }
for (const p of ["/api/students", "/api/invoices", "/api/payments", "/api/activation-codes", "/api/users"]) { const got = await req("POST", p, null); let v; if (got === 401) v = "ok"; else if (got === 0 || got >= 500 || (got >= 200 && got < 300)) v = "HARD_STOP"; else v = "WARN"; rec("ST2", "unauth POST " + p, got, "401", v, "unauth"); }
for (const role of ["student", "guardian"]) {
if (!sessions[role]) { console.log("NO_SESSION " + role); continue; }
for (const p of [...LEARNER_HARD, ...LEARNER_SOFT]) {
const got = await req("GET", p, sessions[role]); let v;
if (got === 0 || got >= 500) v = "HARD_STOP";
else if (got === 401 || got === 403 || got === 404 || got === 405) v = "ok";
else if (got >= 200 && got < 300) v = LEARNER_HARD.includes(p) ? "HARD_STOP" : "WARN";
else v = "WARN";
rec("ST3", role + " GET " + p, got, "403", v, "learner");
if (v !== "ok" && got >= 200 && got < 300) { review++; console.log("REVIEW: " + role + " read " + p + " - confirm intended"); }
}
}
const tS = sessions["teacher"];
if (!tS) { console.log("NO_SESSION teacher"); grp.teacher = false; }
if (tS) {
for (const p of TEACHER_DENY) { const got = await req("GET", p, tS); let v; if (got === 0 || got >= 500) v = "HARD_STOP"; else if (got === 403) v = "ok"; else if (got >= 200 && got < 300) v = "HARD_STOP"; else v = "WARN"; rec("ST4", "teacher GET " + p, got, "403", v, "teacher"); }
for (const p of TEACHER_ALLOW) { const got = await req("GET", p, tS); let v; if (got === 0 || got >= 500) v = "HARD_STOP"; else if (got === 200) v = "ok"; else v = "WARN"; rec("ST5", "teacher GET " + p, got, "200", v, "teacher"); }
for (const p of TEACHER_DUAL) { const got = await req("GET", p, tS); let v; if (got === 0 || got >= 500) v = "HARD_STOP"; else if (got === 200 || got === 403 || got === 404 || got === 405) v = "ok"; else if (got === 400 && PARAM_OK.includes(p)) v = "ok"; else v = "WARN"; rec("ST6", "teacher GET " + p, got, "200|403", v, "teacher"); if (got >= 200 && got < 300 && p === "/api/invoices") { review++; console.log("REVIEW: teacher reads tenant invoices - confirm intended"); } }
for (const p of ["/api/invoices", "/api/payments", "/api/activation-codes", "/api/users"]) { const got = await req("POST", p, tS); let v; if (got === 0 || got >= 500) v = "HARD_STOP"; else if (got === 403) v = "ok"; else if (got >= 200 && got < 300) v = "HARD_STOP"; else v = "WARN"; rec("ST7", "teacher POST " + p + " (empty body)", got, "403", v, "teacher"); }
for (const p of ["/api/students", "/api/teachers", "/api/courses", "/api/attendance"]) { const got = await req("POST", p, tS); let v; if (got === 0 || got >= 500) v = "HARD_STOP"; else if (got === 400 || got === 401 || got === 403 || got === 404 || got === 405 || got === 422) v = "ok"; else v = "WARN"; rec("ST8", "teacher POST " + p + " (empty body)", got, "400|403", v, "teacher"); if (got >= 200 && got < 300) { review++; console.log("REVIEW: teacher created resource via " + p + " - check teacherMutationBlocked list"); } }
}
const ADMIN_ROLES = Object.keys(sessions).filter(r => r === "owner" || r === "admin" || r === "manager" || r === "staff" || r === "accountant");
if (ADMIN_ROLES.length === 0) { console.log("NO_ADMIN_SESSION"); grp.admin = false; }
for (const role of ADMIN_ROLES) {
for (const p of [...ADMIN_ONLY, ...STAFF_ANY]) {
const got = await req("GET", p, sessions[role]); let v;
if (got === 0 || got >= 500) v = "HARD_STOP";
else if (got === 200) v = "ok"; else if (got === 400 && PARAM_OK.includes(p)) v = "ok";
else v = "WARN";
rec("ST9", role + " GET " + p, got, "200", v, "admin");
if (v !== "ok") { review++; console.log("REVIEW: " + role + " got " + got + " on " + p); }
}
}
console.log("---");
console.log("ST_SUMMARY probes=" + probes + " hard_stop=" + hard + " warn=" + warn + " review=" + review + " sessions=" + Object.keys(sessions).length);
console.log("FLIP unauth401=" + grp.unauth + " learner403=" + grp.learner + " teacher=" + grp.teacher + " admin200=" + grp.admin);
if (hard === 0 && warn === 0) { console.log("ST_VERDICT: PASS-FAILCLOSED"); process.exit(0); }
if (hard === 0) { console.log("ST_VERDICT: PASS-WITH-WARN"); process.exit(1); }
console.log("ST_VERDICT: FAIL-CLOSED-REQUIRED"); process.exit(1);
