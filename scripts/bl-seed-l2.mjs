// bl-seed-l2.mjs v2 - B-L2 seed - LOCAL ONLY (localhost-guarded).
// Required: T1 courses cA cB, exams eA eB, assignments aA aB, course_teachers link. Optional: T2 tenant row + cT2 eT2 aT2 (cross-tenant probes).
// Cleanup: delete rows whose id starts with 5eed0000- (including the course_teachers row).
import { readFileSync } from "fs";
import pg from "pg";
function envParse(t) { const o = {}; for (const l of t.split(/\r?\n/)) { const s = l.trim(); if (!s || s.startsWith("#")) continue; const i = s.indexOf("="); if (i < 1) continue; let v = s.slice(i + 1).trim(); const qq = String.fromCharCode(34); if (v.length > 1 && v.startsWith(qq) && v.endsWith(qq)) v = v.slice(1, -1); o[s.slice(0, i).trim()] = v; } return o; }
const env = envParse(readFileSync(".env.local", "utf8"));
if (!env.DATABASE_URL) { console.log("FATAL: DATABASE_URL missing"); process.exit(2); }
const dbHost = new URL(env.DATABASE_URL).hostname;
if (dbHost !== "localhost" && dbHost !== "127.0.0.1") { console.log("FATAL_NOT_LOCAL: " + dbHost); process.exit(2); }
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const q = async (sql, p) => (await pool.query(sql, p || [])).rows;
const users = await q("select id, tenant_id, role from users order by role").catch((e) => { console.log("FATAL_DB: " + e.message); process.exit(2); });
const teacher = users.find(u => String(u.role) === "teacher");
if (!teacher) { console.log("FATAL_NO_TEACHER"); process.exit(2); }
const T1 = String(teacher.tenant_id);
const T2 = "5eed0000-0000-4000-8000-00000000e002";
const ID = { cA: "5eed0000-0000-4000-8000-00000000c0a1", cB: "5eed0000-0000-4000-8000-00000000c0b2", cT2: "5eed0000-0000-4000-8000-00000000c0c3", eA: "5eed0000-0000-4000-8000-00000000e0a1", eB: "5eed0000-0000-4000-8000-00000000e0b2", eT2: "5eed0000-0000-4000-8000-00000000e0c3", aA: "5eed0000-0000-4000-8000-00000000a0a1", aB: "5eed0000-0000-4000-8000-00000000a0b2", aT2: "5eed0000-0000-4000-8000-00000000a0c3", ct: "5eed0000-0000-4000-8000-0000000000c1" };
async function cols(table) { return await q("select column_name, data_type, is_nullable, column_default from information_schema.columns where table_name=$1", [table]); }
for (const t of ["tenants", "courses", "exams", "assignments", "course_teachers"]) { const c = await cols(t).catch(() => []); console.log("COLS " + t + "=" + c.map(x => x.column_name).join(",")); }
function ph(col, meta, tenantId) {
if (col === "tenant_id") return tenantId;
if (["created_by", "uploaded_by", "user_id", "teacher_user_id", "owner_user_id"].includes(col)) return String(teacher.id);
if (col === "status") return "active";
const dt = String(meta.data_type);
if (dt === "text" || dt.startsWith("character")) return "SEED-BL2";
if (["integer", "smallint", "bigint", "numeric", "decimal", "real", "double precision"].includes(dt)) return 0;
if (dt === "boolean") return false;
if (dt.includes("timestamp") || dt === "date") return new Date().toISOString();
if (dt === "jsonb" || dt === "json") return ["questions", "answers", "options"].includes(col) ? "[]" : "{}";
if (dt === "uuid") return String(teacher.id);
return null;
}
async function seedRow(table, id, tenantId, courseId, extra) {
const cs = await cols(table);
const ex = await q("select 1 from " + table + " where id=$1", [id]);
if (ex.length) { console.log("SEED_EXISTS " + table + ":" + id); return true; }
const row = Object.assign({ id: id, tenant_id: tenantId }, courseId ? { course_id: courseId } : {}, extra || {});
for (const c of cs) { if (c.column_name in row) continue; if (c.is_nullable === "NO" && c.column_default === null) { const v = ph(c.column_name, c, tenantId); if (v === null) { console.log("SEED_GAP " + table + "." + c.column_name + " (" + c.data_type + ")"); return false; } row[c.column_name] = v; } }
const names = Object.keys(row);
try { await q("insert into " + table + " (" + names.join(",") + ") values (" + names.map((x, i) => "$" + (i + 1)).join(",") + ") on conflict (id) do nothing", names.map(n => row[n])); console.log("SEED_OK " + table + ":" + id); return true; }
catch (e) { console.log("SEED_ERR " + table + " :: " + e.message); return false; }
}
let okReq = true;
okReq = (await seedRow("courses", ID.cA, T1, null, { name: "SEED-BL2-A" })) && okReq;
okReq = (await seedRow("courses", ID.cB, T1, null, { name: "SEED-BL2-B" })) && okReq;
okReq = (await seedRow("exams", ID.eA, T1, ID.cA, {})) && okReq;
okReq = (await seedRow("exams", ID.eB, T1, ID.cB, {})) && okReq;
okReq = (await seedRow("assignments", ID.aA, T1, ID.cA, {})) && okReq;
okReq = (await seedRow("assignments", ID.aB, T1, ID.cB, {})) && okReq;
async function seedTenant() {
const cs = await cols("tenants").catch(() => []);
if (cs.length === 0) { console.log("T2_STATUS=no-tenants-table"); return false; }
const ex = await q("select 1 from tenants where id=$1", [T2]);
if (ex.length) { console.log("T2_STATUS=exists"); return true; }
const row = { id: T2, name: "SEED-BL2-T2" };
for (const c of cs) { if (c.column_name in row) continue; if (c.is_nullable === "NO" && c.column_default === null) { const v = ph(c.column_name, c, T2); if (v === null) { console.log("SEED_GAP tenants." + c.column_name); return false; } row[c.column_name] = v; } }
const ns = Object.keys(row);
try { await q("insert into tenants (" + ns.join(",") + ") values (" + ns.map((x, i) => "$" + (i + 1)).join(",") + ") on conflict (id) do nothing", ns.map(n => row[n])); console.log("T2_STATUS=created"); return true; }
catch (e) { console.log("T2_STATUS=failed :: " + e.message); return false; }
}
await seedTenant();
let okOpt = true;
okOpt = (await seedRow("courses", ID.cT2, T2, null, { name: "SEED-BL2-T2C" })) && okOpt;
okOpt = (await seedRow("exams", ID.eT2, T2, ID.cT2, {})) && okOpt;
okOpt = (await seedRow("assignments", ID.aT2, T2, ID.cT2, {})) && okOpt;
const ctc = await cols("course_teachers");
const ctHas = await q("select 1 from course_teachers where teacher_user_id=$1 and course_id=$2", [teacher.id, ID.cA]);
if (ctHas.length) { console.log("SEED_EXISTS course_teachers"); }
else { try { const row = { teacher_user_id: String(teacher.id), course_id: ID.cA };
for (const c of ctc) { if (c.column_name in row) continue; if (c.is_nullable === "NO" && c.column_default === null) { const v = ph(c.column_name, c, T1); if (v !== null) row[c.column_name] = v; } }
if (ctc.some(c => c.column_name === "id") && !("id" in row)) row.id = ID.ct;
const ns = Object.keys(row);
await q("insert into course_teachers (" + ns.join(",") + ") values (" + ns.map((x, i) => "$" + (i + 1)).join(",") + ")", ns.map(n => row[n]));
console.log("SEED_OK course_teachers"); } catch (e) { console.log("SEED_ERR course_teachers :: " + e.message); okReq = false; } }
const reqIds = [ID.cA, ID.cB, ID.eA, ID.eB, ID.aA, ID.aB];
const optIds = [ID.cT2, ID.eT2, ID.aT2];
const v1 = await q("select (select count(*)::int from courses where id=any($1::uuid[])) + (select count(*)::int from exams where id=any($1::uuid[])) + (select count(*)::int from assignments where id=any($1::uuid[])) as n", [reqIds]).catch(() => [{ n: -1 }]);
const v2 = await q("select (select count(*)::int from courses where id=any($1::uuid[])) + (select count(*)::int from exams where id=any($1::uuid[])) + (select count(*)::int from assignments where id=any($1::uuid[])) as n", [optIds]).catch(() => [{ n: -1 }]);
const ctv = await q("select count(*)::int as n from course_teachers where teacher_user_id=$1 and course_id=$2", [teacher.id, ID.cA]).catch(() => [{ n: -1 }]);
console.log("VERIFY_REQ=" + v1[0].n + "/6");
console.log("VERIFY_OPT=" + v2[0].n + "/3");
console.log("VERIFY_CT=" + ctv[0].n + "/1");
await pool.end();
if (Number(v1[0].n) === 6 && Number(ctv[0].n) === 1) { console.log("SEED_DONE"); process.exit(0); }
console.log("SEED_PARTIAL");
process.exit(1);
