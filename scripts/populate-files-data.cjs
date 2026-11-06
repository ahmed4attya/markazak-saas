const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const url = fs.readFileSync('.env.prod', 'utf8').match(/DATABASE_URL=([^\r\n]+)/)[1].trim().replace(/^"|"$/g, '');
const pool = new Pool({ connectionString: url });

const FILES_MAP = [
  {
    storageKey: '/docs/qiyas-quant-rules-2026.pdf',
    filePath: 'public/docs/qiyas-quant-rules-2026.pdf'
  },
  {
    storageKey: '/docs/qiyas-verbal-guide-2026.pdf',
    filePath: 'public/docs/qiyas-verbal-guide-2026.pdf'
  },
  {
    storageKey: '/docs/tahsili-core-concepts-2026.pdf',
    filePath: 'public/docs/tahsili-core-concepts-2026.pdf'
  }
];

async function run() {
  for (const item of FILES_MAP) {
    if (fs.existsSync(item.filePath)) {
      const buffer = fs.readFileSync(item.filePath);
      const base64 = buffer.toString('base64');
      const res = await pool.query(
        'update files set file_data = $1, size_bytes = $2 where storage_key = $3 returning id, name, size_bytes',
        [base64, buffer.length, item.storageKey]
      );
      if (res.rows.length) {
        console.log(`✅ Updated file_data for: ${res.rows[0].name} [${res.rows[0].id}], size: ${res.rows[0].size_bytes} bytes`);
      } else {
        console.warn(`⚠️ Row not found for storageKey: ${item.storageKey}`);
      }
    } else {
      console.error(`❌ File not found on disk: ${item.filePath}`);
    }
  }
  await pool.end();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
