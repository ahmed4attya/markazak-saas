// scripts/seed-course-content.cjs
const { Pool } = require('pg');
const fs = require('fs');

function getDatabaseUrl() {
  const content = fs.readFileSync('.env.prod', 'utf8');
  const match = content.match(/DATABASE_URL=([^\r\n]+)/);
  let url = match[1].trim();
  if (url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);
  return url;
}

const MODULES_AND_LESSONS = [
  {
    courseCode: 'FREE-QUANT-2026',
    modules: [
      {
        title: 'الوحدة الأولى: ركائز الحساب والحل الذهني السريع',
        description: 'استراتيجيات الحل بدون استخدام الورقة والقلم والتعامل مع النسب والجذور والأسس',
        sort_order: 1,
        lessons: [
          {
            title: 'المحاضرة 1: التدرج المنتظم وقوانين النسب والكسور السريعة',
            content: 'شرح مفصل لكيفية حساب النسب المئوية (10%، 25%، 50%) بسرعة فائقة دون استخدام العمليات الحسابية الطويلة، مع أمثلة عملية من تجميعات قياس الحديثة.',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration_minutes: 45,
            sort_order: 1,
            is_free_preview: true
          },
          {
            title: 'المحاضرة 2: الهندسة والمقارنات وتفادي الفخاخ الحسابية',
            content: 'أسرار مثلثات فيثاغورس والزوايا والأشكال الرباعية، وكيفية حسم أسئلة المقارنات بين المقادير الجبرية الكبيرة في ثوانٍ معدودة.',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration_minutes: 50,
            sort_order: 2,
            is_free_preview: true
          }
        ]
      }
    ],
    assignment: {
      title: 'واجب الأسبوع الأول: استراتيجيات الحساب الذهني والمقارنات',
      description: 'قم بحل المسائل التالية وكتابة طريقة التفكير والحل في الصندوق أدناه:\n\n1. زاد سعر منتج بنسبة 25% ثم تم تخفيضه بنسبة 20%، ما التغير المئوي الصافي في سعره؟\n2. قارن بين (3 أس 40) و (4 أس 30) مع توضيح الطريقة.\n3. سيارتان انطلقتا من الرياض في اتجاهين متعاكسين الأولى بسرعة 85 كم/س والثانية 75 كم/س، بعد كم ساعة تصبح المسافة بينهما 480 كم؟',
      max_score: 100
    },
    file: {
      name: 'مذكرة القوانين الذهبية — قدرات كمي 2026.pdf',
      storage_key: '/docs/qiyas-quant-rules-2026.pdf',
      mime: 'application/pdf',
      size_bytes: 52000,
      note: 'الملف التأسيسي الشامل لجميع قوانين الحساب والهندسة والمقارنات والسرعة'
    },
    extraQuestions: [
      {
        domain: 'قدرات كمي',
        subject: 'الجبر والأعداد',
        topic: 'المعادلات والكسور',
        skill: 'التبسيط السريع',
        difficulty: 3,
        text: 'إذا كان س + ص = ٨ ، س ص = ١٥ ، فما قيمة س² + ص² ؟',
        options: ['٣٤', '٤٩', '٦٤', '٧٩'],
        correct_index: 0,
        explanation: 'المتطابقة الشهيرة: (س + ص)² = س² + ٢س ص + ص². بالتعويض: ٨² = (س² + ص²) + ٢(١٥) ➔ ٦٤ = (س² + ص²) + ٣٠. إذن س² + ص² = ٦٤ - ٣٠ = ٣٤.'
      },
      {
        domain: 'قدرات كمي',
        subject: 'الهندسة',
        topic: 'محيط ومساحة الدائرة',
        skill: 'حساب مساحة الجزء المظلل',
        difficulty: 3,
        text: 'مربع طول ضلعه ٤ سم، رُسمت بداخله دائرة تمس أضلاعه الأربعة. ما هي مساحة المنطقة المتبقية (المظللة) بين المربع والدائرة؟',
        options: ['١٦ - ٤ط', '١٦ - ٨ط', '١٦ - ٢ط', '٤ - ط'],
        correct_index: 0,
        explanation: 'مساحة المربع = الضلع² = ٤ × ٤ = ١٦ سم². قطر الدائرة يساوي طول ضلع المربع = ٤ سم، إذن نصف القطر نق = ٢ سم. مساحة الدائرة = ط × نق² = ط × ٢² = ٤ط. مساحة المنطقة المتبقية = مساحة المربع - مساحة الدائرة = ١٦ - ٤ط.'
      }
    ]
  },
  {
    courseCode: 'FREE-VERBAL-2026',
    modules: [
      {
        title: 'الوحدة الأولى: إتقان العلاقات ودلالات المعاني',
        description: 'تغطية أنماط أسئلة التناظر اللفظي، إكمال الجمل، والخطأ السياقي',
        sort_order: 1,
        lessons: [
          {
            title: 'المحاضرة 1: احتراف التناظر اللفظي وتفادي العلاقات المعكوسة',
            content: 'طريقة تحديد اتجاه العلاقة وقواعد التناظر اللفظي، مع بنك نماذج وتطبيقات عملية على أكثر من 30 علاقة شائعة.',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration_minutes: 40,
            sort_order: 1,
            is_free_preview: true
          },
          {
            title: 'المحاضرة 2: أسرار الخطأ السياقي واستيعاب المقروء السريع',
            content: 'كيفية قراءة الأسئلة قبل النص وحساب العقود والقرون وفهم الروابط المنطقية والتضاد في ثوانٍ معدودة.',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration_minutes: 45,
            sort_order: 2,
            is_free_preview: true
          }
        ]
      }
    ],
    assignment: {
      title: 'واجب الأسبوع الأول: استخراج العلاقات وتصويب الخطأ السياقي',
      description: 'قم بكتابة تحليلك وإجاباتك على الأسئلة التالية في الصندوق أدناه:\n\n1. حدد نوع واتجاه العلاقة بين: (محراب : مسجد) وهات مثالاً مشابهاً لها.\n2. استخرج الكلمة الخاطئة سياقياً مع تصويبها: "الرجل الصالح هو الذي يفرح إذا أثنى عليه الناس بالباطل ويغضب إذا نصحوه بالحق".\n3. أكمل الجملة التالية: "ليست العبرة في أن تبدأ الطريق بل في أن ......... حتى تصل إلى .........".',
      max_score: 100
    },
    file: {
      name: 'الدليل الشامل لاستراتيجيات القدرات — لفظي 2026.pdf',
      storage_key: '/docs/qiyas-verbal-guide-2026.pdf',
      mime: 'application/pdf',
      size_bytes: 48000,
      note: 'دليل مهارات القسم اللفظي الخمس وطرق كشف العلاقات الدقيقة'
    },
    extraQuestions: [
      {
        domain: 'قدرات لفظي',
        subject: 'التناظر اللفظي',
        topic: 'علاقة الاحتياج والاقتران',
        skill: 'تحديد العلاقة بدقة',
        difficulty: 3,
        text: 'سفينة : مرساة',
        options: ['سيارة : مكابح', 'طائرة : مطار', 'قطار : سكة', 'شجرة : جذور'],
        correct_index: 0,
        explanation: 'المرساة وظيفتها تثبيت وإيقاف السفينة ومنعها من الحركة، كما أن المكابح وظيفتها إيقاف السيارة وتثبيتها.'
      },
      {
        domain: 'قدرات لفظي',
        subject: 'الخطأ السياقي',
        topic: 'الحكم والوصايا',
        skill: 'اكتشاف التناقض في المعنى',
        difficulty: 3,
        text: 'من أصلح ما بينه وبين ربه، أفسد الله ما بينه وبين الناس.',
        options: ['أصلح', 'ربه', 'أفسد', 'الناس'],
        correct_index: 2,
        explanation: 'الخطأ في كلمة (أفسد)، والصواب (أصلح)؛ لأن من أصلح سريرته مع ربه أصلح الله علانيته وألقى محبته في قلوب الناس.'
      }
    ]
  },
  {
    courseCode: 'FREE-TAHSILI-2026',
    modules: [
      {
        title: 'الوحدة الأولى: المفاهيم الكبرى لسنوات الثانوي',
        description: 'المفاهيم الأكثر تكراراً في الرياضيات، الفيزياء، الكيمياء، والأحياء',
        sort_order: 1,
        lessons: [
          {
            title: 'المحاضرة 1: قوانين الرياضيات والفيزياء الأساسية',
            content: 'مراجعة مركزة لقواعد الاشتقاق، المصفوفات، المتجهات، قوانين نيوتن، وحساب الطاقة والجهد الكهربائي.',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration_minutes: 55,
            sort_order: 1,
            is_free_preview: true
          },
          {
            title: 'المحاضرة 2: ركائز الكيمياء والأحياء (الاتزان، العضوية، والوراثة)',
            content: 'شرح مبدأ لوشاتلييه، المجموعات الوظيفية العضوية، تركيب DNA و RNA والخلية والانقسامات الحيوية.',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration_minutes: 50,
            sort_order: 2,
            is_free_preview: true
          }
        ]
      }
    ],
    assignment: {
      title: 'واجب التأسيس المكثف: حل مسائل التحصيلي للمواد الأربع',
      description: 'أجب عن المسائل التالية مع توضيح خطوات الحل:\n\n1. أوجد مشتقة الدالة د(س) = 5س³ - 4س + 9 عند س = 2.\n2. احسب طاقة الحركة لجسم كتلته 4 كجم يتحرك بسرعة 5 م/ث.\n3. بيّن أثر زيادة الضغط على تفاعل غازي متزن ينتج فيه 2 مول من الغاز عن 4 مولات من المتفاعلات، مستشهداً بمبدأ لوشاتلييه.\n4. ما الفرق بين وظيفية الميتوكوندريا والريبوسومات داخل الخلية الحية؟',
      max_score: 100
    },
    file: {
      name: 'المفاهيم الكبرى للاختبار التحصيلي — علمي 2026.pdf',
      storage_key: '/docs/tahsili-core-concepts-2026.pdf',
      mime: 'application/pdf',
      size_bytes: 55000,
      note: 'الملخص المركز لقوانين ومفاهيم الرياضيات والفيزياء والكيمياء والأحياء'
    },
    extraQuestions: [
      {
        domain: 'تحصيلي',
        subject: 'الرياضيات',
        topic: 'المصفوفات والمحددات',
        skill: 'حساب قيمة المحدد',
        difficulty: 3,
        text: 'قيمة محدد المصفوفة [ [٤, ٢], [٣, ٥] ] تساوي:',
        options: ['١٤', '٢٠', '٦', '٢٦'],
        correct_index: 0,
        explanation: 'محدد المصفوفة ثنائية الأبعاد = (حاصل ضرب عناصر القطر الرئيس) - (حاصل ضرب عناصر القطر الآخر) = (٤ × ٥) - (٢ × ٣) = ٢٠ - ٦ = ١٤.'
      },
      {
        domain: 'تحصيلي',
        subject: 'الفيزياء',
        topic: 'الكهرباء والتيار',
        skill: 'تطبيق قانون أوم',
        difficulty: 3,
        text: 'مقاومة كهربائية مقدارها ٦ أوم يمر بها تيار كهربائي شدته ٣ أمبير، فما هو فرق الجهد بين طرفيها؟',
        options: ['٢ فولت', '٩ فولت', '١٨ فولت', '٣٦ فولت'],
        correct_index: 2,
        explanation: 'وفق قانون أوم: فرق الجهد (V) = شدة التيار (I) × المقاومة (R) = ٣ × ٦ = ١٨ فولت.'
      }
    ]
  }
];

