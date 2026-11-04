const { Pool } = require('pg');

const srcPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_tUCasmO9kfR8@ep-noisy-lab-b2wqj8s4.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const targetPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_37bqXYjIahCz@ep-green-river-b2gmr2y5-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const TENANT_ID = '539e7896-7808-4533-ad4d-feed934e9f65'; // سنتر الخوارزمي

// Course IDs in Al-Khawarizmi
const COURSE_MAP = {
  quant: '8179e535-96d3-428c-b7bd-a42940b26ed8',     // قدرات كمي — دورة شاملة
  verbal: '76c79acc-6554-4df1-9c7e-1616e63fa631',    // قدرات لفظي — دورة شاملة
  physics: '3c45e7a7-892f-448a-bf53-2df048047257',   // تحصيلي فيزياء
  chemistry: 'a7d99584-ab1b-4e8b-b21f-f25cdd094dc0', // تحصيلي كيمياء
  biology: 'e84b73da-50c3-427e-87d5-8e20df1ad0b1',   // تحصيلي أحياء
  math: '611751fe-ee71-4160-a0ea-a8cff500b4ca',      // تحصيلي رياضيات
  tahsili_gen: 'd62cd5f8-1539-4340-a2b5-d87d2e2b3ba3' // تحصيلي عام
};

function determineDomainAndCourse(sectionKey, sectionName, skillName, source) {
  const sName = (sectionName || '').trim();
  const sKey = (sectionKey || '').trim().toUpperCase();
  const sk = (skillName || '').trim();
  const src = (source || '').trim();

  // VERBAL
  if (sKey === 'VERBAL' || sName.includes('لفظي')) {
    return {
      domain: 'verbal',
      courseId: COURSE_MAP.verbal,
      subject: sk || 'القدرات اللفظية'
    };
  }

  // QUANT
  if (sKey === 'QUANT' || sName.includes('كمي')) {
    return {
      domain: 'quant',
      courseId: COURSE_MAP.quant,
      subject: sk || 'القدرات الكمية'
    };
  }

  // TAHSILI / ACHIEVEMENT
  if (sKey === 'TAHSEELI' || sName.includes('تحصيلي') || sKey === 'TAHSILI') {
    let sub = 'تحصيلي عام';
    let cId = COURSE_MAP.tahsili_gen;

    if (sk.includes('فيزياء') || src.includes('فيزياء')) {
      sub = 'تحصيلي فيزياء';
      cId = COURSE_MAP.physics;
    } else if (sk.includes('كيمياء') || src.includes('كيمياء')) {
      sub = 'تحصيلي كيمياء';
      cId = COURSE_MAP.chemistry;
    } else if (sk.includes('أحياء') || src.includes('أحياء') || sk.includes('احياء')) {
      sub = 'تحصيلي أحياء';
      cId = COURSE_MAP.biology;
    } else if (sk.includes('رياضيات') || src.includes('رياضيات')) {
      sub = 'تحصيلي رياضيات';
      cId = COURSE_MAP.math;
    }

    return {
      domain: 'achievement',
      courseId: cId,
      subject: sub
    };
  }

  // Default fallback
  return {
    domain: 'quant',
    courseId: COURSE_MAP.quant,
    subject: sk || 'عام'
  };
}

function parsePassageAndBody(rawBody) {
  if (!rawBody) return { passage: null, text: '' };
  
  if (rawBody.includes('【نص القطعة】:')) {
    const parts = rawBody.split('【السؤال】:');
    if (parts.length >= 2) {
      const passagePart = parts[0].replace('【نص القطعة】:', '').trim();
      const questionPart = parts.slice(1).join('【السؤال】:').trim();
      return {
        passage: passagePart,
        text: questionPart || rawBody
      };
    }
  }

  return { passage: null, text: rawBody.trim() };
}

function parseOptionsAndCorrectIndex(options, answerKey) {
  let opts = [];
  if (Array.isArray(options)) {
    opts = options.map(o => {
      if (typeof o === 'string') return o.trim();
      if (o && typeof o === 'object') return (o.text || o.val || o.key || '').trim();
      return String(o).trim();
    });
  } else if (typeof options === 'object' && options !== null) {
    opts = Object.values(options).map(v => String(v).trim());
  }

  // Filter out completely empty if excessive
  if (opts.length === 0) {
    opts = ['أ', 'ب', 'ج', 'د'];
  }

  // Determine correct_index (0-indexed)
  let correctIndex = 0;
  const ak = String(answerKey || '').trim();

  if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'object' && options[0].key) {
    const idx = options.findIndex(o => o.key === ak);
    if (idx !== -1) correctIndex = idx;
  } else {
    if (ak === 'أ' || ak === 'A' || ak === '1') correctIndex = 0;
    else if (ak === 'ب' || ak === 'B' || ak === '2') correctIndex = 1;
    else if (ak === 'ج' || ak === 'C' || ak === '3') correctIndex = 2;
    else if (ak === 'د' || ak === 'D' || ak === '4') correctIndex = 3;
    else {
      const num = parseInt(ak, 10);
      if (!isNaN(num) && num >= 0 && num < opts.length) correctIndex = num;
    }
  }

  if (correctIndex < 0 || correctIndex >= opts.length) correctIndex = 0;

  return { options: opts, correctIndex };
}

