// bl-st-own.mjs - Track B-L2 ownership/unknown-id probes v1 - LOCAL ONLY (jose HS256 + .env.local + local pg).
// NO real-id mutations by design: every PATCH/DELETE/POST probe uses a FAKE uuid absent from DB (collision-checked at startup).
// 5xx on read probes = HARD_STOP; 5xx on fake-id mutating probes = WARN (robustness smell, no data harmed).
import { SignJWT } from "jose";
import { readFileSync } from "fs";
import pg from "pg";
const BASE = "http://localhost:3000";
function envParse(t) { const o = {}; for (const l of t.split(/\r?\n/)) { const s = l.trim(); if (!s || s.startsWith("#")) continue; const i = s.indexOf("="); if (i < 1) continue; let v = s.slice(i + 1).trim(); const qq = String.fromCharCode(34); if (v.length > 1 && v.startsWith(qq) && v.endsWith(qq)) v = v.slice(1, -1); o[s.slice(0, i).trim()] = v; } return o; }
const env = envParse(readFileSync(".env.local", "utf8"));
if (!env.AUTH_SECRET || !env.DATABASE_URL) { console.log("FATAL: AUTH_SECRET or DATABASE_URL missing"); process.exit(2); }
const dbHost = new URL(env.DATABASE_URL).hostname;
if (dbHost !== "localhost" && dbHost !== "127.0.0.1") { console.log("FATAL_NOT_LOCAL: " + dbHost); process.exit(2); }
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const q = async (sql, p) => (await pool.query(sql, p || [])).rows;
let users = [];
try { users = await q("select id, tenant_id, role, name, email from users order by role"); } catch (e) { console.log("FATAL_DB: " + e.message); process.exit(2); }
console.log("LOCAL_USERS=" + users.length);
const sessions = {};
for (const role of [...new Set(users.map(u => String(u.role)))]) {
const u = users.find(x => String(x.role) === role);
const token = await new SignJWT({ userId: u.id, tenantId: u.tenant_id, role: u.role, name: u.name, email: u.email }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("2h").sign(new TextEncoder().encode(env.AUTH_SECRET));
sessions[role] = "session=" + token;
}
console.log("SESSIONS=" + JSON.stringify(Object.keys(sessions)));
const FAKE = "f0000000-0000-4000-8000-00000000e1a5";
const abs = await q("select (select count(*) from exams where id=$1) + (select count(*) from assignments where id=$1) + (select count(*) from files where id=$1) + (select count(*) from videos where id=$1) as n", [FAKE]);
if (Number(abs[0].n) !== 0) { console.log("FATAL_FAKE_COLLISION"); process.exit(2); }
let hard = 0, warn = 0, review = 0, probes = 0;
const grp = { unauth: true, studentGate: true, teacherOwn: true, adminOwn: true };
function rec(id, label, got, expect, verdict, group) { probes++; if (verdict === "HARD_STOP") hard++; if (verdict === "WARN") warn++; if (group && grp[group] !== undefined && verdict !== "ok") grp[group] = false; console.log(id + " " + label + " -> " + got + " (expect " + expect + ") " + verdict); }
function rvw(msg) { review++; console.log("REVIEW: " + msg); }
async function req(method, path, cookie) { const h = {}; if (cookie) h.cookie = cookie; try { const r = await fetch(BASE + path, { method: method, headers: h, redirect: "manual" }); return r.status; } catch (e) { return 0; } }
const hz = await req("GET", "/api/health", null); rec("OW0", "public GET /api/health (canary)", hz, "200", hz === 200 ? "ok" : "HARD_STOP", null);
for (const role of ["teacher", "admin", "manager", "student"]) { if (sessions[role]) { const g = await req("GET", "/api/me", sessions[role]); rec("OW0", role + " GET /api/me (canary)", g, "200", g === 200 ? "ok" : "HARD_STOP", null); } }
const GET_FAKE = ["/api/exams/", "/api/assignments/", "/api/files/", "/api/videos/"];
const GET_FAKE_SUFFIX = { "/api/files/": "/download", "/api/videos/": "/stream" };
const PATCH_PREFIX = ["/api/activation-codes/", "/api/attendance/", "/api/courses/", "/api/enrollments/", "/api/groups/", "/api/students/", "/api/teachers/"];
const DEL_EXTRA = ["/api/assignments/", "/api/exams/", "/api/files/", "/api/videos/"];
function fakeGet(p) { return p + FAKE + (GET_FAKE_SUFFIX[p] || ""); }
async function probeFake(id, role, method, p, cookie, group) {
const got = await req(method, p, cookie); let v;
if (got === 0) v = "HARD_STOP";
else if (got >= 500) v = (method === "GET") ? "HARD_STOP" : "WARN";
else if (got === 401 || got === 403 || got === 404 || got === 400 || got === 405 || got === 422) v = "ok";
else if (got >= 200 && got < 300) { v = "WARN"; rvw(method + " " + role + " fake-id 2xx on " + p + " — route acted on nonexistent id"); }
else v = "WARN";
rec(id, role + " " + method + " " + p, got, "4xx", v, group);
}
for (const p of GET_FAKE) { await probeFake("OW1", "unauth", "GET", fakeGet(p), null, "unauth"); }
for (const pre of PATCH_PREFIX) { await probeFake("OW2", "unauth", "PATCH", pre + FAKE, null, "unauth"); }
for (const pre of [...PATCH_PREFIX, ...DEL_EXTRA]) { await probeFake("OW2", "unauth", "DELETE", pre + FAKE, null, "unauth"); }
for (const p of ["/api/assignments/" + FAKE + "/grade", "/api/exams/" + FAKE + "/copy"]) { await probeFake("OW2", "unauth", "POST", p, null, "unauth"); }
for (const p of GET_FAKE) { await probeFake("OW3", "student", "GET", fakeGet(p), sessions["student"], "studentGate"); }
for (const p of GET_FAKE) { await probeFake("OW4", "teacher", "GET", fakeGet(p), sessions["teacher"], "teacherOwn"); }
for (const pre of PATCH_PREFIX) { await probeFake("OW5", "teacher", "PATCH", pre + FAKE, sessions["teacher"], "teacherOwn"); }
for (const pre of [...PATCH_PREFIX, ...DEL_EXTRA]) { await probeFake("OW5", "teacher", "DELETE", pre + FAKE, sessions["teacher"], "teacherOwn"); }
for (const p of ["/api/assignments/" + FAKE + "/grade", "/api/exams/" + FAKE + "/copy"]) { await probeFake("OW5", "teacher", "POST", p, sessions["teacher"], "teacherOwn"); }
for (const p of GET_FAKE) { await probeFake("OW6", "admin", "GET", fakeGet(p), sessions["admin"], "adminOwn"); }
for (const pre of PATCH_PREFIX) { await probeFake("OW7", "admin", "PATCH", pre + FAKE, sessions["admin"], "adminOwn"); }
for (const pre of [...PATCH_PREFIX, ...DEL_EXTRA]) { await probeFake("OW7", "admin", "DELETE", pre + FAKE, sessions["admin"], "adminOwn"); }
for (const p of ["/api/assignments/" + FAKE + "/grade", "/api/exams/" + FAKE + "/copy"]) { await probeFake("OW7", "admin", "POST", p, sessions["admin"], "adminOwn"); }
if (sessions["manager"]) {
for (const p of GET_FAKE) { await probeFake("OW6", "manager", "GET", fakeGet(p), sessions["manager"], "adminOwn"); }
for (const pre of [...PATCH_PREFIX, ...DEL_EXTRA]) { await probeFake("OW7", "manager", "DELETE", pre + FAKE, sessions["manager"], "adminOwn"); }
}
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const tS = sessions["teacher"];
let taught = new Set();
if (tS) {
const cr = await fetch(BASE + "/api/courses", { headers: { cookie: tS } });
const ct = await cr.text();
const allCourses = await q("select id from courses");
const courseIds = new Set(allCourses.map(r => String(r.id).toLowerCase()));
for (const m of (ct.match(UUID_RE) || []).map(s => s.toLowerCase())) if (courseIds.has(m)) taught.add(m);
console.log("TAUGHT_SET=" + taught.size + "/" + courseIds.size);
if (courseIds.size > 0 && taught.size === courseIds.size) rvw("teacher GET /api/courses returned every course in tenant - confirm intended scope (list may be intentionally wide)");
}
async function ownProbe(idPrefix, table, routeFn, capT, capF, group) {
if (!tS) { console.log("NO_SESSION teacher - skip " + idPrefix); return; }
const rows = await q("select id, course_id from " + table + " where course_id is not null limit 200").catch((e) => { console.log("DB_ERR " + table + ": " + e.message); return []; });
if (rows.length === 0) { console.log("NO_DATA " + table + " - skip " + idPrefix); return; }
const tRows = rows.filter(r => taught.has(String(r.course_id).toLowerCase())).slice(0, capT);
const fRows = rows.filter(r => !taught.has(String(r.course_id).toLowerCase())).slice(0, capF);
if (tRows.length === 0) console.log("NOTE " + table + ": no taught-side rows to probe");
if (fRows.length === 0) console.log("NOTE " + table + ": no foreign-side rows to probe");
for (const r of tRows) {
const p = routeFn(r.id); const got = await req("GET", p, tS); let v;
if (got === 0 || got >= 500) v = "HARD_STOP";
else if (got === 200 || got === 404) v = "ok";
else if (got === 403) { v = "WARN"; rvw("teacher denied OWN-side " + p + " - check canAccessCourse semantics"); }
else v = "WARN";
rec(idPrefix, "teacher GET own " + p, got, "200|404", v, group);
}
for (const r of fRows) {
const p = routeFn(r.id); const got = await req("GET", p, tS); let v;
if (got === 0 || got >= 500) v = "HARD_STOP";
else if (got === 200) { v = "HARD_STOP"; rvw("FOREIGN READ teacher " + p); }
else if (got === 403 || got === 404) v = "ok";
else v = "WARN";
rec(idPrefix, "teacher GET foreign " + p, got, "403|404", v, group);
}
}
await ownProbe("OW8e", "exams", (id) => "/api/exams/" + id, 6, 6, "teacherOwn");
await ownProbe("OW8a", "assignments", (id) => "/api/assignments/" + id, 6, 6, "teacherOwn");
await ownProbe("OW8f", "files", (id) => "/api/files/" + id + "/download", 3, 3, "teacherOwn");
const aS = sessions["admin"];
if (aS) {
const ex2 = await q("select id from exams limit 2").catch((e) => { console.log("DB_ERR exams-control: " + e.message); return []; });
for (const r of ex2) { const p = "/api/exams/" + r.id; const got = await req("GET", p, aS); let v; if (got === 0 || got >= 500) v = "HARD_STOP"; else if (got === 200) v = "ok"; else { v = "WARN"; rvw("admin got " + got + " on " + p); } rec("OW9", "admin GET real " + p, got, "200", v, "adminOwn"); }
}
await pool.end();
console.log("---");
console.log("OW_SUMMARY probes=" + probes + " hard_stop=" + hard + " warn=" + warn + " review=" + review + " sessions=" + Object.keys(sessions).length);
console.log("FLIP unauth=" + grp.unauth + " studentGate=" + grp.studentGate + " teacherOwn=" + grp.teacherOwn + " adminOwn=" + grp.adminOwn);
if (hard === 0 && warn === 0) { console.log("OW_VERDICT: PASS-FAILCLOSED"); process.exit(0); }
if (hard === 0) { console.log("OW_VERDICT: PASS-WITH-WARN"); process.exit(1); }
console.log("OW_VERDICT: FAIL-CLOSED-REQUIRED"); process.exit(1);
