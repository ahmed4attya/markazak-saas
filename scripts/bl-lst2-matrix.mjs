// bl-lst2-matrix.mjs - Track B-LST v2 - LOCAL ONLY. Superset of v1: staff data routes + learner surface + open routes, uuid-scan cross-tenant.
// Hard: T2 uuids in any authenticated response; seeded ids in unauth responses; 0/5xx.
// Review: learner hitting staff-gated routes with 2xx; learner lists containing not-enrolled seeded ids.
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
const teacherUser = users.find(u => String(u.role) === "teacher");
const E_OWN = "5eed0000-0000-4000-8000-00000000e0a1";
const A_OWN = "5eed0000-0000-4000-8000-00000000a0a1";
const T2_IDS = ["5eed0000-0000-4000-8000-00000000c0c3", "5eed0000-0000-4000-8000-00000000e0c3", "5eed0000-0000-4000-8000-00000000a0c3"];
const LEARNER_FORBID = [E_OWN, A_OWN, "5eed0000-0000-4000-8000-00000000e0b2", "5eed0000-0000-4000-8000-00000000a0b2"];
const LEARNER_COURSE_FORBID = ["5eed0000-0000-4000-8000-00000000c0a1", "5eed0000-0000-4000-8000-00000000c0b2"];
const SEED_ALL = LEARNER_COURSE_FORBID.concat(LEARNER_FORBID);
const V1_LISTS = ["/api/courses", "/api/exams", "/api/assignments", "/api/files", "/api/videos", "/api/groups", "/api/students", "/api/teachers", "/api/enrollments", "/api/attendance", "/api/activation-codes"];
const GATED = ["/api/questions", "/api/course-teachers", "/api/certificates", "/api/classrooms", "/api/invoices", "/api/payments", "/api/users", "/api/audit", "/api/dashboard", "/api/reports", "/api/stats", "/api/settings", "/api/leads"];
const OPEN_OK = ["/api/plans", "/api/notifications", "/api/certificates/verify"];
const LEARNER = ["/api/learner/courses", "/api/learner/exams", "/api/learner/assignments", "/api/learner/files", "/api/learner/videos", "/api/learner/attendance", "/api/learner/me", "/api/learner/notifications", "/api/learner/progress", "/api/learner/mistakes", "/api/learner/training", "/api/learner/attempts"];
let hard = 0, warn = 0, review = 0, probes = 0;
const grp = { unauth: true, adminCtrl: true };
function rec(id, label, verdict, group) { probes++; if (verdict === "HARD_STOP") hard++; else if (verdict === "WARN") warn++; else if (verdict === "REVIEW") review++; if (group && grp[group] !== undefined && verdict !== "ok") grp[group] = false; console.log(id + " " + label + " " + verdict); }
function rvw(msg) { review++; console.log("REVIEW: " + msg); }
async function getTxt(path, cookie) { const h = {}; if (cookie) h.cookie = cookie; try { const r = await fetch(BASE + path, { headers: h, redirect: "manual" }); const t = await r.text(); return { s: r.status, t: t }; } catch (e) { return { s: 0, t: "" }; } }
function hasAny(text, ids) { const low = String(text).toLowerCase(); return ids.some((x) => low.includes(x)); }
const hz = await getTxt("/api/health", null); rec("LM0", "GET /api/health (canary) -> " + hz.s, hz.s === 200 ? "ok" : "HARD_STOP", null);
for (const role of ["student", "guardian", "teacher", "admin", "manager"]) { const g = await getTxt("/api/me", sessions[role]); rec("LM0", role + " GET /api/me (canary) -> " + g.s, g.s === 200 ? "ok" : "HARD_STOP", null); }
async function scan(idp, role, routes, cat) {
const ck = role === "unauth" ? null : sessions[role];
if (role !== "unauth" && !ck) { console.log("NO_SESSION " + role + " - skip " + idp); return; }
const learner = (role === "student" || role === "guardian");
for (const p of routes) {
const g = await getTxt(p, ck); let v = "ok"; let tag = "";
if (g.s === 0 || g.s >= 500) v = "HARD_STOP";
else if (g.s === 400 || g.s === 401 || g.s === 403 || g.s === 404 || g.s === 405 || g.s === 422) v = "ok";
else if (g.s >= 200 && g.s < 300) {
if (hasAny(g.t, T2_IDS)) { v = "HARD_STOP"; tag = "TENANT-LEAK"; }
else if (role === "unauth" && hasAny(g.t, SEED_ALL)) { v = "HARD_STOP"; tag = "UNAUTH-LEAK"; }
else if (cat === "gated" && learner) { v = "REVIEW"; tag = "learner-on-staff-route"; }
else if (cat === "v1" && learner && (p === "/api/exams" || p === "/api/assignments") && hasAny(g.t, LEARNER_FORBID)) { v = "REVIEW"; tag = "learner-scope"; }
else if (cat === "learner" && learner && p === "/api/learner/courses" && hasAny(g.t, LEARNER_COURSE_FORBID)) { v = "REVIEW"; tag = "learner-course-scope"; }
else if (cat === "learner" && learner && (p === "/api/learner/exams" || p === "/api/learner/assignments") && hasAny(g.t, LEARNER_FORBID)) { v = "REVIEW"; tag = "learner-scope"; }
else v = "ok";
} else v = "WARN";
if (tag) rvw(tag + " " + role + " " + p);
rec(idp, role + " GET " + p + " -> " + g.s + (tag ? " [" + tag + "]" : ""), v, role === "unauth" ? "unauth" : null);
}
}
await scan("LM1", "unauth", V1_LISTS, "v1");
await scan("LM1", "unauth", GATED, "gated");
await scan("LM1", "unauth", OPEN_OK, "open");
await scan("LM1", "unauth", LEARNER, "learner");
await scan("LM2", "student", V1_LISTS, "v1");
await scan("LM2", "student", GATED, "gated");
await scan("LM2", "student", OPEN_OK, "open");
await scan("LM2", "student", LEARNER, "learner");
await scan("LM2", "guardian", V1_LISTS, "v1");
await scan("LM2", "guardian", GATED, "gated");
await scan("LM2", "guardian", OPEN_OK, "open");
await scan("LM2", "guardian", LEARNER, "learner");
await scan("LM4", "teacher", V1_LISTS, "v1");
await scan("LM4", "teacher", GATED, "gated");
await scan("LM4", "teacher", OPEN_OK, "open");
await scan("LM5", "admin", V1_LISTS, "v1");
await scan("LM5", "admin", GATED, "gated");
await scan("LM5", "admin", OPEN_OK, "open");
await scan("LM5", "manager", V1_LISTS, "v1");
await scan("LM5", "manager", GATED, "gated");
await scan("LM5", "manager", OPEN_OK, "open");
const ax = await getTxt("/api/exams", sessions["admin"]);
if (ax.s === 200) { const okc = ax.t.toLowerCase().includes(E_OWN); if (!okc) rvw("admin /api/exams missing seeded own-tenant exam (control - pagination?"); rec("LM5", "control admin /api/exams contains e0a1 -> " + ax.s, okc ? "ok" : "REVIEW", "adminCtrl"); } else { rec("LM5", "control admin /api/exams skipped (status " + ax.s + ")", "ok", "adminCtrl"); }
if (teacherUser) { const au = await getTxt("/api/users", sessions["admin"]); if (au.s === 200) { const oku = au.t.toLowerCase().includes(String(teacherUser.id).toLowerCase()); if (!oku) rvw("admin /api/users missing teacher user id (control)"); rec("LM5", "control admin /api/users contains teacher id -> " + au.s, oku ? "ok" : "REVIEW", "adminCtrl"); } else { rec("LM5", "control admin /api/users skipped (status " + au.s + ")", "ok", "adminCtrl"); } }
const REAL = [["/api/exams/", E_OWN], ["/api/assignments/", A_OWN], ["/api/exams/", "5eed0000-0000-4000-8000-00000000e0b2"], ["/api/assignments/", "5eed0000-0000-4000-8000-00000000a0b2"], ["/api/exams/", T2_IDS[1]], ["/api/assignments/", T2_IDS[2]]];
for (const role of ["student", "guardian"]) { const ck = sessions[role]; if (!ck) continue;
for (const pair of REAL) { const pre = pair[0]; const id = pair[1];
const g = await getTxt(pre + id, ck); let v; let tag = "";
if (g.s === 0 || g.s >= 500) v = "HARD_STOP";
else if (g.s === 400 || g.s === 401 || g.s === 403 || g.s === 404 || g.s === 405 || g.s === 422) v = "ok";
else if (g.s >= 200 && g.s < 300) { if (T2_IDS.includes(id)) { v = "HARD_STOP"; tag = "TENANT-LEAK"; } else { v = "REVIEW"; tag = "learner-not-enrolled-read"; } }
else v = "WARN";
if (tag) rvw(tag + " " + role + " " + pre + id);
rec("LM6", role + " GET " + pre + id + " -> " + g.s + (tag ? " [" + tag + "]" : ""), v, null);
}
}
await pool.end();
console.log("---");
console.log("LS2_SUMMARY probes=" + probes + " hard_stop=" + hard + " warn=" + warn + " review=" + review + " sessions=" + Object.keys(sessions).length);
console.log("FLIP unauth=" + grp.unauth + " adminCtrl=" + grp.adminCtrl);
if (hard === 0 && warn === 0 && review === 0) { console.log("LS2_VERDICT: PASS-FAILCLOSED"); process.exit(0); }
if (hard === 0) { console.log("LS2_VERDICT: PASS-WITH-OPEN"); process.exit(1); }
console.log("LS2_VERDICT: FAIL-CLOSED-REQUIRED"); process.exit(1);
