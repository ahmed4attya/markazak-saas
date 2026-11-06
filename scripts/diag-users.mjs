import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const env = fs.readFileSync(".env.local", "utf8");
const m = env.match(/DATABASE_URL\s*=\s*(.+)/);
if (!m) { console.error("NO_DATABASE_URL"); process.exit(1); }
const url = m[1].trim().replace(/^["']|["']$/g, "");
const c = new Client({ connectionString: url });
await c.connect();
try {
  const u = await c.query("select email, role from users order by role, email");
  console.log("USERS(" + u.rows.length + "):");
  for (const r of u.rows) console.log("  [" + r.role + "] " + r.email);
  const cols = await c.query("select column_name from information_schema.columns where table_name='users' order by ordinal_position");
  console.log("USER_COLUMNS: " + cols.rows.map(r => r.column_name).join(", "));
  for (const t of ["students","teachers","courses","groups","classrooms","exams","assignments","enrollments","attendance","invoices","payments","activation_codes","plans","certificates","questions","notifications","settings","leads"]) {
    try { const r = await c.query("select count(*)::int as n from " + t); console.log("COUNT " + t + " = " + r.rows[0].n); } catch { console.log("COUNT " + t + " = ERR"); }
  }
} catch (e) { console.error("DIAG_ERR", e.message); }
try { await c.end(); } catch { }
console.log("DIAG_DONE");