async function main() {
  console.log('===============================================================');
  console.log('Starting Migration: Qudurati (+15.4K) -> Al-Khawarizmi Markazak');
  console.log('===============================================================');

  // Check pre-existing questions count
  const initialCountRes = await targetPool.query('SELECT count(*) FROM questions WHERE tenant_id = $1', [TENANT_ID]);
  console.log(`Current questions in Al-Khawarizmi (tenant: ${TENANT_ID}):`, initialCountRes.rows[0].count);

  // Fetch all approved questions from Qudurati
  console.log('Fetching questions from Qudurati Neon DB...');
  const querySql = `
    SELECT q.id, q.body, q.options, q."answerKey", q.explanation, q.source, q."imageUrl",
           s.key as section_key, s."nameAr" as section_name,
           sk."nameAr" as skill_name
    FROM "Question" q
    JOIN "Section" s ON s.id = q."sectionId"
    LEFT JOIN "Skill" sk ON sk.id = q."skillId"
    WHERE q.status = 'APPROVED'
    ORDER BY q.id
  `;
  const srcRes = await srcPool.query(querySql);
  const total = srcRes.rowCount;
  console.log(`Successfully fetched ${total} approved questions from Qudurati.`);

  // Load existing questions text from target to avoid duplicates
  console.log('Loading existing question texts to prevent duplicates...');
  const existingTextsRes = await targetPool.query('SELECT text FROM questions WHERE tenant_id = $1', [TENANT_ID]);
  const existingSet = new Set(existingTextsRes.rows.map(r => r.text.trim()));
  console.log(`Found ${existingSet.size} unique existing questions in Al-Khawarizmi.`);

  let insertedCount = 0;
  let skippedCount = 0;

  const BATCH_SIZE = 250;
  const rowsToInsert = [];

  for (let i = 0; i < total; i++) {
    const q = srcRes.rows[i];
    const { passage, text } = parsePassageAndBody(q.body);
    
    if (!text || text.length === 0) {
      skippedCount++;
      continue;
    }

    if (existingSet.has(text)) {
      skippedCount++;
      continue;
    }

    existingSet.add(text); // prevent in-run duplicates

    const { domain, courseId, subject } = determineDomainAndCourse(
      q.section_key,
      q.section_name,
      q.skill_name,
      q.source
    );

    const { options, correctIndex } = parseOptionsAndCorrectIndex(q.options, q.answerKey);

    const topic = (q.source || '').trim() || (q.skill_name || '').trim() || 'عام';
    const skill = (q.skill_name || '').trim() || subject;
    const explanation = (q.explanation || '').trim() || null;
    const imageUrl = (q.imageUrl || '').trim() || null;

    rowsToInsert.push({
      tenant_id: TENANT_ID,
      course_id: courseId,
      domain,
      subject,
      topic,
      skill,
      difficulty: 3,
      kind: 'mcq',
      text,
      options: JSON.stringify(options),
      correct_index: correctIndex,
      explanation,
      passage,
      image_url: imageUrl,
      status: 'active'
    });
  }

  console.log(`Prepared ${rowsToInsert.length} new unique questions for insertion (Skipped ${skippedCount} duplicates/empty).`);

  // Bulk insert in batches
  for (let b = 0; b < rowsToInsert.length; b += BATCH_SIZE) {
    const chunk = rowsToInsert.slice(b, b + BATCH_SIZE);
    
    // Construct parameterized multi-row insert
    const valuePlaceholders = [];
    const values = [];
    let pIdx = 1;

    for (const item of chunk) {
      valuePlaceholders.push(`(
        $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++},
        $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}::jsonb,
        $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}
      )`);
      values.push(
        item.tenant_id,
        item.course_id,
        item.domain,
        item.subject,
        item.topic,
        item.skill,
        item.difficulty,
        item.kind,
        item.text,
        item.options,
        item.correct_index,
        item.explanation,
        item.passage,
        item.image_url,
        item.status
      );
    }

    const insertSql = `
      INSERT INTO questions (
        tenant_id, course_id, domain, subject, topic,
        skill, difficulty, kind, text, options,
        correct_index, explanation, passage, image_url, status
      )
      VALUES ${valuePlaceholders.join(', ')}
    `;

    await targetPool.query(insertSql, values);
    insertedCount += chunk.length;

    if (insertedCount % 1000 === 0 || insertedCount === rowsToInsert.length) {
      console.log(`Inserted ${insertedCount} / ${rowsToInsert.length} questions... (${Math.round((insertedCount / rowsToInsert.length) * 100)}%)`);
    }
  }

  console.log('\n===============================================================');
  console.log(`Migration Complete! Total inserted: ${insertedCount}, Skipped: ${skippedCount}`);
  
  // Final count check by domain in Al-Khawarizmi
  const finalSummary = await targetPool.query(`
    SELECT domain, count(*) as count 
    FROM questions 
    WHERE tenant_id = $1 
    GROUP BY domain
  `, [TENANT_ID]);

  console.log('\nFinal Al-Khawarizmi Questions Count:');
  finalSummary.rows.forEach(r => console.log(`  - Domain [${r.domain}]: ${Number(r.count).toLocaleString('ar-SA')} questions`));

  const totalFinal = await targetPool.query('SELECT count(*) FROM questions WHERE tenant_id = $1', [TENANT_ID]);
  console.log(`Total in Al-Khawarizmi: ${Number(totalFinal.rows[0].count).toLocaleString('ar-SA')} questions! 🚀`);
  console.log('===============================================================');

  await srcPool.end();
  await targetPool.end();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
