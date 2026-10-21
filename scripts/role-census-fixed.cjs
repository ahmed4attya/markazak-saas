const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function parseEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) throw new Error("Missing .env.local");
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const env = {};
  lines.forEach(line => {
    const [key, ...val] = line.split('=');
    if (key) env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
  });
  return env;
}

try {
  const env = parseEnv();
  const connectionString = env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL not found in .env.local");
  
  const pool = new Pool({ 
    connectionString, 
    ssl: env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined 
  });

  pool.query('SELECT role, COUNT(*)::int AS n FROM users GROUP BY role ORDER BY n DESC')
    .then(r => { 
      console.log("--- Role Census Results ---");
      console.table(r.rows); 
      return pool.end(); 
    })
    .catch(e => { 
      console.error('CENSUS-FAIL:', e.message); 
      process.exit(1); 
    });
} catch (e) {
  console.error('CENSUS-INIT-FAIL:', e.message);
  process.exit(1);
}
