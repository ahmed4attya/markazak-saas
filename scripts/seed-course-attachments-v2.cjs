const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env.prod', 'utf8');
const m = env.match(/DATABASE_URL=([^\r\n]+)/);
const pool = new Pool({ connectionString: m[1].trim() });

const TENANT_ID = '539e7896-7808-4533-ad4d-feed934e9f65';
const COURSE_ID = '9232aee0-d518-480c-83e2-3ca84903f63f'; // FREE-QUANT-2026
const GROUP_ID = 'a7f8da4d-23a7-4a15-915a-e80885f1baad';
const USER_ID = '6ab29e5b-bcea-4330-a881-d022e97e291b'; // admin

async function seed() {
  console.log('--- Registering Quant Free Course Content ---');

  // 1. Video in `videos` table
  const videoFile = 'public/media/qiyas-quant-foundation-lecture.mp4';
  if (fs.existsSync(videoFile)) {
    const stat = fs.statSync(videoFile);
    const videoKey = '/media/qiyas-quant-foundation-lecture.mp4';
    const videoTitle = 'المحاضرة 1: التدرج المنتظم وقوانين النسب والكسور السريعة — قدرات كمي 2026';
    
    // Check if video already exists
    const exV = await pool.query('SELECT id FROM videos WHERE storage_key = $1 AND tenant_id = $2', [videoKey, TENANT_ID]);
    let videoId;
    if (exV.rows.length) {
      videoId = exV.rows[0].id;
      console.log('✓ Video already exists in videos table:', videoId);
    } else {
      const insV = await pool.query(
        `INSERT INTO videos (tenant_id, course_id, group_id, title, mime, size_bytes, duration_seconds, storage_key, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [TENANT_ID, COURSE_ID, GROUP_ID, videoTitle, 'video/mp4', stat.size, 2700, videoKey, USER_ID]
      );
      videoId = insV.rows[0].id;
      console.log('✅ Registered video in videos table:', videoId);
    }

    // Also register in `files` table for unified access in library
    const exF = await pool.query('SELECT id FROM files WHERE storage_key = $1 AND tenant_id = $2', [videoKey, TENANT_ID]);
    if (!exF.rows.length) {
      await pool.query(
        `INSERT INTO files (tenant_id, course_id, group_id, name, mime, size_bytes, storage_key, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [TENANT_ID, COURSE_ID, GROUP_ID, 'المحاضرة المرئية — التأسيس الشامل قدرات كمي 2026.mp4', 'video/mp4', stat.size, videoKey, USER_ID]
      );
      console.log('✅ Registered video in files table');
    }
  }

  // 2. Podcast (.m4a) in `files` table
  const podcastFile = 'public/media/qiyas-quant-podcast-fast-rules.m4a';
  if (fs.existsSync(podcastFile)) {
    const stat = fs.statSync(podcastFile);
    const podcastKey = '/media/qiyas-quant-podcast-fast-rules.m4a';
    const podcastTitle = 'بودكاست صوتي — القوانين الذهبية واستراتيجيات الحل السريع.m4a';
    
    const exP = await pool.query('SELECT id FROM files WHERE storage_key = $1 AND tenant_id = $2', [podcastKey, TENANT_ID]);
    if (!exP.rows.length) {
      await pool.query(
        `INSERT INTO files (tenant_id, course_id, group_id, name, mime, size_bytes, storage_key, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [TENANT_ID, COURSE_ID, GROUP_ID, podcastTitle, 'audio/mp4', stat.size, podcastKey, USER_ID]
      );
      console.log('✅ Registered podcast in files table');
    } else {
      console.log('✓ Podcast already in files table');
    }
  }

  // 3. Mind map (.png) with Base64 in `files` table
  const mindmapFile = 'public/docs/mindmap-qiyas-quant-core.png';
  if (fs.existsSync(mindmapFile)) {
    const stat = fs.statSync(mindmapFile);
    const key = '/docs/mindmap-qiyas-quant-core.png';
    const title = 'خريطة المفاهيم الشاملة (Mind Map) — قدرات كمي 2026.png';
    const base64 = fs.readFileSync(mindmapFile).toString('base64');
    
    const exM = await pool.query('SELECT id FROM files WHERE storage_key = $1 AND tenant_id = $2', [key, TENANT_ID]);
    if (!exM.rows.length) {
      await pool.query(
        `INSERT INTO files (tenant_id, course_id, group_id, name, mime, size_bytes, storage_key, file_data, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [TENANT_ID, COURSE_ID, GROUP_ID, title, 'image/png', stat.size, key, base64, USER_ID]
      );
      console.log('✅ Registered Mind Map in files table');
    } else {
      console.log('✓ Mind map already in files table');
    }
  }

  // 4. Guide / Infographic (.png) with Base64 in `files` table
  const guideFile = 'public/docs/guide-strategies-quant-rules.png';
  if (fs.existsSync(guideFile)) {
    const stat = fs.statSync(guideFile);
    const key = '/docs/guide-strategies-quant-rules.png';
    const title = 'دليل استراتيجيات وقوانين القدرات الكمية الحديثة 2026.png';
    const base64 = fs.readFileSync(guideFile).toString('base64');
    
    const exG = await pool.query('SELECT id FROM files WHERE storage_key = $1 AND tenant_id = $2', [key, TENANT_ID]);
    if (!exG.rows.length) {
      await pool.query(
        `INSERT INTO files (tenant_id, course_id, group_id, name, mime, size_bytes, storage_key, file_data, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [TENANT_ID, COURSE_ID, GROUP_ID, title, 'image/png', stat.size, key, base64, USER_ID]
      );
      console.log('✅ Registered Guide in files table');
    } else {
      console.log('✓ Guide already in files table');
    }
  }

  console.log('--- All course content seeded successfully! ---');
  await pool.end();
}

seed().catch(e => {
  console.error('Seed error:', e);
  pool.end();
});
