import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { Client } = require("pg");
const env = fs.readFileSync(".env.local", "utf8");
const m = env.match(/DATABASE_URL\s*=\s*(.+)/);
const url = m[1].trim().replace(/^["']|["']$/g, "");
const DOMAIN = "center.sa";
const PASS = "Admin@12345";
const c = new Client({ connectionString: url });
await c.connect();
const before = await c.query("select email, role from users order by role, email");
const hash = bcrypt.hashSync(PASS, 10);
for (const r of before.rows) {
  const ne = r.email.replace(/@local\.test$/, "@" + DOMAIN);
  const res = await c.query("update users set email=$1, password_hash=$2, active=true where email=$3", [ne, hash, r.email]);
  console.log("UPDATED [" + r.role + "] " + r.email + " -> " + ne + " rc=" + res.rowCount);
}
const after = await c.query("select email, role from users order by role, email");
for (const r of after.rows) console.log("NOW [" + r.role + "] " + r.email);
console.log("USERS_COUNT=" + after.rows.length + " (preflight expects 5)");
try { await c.query("delete from rate_limits where key like 'login:%'"); console.log("RATELIMIT_CLEARED"); } catch { console.log("RATELIMIT_NO_TABLE_OR_COL"); }
await c.end();
console.log("PASSWORD_FOR_ALL=" + PASS);
console.log("FIX_USERS_DONE");