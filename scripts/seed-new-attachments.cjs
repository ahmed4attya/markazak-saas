const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const url = fs.readFileSync('.env.prod', 'utf8').match(/DATABASE_URL=([^\r\n]+)/)[1].trim().replace(/^"|"$/g, '');
const pool = new Pool({ connectionString: url });

const tenantId = '539e7896-7808-4533-ad4d-feed934e9f65';
const courseId = '9232aee0-d518-480c-83e2-3ca84903f63f';
const groupId = 'a7f8da4d-23a7-4a15-915a-e80885f1baad';
const userId = '6ab29e5b-bcea-4330-a881-d022e97e291b';

const ATTACHMENTS = [
  {
    src: 'C:/Users/IT/.gemini/antigravity/brain/58f476bb-cce0-486c-a6cf-bd92156b056f/.user_uploaded/media_1793092179628_762b8838.png',
    dest: 'public/docs/mindmap-qiyas-quant-2026.png',
    name: 'خريطة ذهنية — قوانين ومحاضرات القدرات الكمي 2026.png',
    storageKey: '/docs/mindmap-qiyas-quant-2026.png',
    note: 'خريطة مفاهيم شجرية شاملة للمحاضرتين الأولى والثانية وقوانين الحساب والهندسة والحركة'
  },
  {
    src: 'C:/Users/IT/.gemini/antigravity/brain/58f476bb-cce0-486c-a6cf-bd92156b056f/.user_uploaded/media_1793092180155_0730f428.png',
    dest: 'public/docs/infographic-qiyas-quant-2026.png',
    name: 'انفوجرافيك بصري — القوانين الذهبية واستراتيجيات الحل السريع 2026.png',
    storageKey: '/docs/infographic-qiyas-quant-2026.png',
    note: 'دليل بصري عالي الدقة لقوانين النسب والسرعة المتوسطة ومثلثات فيثاغورس وفخاخ قياس'
  }
];

async function run() {
  for (const item of ATTACHMENTS) {
    if (!fs.existsSync(item.src)) {
      console.error(`Source not found: ${item.src}`);
      continue;
    }

    // 1. Copy to public/docs/
    fs.copyFileSync(item.src, item.dest);
    console.log(`✅ Copied to ${item.dest}`);

    // 2. Read buffer & base64
    const buffer = fs.readFileSync(item.dest);
    const base64 = buffer.toString('base64');

    // 3. Insert or update in database
    const res = await pool.query(
      `insert into files (tenant_id, course_id, group_id, name, mime, size_bytes, storage_key, file_data, uploaded_by, note)
       values ($1, $2, $3, $4, 'image/png', $5, $6, $7, $8, $9)
       on conflict (storage_key) do update set
         name = excluded.name,
         file_data = excluded.file_data,
         size_bytes = excluded.size_bytes,
         note = excluded.note
       returning id, name, size_bytes`,
      [tenantId, courseId, groupId, item.name, buffer.length, item.storageKey, base64, userId, item.note]
    );

    console.log(`✅ Registered in database: ${res.rows[0].name} [${res.rows[0].id}], size: ${res.rows[0].size_bytes} bytes`);
  }
  await pool.end();
}

run().catch(e => {
  console.error('Error inserting attachments:', e);
  process.exit(1);
});
