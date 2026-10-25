// scripts/create-tenant.cjs - SaaS Tenant Provisioning Tool
const { Pool } = require('pg');
const fs = require('fs');
const bcrypt = require('bcryptjs');

function getDatabaseUrl() {
  // Check .env.prod or .env.local
  for (const envFile of ['.env.prod', '.env.local', '.env']) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const match = content.match(/DATABASE_URL=([^\r\n]+)/);
      if (match && match[1]) {
        let url = match[1].trim();
        if (url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);
        if (url.startsWith("'") && url.endsWith("'")) url = url.slice(1, -1);
        return url;
      }
    }
  }
  return process.env.DATABASE_URL;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        params[key] = next;
        i++;
      } else {
        params[key] = true;
      }
    }
  }
  return params;
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0621-\u064A-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'tenant-' + Math.floor(Math.random() * 10000);
}

async function main() {
  const params = parseArgs();
  const centerName = params.name || params.center;
  const adminName = params.admin || params.user || centerName || 'مدير المركز';
  const email = params.email;
  const password = params.password || 'demo' + Math.floor(100000 + Math.random() * 900000);
  const plan = params.plan || 'pro';
  const addDemoData = Boolean(params.demo);

  if (!centerName || !email) {
    console.log(`
استخدام الأداة لإنشاء مركز تجريبي جديد (SaaS Tenant):
node scripts/create-tenant.cjs --name "اسم المركز" --email "بريد_المدير" [--password "كلمة_المرور"] [--admin "اسم المدير"] [--plan pro] [--demo]

مثال:
node scripts/create-tenant.cjs --name "مركز التميز للقدرات" --email "client@altamayoz.com" --password "Test@2026" --demo
    `);
    process.exit(1);
  }

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    console.error('خطأ: لم يتم العثور على DATABASE_URL في ملفات البيئة');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check if email exists
    const emailCheck = await client.query('select id, tenant_id from users where lower(email) = lower($1) limit 1', [email]);
    if (emailCheck.rows.length > 0) {
      throw new Error(`البريد الإلكتروني (${email}) مسجل مسبقاً في النظام.`);
    }

    // 2. Generate slug
    let baseSlug = slugify(centerName);
    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const slugCheck = await client.query('select id from tenants where slug = $1 limit 1', [finalSlug]);
      if (slugCheck.rows.length === 0) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // 3. Create Tenant
    const tenantRes = await client.query(
      `insert into tenants (name, slug, plan, status)
       values ($1, $2, $3, 'active')
       returning id, name, slug, plan`,
      [centerName, finalSlug, plan]
    );
    const tenant = tenantRes.rows[0];

    // 4. Create Owner User
    const passwordHash = await bcrypt.hash(password, 12);
    const userRes = await client.query(
      `insert into users (tenant_id, email, name, password_hash, role, active)
       values ($1, $2, $3, $4, 'owner', true)
       returning id, name, email, role`,
      [tenant.id, email.toLowerCase().trim(), adminName, passwordHash]
    );
    const user = userRes.rows[0];

    // 5. Optionally add demo data for a pleasant onboarding experience
    if (addDemoData) {
      // Course
      const courseRes = await client.query(
        `insert into courses (tenant_id, name, code, category, price, status)
         values ($1, 'دورة تأسيس القدرات العامة (تجريبية)', 'QUD-DEMO', 'قدرات عامة', 450, 'active')
         returning id`,
        [tenant.id]
      );
      const courseId = courseRes.rows[0]?.id;

      // Group
      const groupRes = await client.query(
        `insert into groups (tenant_id, course_id, name, capacity, mode, status)
         values ($1, $2, 'مجموعة الأمل - مسائي', 30, 'online', 'active')
         returning id`,
        [tenant.id, courseId]
      );
      const groupId = groupRes.rows[0]?.id;

      // Sample Students
      const s1 = await client.query(
        `insert into students (tenant_id, student_no, name, phone, status)
         values ($1, 'STU-101', 'عبدالرحمن العتيبي (طالب تجريبي)', '0501112233', 'active')
         returning id`,
        [tenant.id]
      );
      const s2 = await client.query(
        `insert into students (tenant_id, student_no, name, phone, status)
         values ($1, 'STU-102', 'سارة القحطاني (طالب تجريبي)', '0504445566', 'active')
         returning id`,
        [tenant.id]
      );

      // Enrollments
      if (groupId && s1.rows[0]?.id) {
        await client.query(
          `insert into enrollments (tenant_id, group_id, student_id, status, price)
           values ($1, $2, $3, 'active', 450) on conflict do nothing`,
          [tenant.id, groupId, s1.rows[0].id]
        );
      }
      if (groupId && s2.rows[0]?.id) {
        await client.query(
          `insert into enrollments (tenant_id, group_id, student_id, status, price)
           values ($1, $2, $3, 'active', 450) on conflict do nothing`,
          [tenant.id, groupId, s2.rows[0].id]
        );
      }

      // Sample Question
      await client.query(
        `insert into questions (tenant_id, domain, subject, skill, difficulty, kind, text, options, correct_index, explanation)
         values ($1, 'قدرات كمي', 'الحساب', 'التناسب الطردي', 3, 'mcq',
                 'إذا كانت تكلفة ٥ كتب هي ٧٥ ريال، فما تكلفة ٨ كتب من نفس النوع؟',
                 '["100 ريال", "120 ريال", "140 ريال", "150 ريال"]'::jsonb,
                 1,
                 'سعر الكتاب الواحد = 75 ÷ 5 = 15 ريال. تكلفة 8 كتب = 8 × 15 = 120 ريال.')`,
        [tenant.id]
      );
    }

    await client.query('COMMIT');

    console.log('====================================================');
    console.log('✅ تم إنشاء المركز التجريبي الجديد بنجاح (SaaS Tenant)');
    console.log('====================================================');
    console.log(`🏢 اسم المركز:    ${tenant.name}`);
    console.log(`🔗 المعرف (Slug): ${tenant.slug}`);
    console.log(`💎 الخطة:         ${tenant.plan}`);
    console.log(`👤 المدير:        ${user.name} (${user.role})`);
    console.log(`📧 البريد:        ${user.email}`);
    console.log(`🔑 كلمة المرور:   ${password}`);
    console.log(`🌐 رابط الدخول:   https://markazak-saas.vercel.app/login`);
    if (addDemoData) {
      console.log('📦 تم تضمين بيانات تجريبية (دورة، مجموعة، طالبين، وسؤال تدريبي)');
    }
    console.log('====================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ فشل إنشاء المركز:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