async function main() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch tenant and creator
    const tenantRes = await client.query("select id from tenants where slug = 'alkhwarizmi' limit 1");
    const tenantId = tenantRes.rows[0]?.id;
    const userRes = await client.query("select id from users where tenant_id = $1 and role in ('owner', 'admin') limit 1", [tenantId]);
    const creatorId = userRes.rows[0]?.id || null;

    console.log(`📌 المعالجة للمستأجر: ${tenantId}`);

    for (const item of MODULES_AND_LESSONS) {
      console.log(`\n⏳ جارٍ إثراء محتوى دورة: ${item.courseCode}...`);

      // 1. Get Course and Group ID
      const courseRes = await client.query('select id, name from courses where tenant_id = $1 and code = $2', [tenantId, item.courseCode]);
      if (!courseRes.rows.length) {
        console.warn(`⚠️ الدورة غير موجودة: ${item.courseCode}`);
        continue;
      }
      const courseId = courseRes.rows[0].id;
      const groupRes = await client.query('select id from groups where tenant_id = $1 and course_id = $2 limit 1', [tenantId, courseId]);
      const groupId = groupRes.rows[0]?.id || null;

      // 2. Insert Modules and Lessons
      for (const m of item.modules) {
        let moduleId;
        const existingMod = await client.query('select id from modules where tenant_id = $1 and course_id = $2 and title = $3', [tenantId, courseId, m.title]);
        if (existingMod.rows.length) {
          moduleId = existingMod.rows[0].id;
        } else {
          const modRes = await client.query(
            `insert into modules (tenant_id, course_id, title, description, sort_order)
             values ($1, $2, $3, $4, $5)
             returning id`,
            [tenantId, courseId, m.title, m.description, m.sort_order]
          );
          moduleId = modRes.rows[0].id;
        }

        for (const l of m.lessons) {
          await client.query(
            `insert into lessons (tenant_id, module_id, course_id, title, content, video_url, duration_minutes, sort_order, is_free_preview)
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             on conflict do nothing`,
            [tenantId, moduleId, courseId, l.title, l.content, l.video_url, l.duration_minutes, l.sort_order, l.is_free_preview]
          );
        }
        console.log(`   ✅ تم إضافة الوحدة والدروس: ${m.title}`);
      }

      // 3. Insert Assignment
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await client.query(
        `insert into assignments (tenant_id, course_id, group_id, title, description, due_date, max_score, created_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [tenantId, courseId, groupId, item.assignment.title, item.assignment.description, dueDate.toISOString().slice(0, 10), item.assignment.max_score, creatorId]
      );
      console.log(`   ✅ تم إنشاء الواجب الدراسي: ${item.assignment.title}`);

      // 4. Insert Downloadable File (PDF)
      await client.query(
        `insert into files (tenant_id, course_id, group_id, name, mime, size_bytes, storage_key, uploaded_by, note)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (storage_key) do update set
           name = excluded.name,
           note = excluded.note`,
        [tenantId, courseId, groupId, item.file.name, item.file.mime, item.file.size_bytes, item.file.storage_key, creatorId, item.file.note]
      );
      console.log(`   ✅ تم تسجيل ملف الـ PDF بالمكتبة: ${item.file.name}`);

      // 5. Insert Extra Questions
      const examRes = await client.query('select id from exams where tenant_id = $1 and course_id = $2 limit 1', [tenantId, courseId]);
      const examId = examRes.rows[0]?.id;

      let pos = 10;
      for (const q of item.extraQuestions) {
        const qRes = await client.query(
          `insert into questions (tenant_id, course_id, domain, subject, topic, skill, difficulty, kind, text, options, correct_index, explanation, created_by, status)
           values ($1, $2, $3, $4, $5, $6, $7, 'mcq', $8, $9::jsonb, $10, $11, $12, 'active')
           returning id`,
          [
            tenantId,
            courseId,
            q.domain,
            q.subject,
            q.topic,
            q.skill,
            q.difficulty,
            q.text,
            JSON.stringify(q.options),
            q.correct_index,
            q.explanation,
            creatorId
          ]
        );
        const qId = qRes.rows[0].id;
        if (examId) {
          await client.query(
            `insert into exam_questions (exam_id, question_id, position)
             values ($1, $2, $3)
             on conflict do nothing`,
            [examId, qId, pos++]
          );
        }
      }
      console.log(`   ✅ تم إضافة أسئلة تدريب إضافية وربطها بالامتحان وبنك الأسئلة.`);
    }

    await client.query('COMMIT');
    console.log('\n==========================================================');
    console.log('🎉 تم إضافة المحتوى الشامل (دروس + فيديوهات + واجبات + ملفات PDF + أسئلة) بنجاح!');
    console.log('==========================================================');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ حدث خطأ أثناء إضافة المحتوى:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
