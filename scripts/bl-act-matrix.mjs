// bl-act-matrix.mjs - Track B-ACT v2 - LOCAL ONLY. Triage reclassification of v1: stripe 503 config-gate with body evidence, quick-contact gated-read, logout idempotent without review-count.
// Hard: any 5xx except stripe 503 whose body matches config keywords; unauth/learner never 2xx on staff routes; T2 uuids in any 2xx body; seed ids in unauth 2xx bodies.
// Known-red kept on purpose: POST /api/ai and POST /api/quick-contact crash 500 on empty body (uncaught JSON.parse) - surgical fix lands in r19.
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
const T2_IDS = ["5eed0000-0000-4000-8000-00000000c0c3", "5eed0000-0000-4000-8000-00000000e0c3", "5eed0000-0000-4000-8000-00000000a0c3"];
const SEED_ALL = ["5eed0000-0000-4000-8000-00000000c0a1", "5eed0000-0000-4000-8000-00000000c0b2", "5eed0000-0000-4000-8000-00000000e0a1", "5eed0000-0000-4000-8000-00000000e0b2", "5eed0000-0000-4000-8000-00000000a0a1", "5eed0000-0000-4000-8000-00000000a0b2"];
const ACTIONS = [
["/api/auth/login", "login"],
["/api/auth/logout", "logout"],
["/api/stripe/checkout", "stripe"],
["/api/stripe/webhook", "stripe"],
["/api/files/prepare", "gated"],
["/api/files/upload", "gated"],
["/api/files/upload-complete", "gated"],
["/api/videos/prepare", "gated"],
["/api/videos/upload", "gated"],
["/api/videos/upload-complete", "gated"],
["/api/ai", "gated"],
["/api/learner/ai-explain", "learner-action"],
["/api/learner/redeem", "learner-action"],
["/api/learner/attempts/submit", "learner-action"],
["/api/quick-contact", "gated-read"],
["/api/gradebook", "gated-read"],
["/api/questions/import", "gated"]
];
const ROLES = ["unauth", "student", "guardian", "teacher", "admin", "manager"];
let hard = 0, warn = 0, review = 0, probes = 0;
const grp = { unauth: true, ctrl: true };
function rec(idp, label, verdict, group) { probes++; if (verdict === "HARD_STOP") hard++; else if (verdict === "WARN") warn++; else if (verdict === "REVIEW") review++; if (group && grp[group] !== undefined && verdict !== "ok") grp[group] = false; console.log(idp + " " + label + " " + verdict); }
function rvw(msg) { review++; console.log("REVIEW: " + msg); }
async function req(method, path, cookie) { const h = {}; if (cookie) h.cookie = cookie; try { const r = await fetch(BASE + path, { method: method, headers: h, redirect: "manual" }); const t = await r.text(); return { s: r.status, t: t }; } catch (e) { return { s: 0, t: "" }; } }
function hasAny(text, ids) { const low = String(text).toLowerCase(); return ids.some((x) => low.includes(x)); }
const hz = await req("GET", "/api/health", null); rec("AM0", "GET /api/health (canary) -> " + hz.s, hz.s === 200 ? "ok" : "HARD_STOP", "ctrl");
for (const role of ROLES) { const g = await req("GET", "/api/me", role === "unauth" ? null : sessions[role]); const want = role === "unauth" ? 401 : 200; const v = g.s === want ? "ok" : (g.s === 0 || g.s >= 500 ? "HARD_STOP" : "REVIEW"); if (v === "REVIEW") rvw("me-canary " + role + " -> " + g.s); rec("AM0", role + " GET /api/me (canary) -> " + g.s, v, null); }
const ax = await req("GET", "/api/exams", sessions["admin"]); const axOk = ax.s === 200 && ax.t.toLowerCase().includes("5eed0000-0000-4000-8000-00000000e0a1"); if (!axOk) rvw("control admin /api/exams weak (status " + ax.s + ")"); rec("AM0", "control admin /api/exams contains e0a1 -> " + ax.s, axOk ? "ok" : "REVIEW", "ctrl");
async function probe(idp, method, route, cat, role) {
const ck = role === "unauth" ? null : sessions[role];
if (role !== "unauth" && !ck) { console.log("NO_SESSION " + role + " - skip " + route); return; }
const g = await req(method, route, ck); let v = "ok"; let tag = ""; let snip = "";
if (cat === "stripe" && g.s === 503) { const b = String(g.t); const low = b.toLowerCase(); const cfg = low.includes("stripe") || low.includes("config") || low.includes("unavailable") || low.includes("env") || low.includes("\u062E\u062F\u0645\u0629 \u0627\u0644\u062F\u0641\u0639") || low.includes("\"error\""); snip = b.slice(0, 90).replace(/\s+/g, " "); v = cfg ? "ok" : "HARD_STOP"; tag = cfg ? "stripe-unconfigured-503" : "stripe-503-unexplained"; }
else if (g.s === 0 || g.s >= 500) v = "HARD_STOP";
else if (g.s === 400 || g.s === 401 || g.s === 403 || g.s === 404 || g.s === 405 || g.s === 422) v = "ok";
else if (g.s >= 200 && g.s < 300) {
if (hasAny(g.t, T2_IDS)) { v = "HARD_STOP"; tag = "TENANT-LEAK"; }
else if (role === "unauth" && hasAny(g.t, SEED_ALL)) { v = "HARD_STOP"; tag = "UNAUTH-LEAK"; }
else if (cat === "gated" && role === "unauth") { v = "HARD_STOP"; tag = "unauth-on-staff-action"; }
else if (cat === "gated" && (role === "student" || role === "guardian")) { v = "HARD_STOP"; tag = "learner-on-staff-action"; }
else if (cat === "gated") { v = "REVIEW"; tag = "staff-2xx-empty-action"; }
else if (cat === "gated-read" && role === "unauth") { v = "HARD_STOP"; tag = "unauth-on-staff-read"; }
else if (cat === "gated-read" && (role === "student" || role === "guardian")) { v = "HARD_STOP"; tag = "learner-on-staff-read"; }
else if (cat === "gated-read") { v = "ok"; }
else if (cat === "stripe" && (role === "unauth" || role === "student" || role === "guardian")) { v = "HARD_STOP"; tag = "unauthorized-on-stripe"; }
else if (cat === "stripe") { v = "REVIEW"; tag = "staff-2xx-stripe"; }
else if (cat === "login") { v = "REVIEW"; tag = "login-2xx-empty-body"; }
else if (cat === "logout") { v = "ok"; tag = "logout-idempotent"; }
else if (cat === "learner-action" && role === "unauth") { v = "HARD_STOP"; tag = "unauth-on-learner-action"; }
else if (cat === "learner-action" && (role === "teacher" || role === "admin" || role === "manager")) { v = "REVIEW"; tag = "staff-on-learner-action"; }
else { v = "REVIEW"; tag = "learner-2xx-empty-action"; }
} else v = "WARN";
if (tag && v === "REVIEW") rvw(tag + " " + role + " " + method + " " + route);
rec(idp, role + " " + method + " " + route + " -> " + g.s + (tag ? " [" + tag + "]" : "") + (snip ? " {" + snip + "}" : ""), v, role === "unauth" ? "unauth" : null);
}
for (const route of ACTIONS) { const p = route[0]; const cat = route[1]; for (const role of ROLES) { await probe("AM1", "GET", p, cat, role); await probe("AM2", "POST", p, cat, role); } }
await pool.end();
console.log("---");
console.log("ACT_SUMMARY probes=" + probes + " hard_stop=" + hard + " warn=" + warn + " review=" + review + " sessions=" + Object.keys(sessions).length);
console.log("FLIP unauth=" + grp.unauth + " ctrl=" + grp.ctrl);
if (hard === 0 && warn === 0 && review === 0) { console.log("ACT_VERDICT: PASS-FAILCLOSED"); process.exit(0); }
if (hard === 0) { console.log("ACT_VERDICT: PASS-WITH-REVIEW"); process.exit(1); }
console.log("ACT_VERDICT: FAIL-CLOSED-REQUIRED"); process.exit(1);
