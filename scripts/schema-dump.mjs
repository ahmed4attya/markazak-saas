import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");
const env = fs.readFileSync(".env.local", "utf8");
const m = env.match(/DATABASE_URL\s*=\s*(.+)/);
const url = m[1].trim().replace(/^["']|["']$/g, "");
const tables = ["teachers","groups","classrooms","enrollments","attendance","invoices","payments","activation_codes","plans","certificates","questions","notifications","settings","leads","rate_limits"];
const c = new Client({ connectionString: url });
await c.connect();
for (const t of tables) {
  try {
    const r = await c.query("select column_name, data_type, is_nullable, column_default from information_schema.columns where table_name=$1 order by ordinal_position", [t]);
    if (r.rows.length === 0) { console.log("TABLE " + t + " = MISSING"); continue; }
    console.log("TABLE " + t + ":");
    for (const col of r.rows) {
      const parts = ["  " + col.column_name, col.data_type];
      if (col.is_nullable === "NO") parts.push("NOTNULL");
      if (col.column_default) parts.push("DEF=" + col.column_default);
      console.log(parts.join(" "));
    }
  } catch (e) { console.log("TABLE " + t + " ERR " + e.message); }
}
await c.end();
console.log("SCHEMA_DONE");