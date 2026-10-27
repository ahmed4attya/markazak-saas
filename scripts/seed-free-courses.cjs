// scripts/seed-free-courses.cjs - Comprehensive Seed for the 3 Free Foundation Courses
const { Pool } = require('pg');
const fs = require('fs');

function getDatabaseUrl() {
  const content = fs.readFileSync('.env.prod', 'utf8');
  const match = content.match(/DATABASE_URL=([^\r\n]+)/);
  let url = match[1].trim();
  if (url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);
  return url;
}

const COURSES_DATA = [
  {
    code: 'FREE-QUANT-2026',
    name: 'دورة التأسيس الشامل في القدرات — القسم الكمي (تعلم ذاتي)',
    category: 'قدرات عامة (كمي)',
    duration_hours: 24,
    price: 0.0,
    description: 'دورة مجانية متكاملة ومصممة بنظام التعلم الذاتي الذكي لتغطية جميع ركائز ومفاهيم القسم الكمي في اختبار القدرات العامة (محوسب وورقي). تتضمن الدورة شروحات استراتيجيات الحل الذهني السريع بدون استخدام الورقة والقلم، تدريباً مكثفاً على تجميعات ومحاكيات قياس الحديثة، وتحليلاً ذكياً للأخطاء (لماذا أخطأت وكيف تتفادى الفخاخ الحسابية).',
    objectives: '1. إتقان مهارات الحساب الأساسية والكسور والنسب المئوية والأسس والجذور.\n2. استيعاب قوانين الهندسة والمثلثات والدوائر والزوايا والأشكال المركبة.\n3. التمكن التام من أسئلة المقارنات (القيمة الأولى / القيمة الثانية / متساويتان / المعطيات غير كافية).\n4. تحليل وتفسير الرسوم البيانية والجداول الإحصائية والاحتمالات.\n5. سرعة الإجابة وتدريب الذاكرة على حل السؤال في أقل من 50 ثانية.',
    requirements: 'جهاز جوال أو حاسوب متصل بالإنترنت، ورغبة جادة في تحقيق درجة 90+ في اختبار القدرات.',
    examTitle: 'اختبار محاكاة التأسيس — قدرات كمي (مجاني)',
    examDuration: 20,
    questions: [
      {
        domain: 'قدرات كمي',
        subject: 'الحساب والجبر',
        topic: 'التناسب والنسب المئوية',
        skill: 'الحل الذهني السريع',
        difficulty: 3,
        text: 'إذا زاد راتب موظف بنسبة ٢٠٪ ثم خُفض بنسبة ٢٠٪، فما هي النسبة المئوية للتغير في راتبه النهائي مقارنة براتبه الأصلي؟',
        options: ['لم يتغير (٠٪)', 'نقص بنسبة ٤٪', 'زاد بنسبة ٤٪', 'نقص بنسبة ٢٪'],
        correct_index: 1,
        explanation: 'قاعدة ذهبية: عند زيادة أي مقدار بنسبة س٪ ثم تخفيضه بنفس النسبة س٪، النتيجة دائماً نقصان بمقدار (س² ÷ ١٠٠)٪. هنا: (٢٠ × ٢٠) ÷ ١٠٠ = ٤٠٠ ÷ ١٠٠ = ٤٪ نقصان. مثال عددي: لو كان الراتب ١٠٠ زاد إلى ١٢٠، خفض ٢٠٪ من ١٢٠ (أي ٢٤) يصبح ٩٦، وهو نقصان ٤٪.'
      },
      {
        domain: 'قدرات كمي',
        subject: 'الهندسة والزوايا',
        topic: 'المثلثات والأشكال الرباعية',
        skill: 'حساب قياسات الزوايا المجهولة',
        difficulty: 3,
        text: 'مثلث متطابق الضلعين إحدى زوايا قاعدته تساوي ٥٠ درجة، فما قياس زاوية الرأس؟',
        options: ['٥٠ درجة', '٦٥ درجة', '٨٠ درجة', '١٠٠ درجة'],
        correct_index: 2,
        explanation: 'في المثلث المتطابق الضلعين، زاويتا القاعدة متطابقتان. بما أن إحدى زوايا القاعدة ٥٠°، فإن زاوية القاعدة الأخرى ٥٠°. مجموع زوايا المثلث = ١٨٠°. إذن زاوية الرأس = ١٨٠ - (٥٠ + ٥٠) = ١٨٠ - ١٠٠ = ٨٠ درجة.'
      },
      {
        domain: 'قدرات كمي',
        subject: 'المقارنات',
        topic: 'المقادير الجبرية والأسس',
        skill: 'المقارنة دون حساب نواتج كبيرة',
        difficulty: 4,
        text: 'قارن بين: القيمة الأولى (٢ أس ٥٥) ، والقيمة الثانية (٣ أس ٣٣)',
        options: ['القيمة الأولى أكبر', 'القيمة الثانية أكبر', 'القيمتان متساويتان', 'المعطيات غير كافية'],
        correct_index: 0,
        explanation: 'نبحث عن العامل المشترك الأكبر للأسين (٥٥ و ٣٣) وهو ١١. نكتب القيمة الأولى: (٢⁵)¹¹ = (٣٢)¹¹. ونكتب القيمة الثانية: (٣³)¹¹ = (٢٧)¹¹. وبما أن الأساس ٣٢ أكبر من ٢٧ وكلاهما مرفوعان للأس ١١، إذن القيمة الأولى (٢ أس ٥٥) أكبر من القيمة الثانية.'
      },
      {
        domain: 'قدرات كمي',
        subject: 'السرعة والمسافة والزمن',
        topic: 'حركة الأجسام في اتجاهين متعاكسين',
        skill: 'استخدام قانون زمن الالتقاء',
        difficulty: 3,
        text: 'انطلقت سيارتان في اتجاهين متعاكسين من نفس النقطة، الأولى بسرعة ٨٠ كم/ساعة والثانية بسرعة ٧٠ كم/ساعة. بعد كم ساعة تصبح المسافة بينهما ٤٥٠ كم؟',
        options: ['ساعتان', '٣ ساعات', '٤ ساعات', '٥ ساعات'],
        correct_index: 1,
        explanation: 'عند حركة جسمين في اتجاهين متعاكسين، نجمع السرعتين لحساب سرعة الابتعاد: ٨٠ + ٧٠ = ١٥٠ كم/ساعة. الزمن = المسافة ÷ مجموع السرعتين = ٤٥٠ ÷ ١٥٠ = ٣ ساعات.'
      },
      {
        domain: 'قدرات كمي',
        subject: 'الإحصاء والاحتمالات',
        topic: 'المتوسط الحسابي',
        skill: 'استنتاج المجموع من المتوسط',
        difficulty: 3,
        text: 'متوسط درجات خمسة طلاب في اختبار هو ٨٤، وإذا استبعدنا درجة أحدهم أصبح متوسط درجات الباقين ٨٥. فما هي درجة الطالب المستبعد؟',
        options: ['٧٨', '٨٠', '٨٢', '٨٤'],
        correct_index: 1,
        explanation: 'مجموع درجات الطلاب الخمسة = المتوسط × العدد = ٨٤ × ٥ = ٤٢٠. مجموع درجات الطلاب الأربعة المتبقين = ٨٥ × ٤ = ٣٤٠. درجة الطالب المستبعد = ٤٢٠ - ٣٤٠ = ٨٠ درجة.'
      }
    ]
  },
  {
    code: 'FREE-VERBAL-2026',
    name: 'دورة التأسيس الشامل في القدرات — القسم اللفظي (تعلم ذاتي)',
    category: 'قدرات عامة (لفظي)',
    duration_hours: 20,
    price: 0.0,
    description: 'مسار تأسيسي مجاني في مهارات القسم اللفظي لاختبار القدرات العامة، يشمل تغطية معمقة لكافة أنماط الأسئلة الخمسة مع استراتيجيات كشف العلاقات الدقيقة والتفرقة بين المعاني المتقاربة. يتميز المسار ببنك أسئلة نصوص وقراءات استيعاب مقروء محاكية ونماذج تجميعات قياس المحدثة.',
    objectives: '1. احتراف مهارة التناظر اللفظي وتحديد نوع واتجاه العلاقة بدقة وتفادي العلاقات المقلوبة.\n2. التمكن من مهارة إكمال الجمل بالاعتماد على سياق المعنى والمفاتيح الدلالية والروابط.\n3. استكشاف الكلمة التي تفسد المعنى العام في أسئلة الخطأ السياقي.\n4. استيعاب المقروء وقراءة الأسئلة أولاً واستخراج الإجابات من الفقرات في وقت قياسي.\n5. مهارة الارتباط والاختلاف وتحديد الشاذ من بين الخيارات الأربعة.',
    requirements: 'لا تشترط أي خلفية سابقة — تبدأ الدورة من الصفر حتى مستوى التميز في القدرات.',
    examTitle: 'اختبار محاكاة التأسيس — قدرات لفظي (مجاني)',
    examDuration: 20,
    questions: [
      {
        domain: 'قدرات لفظي',
        subject: 'التناظر اللفظي',
        topic: 'علاقة الجزء بالكل والاقتران',
        skill: 'تحديد الاتجاه ونوع العلاقة',
        difficulty: 3,
        text: 'رئة : تنفس',
        options: ['قلب : ضخ', 'عين : عمى', 'يد : كتابة', 'رجل : حذاء'],
        correct_index: 0,
        explanation: 'العلاقة: وظيفة العضو الأساسية التي خُلق لها في الجسم؛ فالرئة وظيفتها التنفس، والقلب وظيفته ضخ الدم. أما اليد فالكتابة إحدى استخداماتها المكتسبة وليست وظيفتها الفسيولوجية الوحيدة.'
      },
      {
        domain: 'قدرات لفظي',
        subject: 'إكمال الجمل',
        topic: 'السياق الإيجابي والسلبي',
        skill: 'البحث عن الروابط والتناقض',
        difficulty: 3,
        text: 'حسن الخلق يذيب ......... كما تذيب الشمس .........',
        options: ['السيئات — الجليد', 'العداوة — السحاب', 'الحسد — الحديد', 'الذنوب — الظلام'],
        correct_index: 0,
        explanation: 'حكمة مأثورة: "إن حسن الخلق ليذيب الخطايا والسيئات كما تذيب الشمس الجليد". الشمس تذيب الجليد مادياً وحسن الخلق يذيب السيئات معنوياً.'
      },
      {
        domain: 'قدرات لفظي',
        subject: 'الخطأ السياقي',
        topic: 'التناقض في الحكم والأمثال',
        skill: 'اكتشاف الكلمة المعاكسة للمعنى العام',
        difficulty: 4,
        text: 'من زاد حياؤه ذهب سروره وهان على الناس واستخفوا به.',
        options: ['زاد', 'حياؤه', 'سروره', 'استخفوا'],
        correct_index: 1,
        explanation: 'الخطأ في كلمة (حياؤه)، والصواب (كِبره) أو (فجوره) أو (وقاحته)؛ لأن الحياء شعبة من شعب الإيمان ويجلب الوقار والمحبة ولا يجعل صاحبه يهان أو يُستخف به.'
      },
      {
        domain: 'قدرات لفظي',
        subject: 'استيعاب المقروء',
        topic: 'النصوص العلمية والبيئية',
        skill: 'استنتاج العلاقة بين الفقرات',
        difficulty: 3,
        text: 'النص: "تعتبر أشجار المانجروف خط الدفاع الأول للسواحل البحرية؛ إذ تعمل جذورها المتشابكة على تثبيت التربة ومقاومة التيارات وأمواج الأعاصير العاتية، مما يحمي المدن الساحلية من التآكل والغرق." — يستنتج من النص أن وظيفة جذور المانجروف بالنسبة للسواحل هي:',
        options: ['غذائية للمدن', 'وقائية وحمائية', 'اقتصادية وسياحية', 'تجميلية وترفيهية'],
        correct_index: 1,
        explanation: 'العبارة "خط الدفاع الأول... وتعمل على تثبيت التربة ومقاومة التيارات... مما يحمي المدن" تدل بشكل قطعي وصريح على أن الوظيفة وقائية وحمائية.'
      },
      {
        domain: 'قدرات لفظي',
        subject: 'الارتباط والاختلاف',
        topic: 'التصنيف المفهومي',
        skill: 'استخراج المفردة الشاذة',
        difficulty: 2,
        text: 'حدد المفردة الشاذة من بين الكلمات التالية:',
        options: ['اليرموك', 'حطين', 'عين جالوت', 'أحد'],
        correct_index: 3,
        explanation: 'المفردة الشاذة هي (أحد)؛ لأنها غزوة نبوية في عهد النبي صلى الله عليه وسلم، بينما (اليرموك، حطين، عين جالوت) معارك إسلامية فاصلة وقعت في العصور الإسلامية اللاحقة (الراشدي، الأيوبي، المملوكي).'
      }
    ]
  },
  {
    code: 'FREE-TAHSILI-2026',
    name: 'دورة التأسيس المكثف للاختبار التحصيلي — علمي (تعلم ذاتي)',
    category: 'التحصيلي (علمي)',
    duration_hours: 30,
    price: 0.0,
    description: 'دورة تحضيرية شاملة ومجانية تجمع أهم القوانين والمفاهيم الكبرى الأكثر تكراراً في تجميعات اختبار التحصيلي العلمي (المواد الأربع: الرياضيات، الفيزياء، الكيمياء، والأحياء) لسنوات المرحلة الثانوية الثلاث (أول، ثاني، ثالث ثانوي). مصممة بنمط التعلم الذاتي والتدريب بالاختبارات القصيرة لكل مادة.',
    objectives: '1. رياضيات: الدوال، النهايات والاشتقاق، المصفوفات، المتجهات، وحساب المثلثات.\n2. فيزياء: قوانين نيوتن، الكهرباء والمغناطيسية، الموجات والصوت والضوء، والفيزياء الحديثة والنووية.\n3. كيمياء: الجدول الدوري، الروابط الكيميائية، الحسابات الكيميائية والاتزان، والكيمياء العضوية.\n4. أحياء: التراكيب الخلوية، الوراثة والحمض النووي (DNA)، أجهزة جسم الإنسان، والتصنيف البيئي.\n5. اجتياز اختبارات محاكية تحاكي توزيع الأسئلة الحقيقي لمركز قياس.',
    requirements: 'طالب/ـة في المرحلة الثانوية يستعد للاختبار التحصيلي.',
    examTitle: 'اختبار المفاهيم الكبرى — التحصيلي العلمي (مجاني)',
    examDuration: 25,
    questions: [
      {
        domain: 'تحصيلي',
        subject: 'الرياضيات',
        topic: 'التفاضل والتكامل',
        skill: 'إيجاد مشتقة الدوال كثيرة الحدود',
        difficulty: 3,
        text: 'إذا كانت د(س) = ٣س² - ٥س + ٧ ، فإن المشتقة دَ(٢) تساوي:',
        options: ['٥', '٧', '٩', '١١'],
        correct_index: 1,
        explanation: 'المشتقة دَ(س) = ٢ × ٣ س¹ - ٥ = ٦س - ٥. بالتعويض عن س = ٢ : دَ(٢) = ٦(٢) - ٥ = ١٢ - ٥ = ٧.'
      },
      {
        domain: 'تحصيلي',
        subject: 'الفيزياء',
        topic: 'الميكانيكا والطاقة',
        skill: 'قانون حفظ الطاقة وحساب طاقة الوضع',
        difficulty: 3,
        text: 'جسم كتلته ٥ كجم موضوع على ارتفاع ٤ أمتار عن سطح الأرض، فما هي طاقة وضعه الجذبية؟ (تسارع الجاذبية = ٩.٨ م/ث²)',
        options: ['١٩٦ جول', '٩٨ جول', '١٤٠ جول', '٢٤٥ جول'],
        correct_index: 0,
        explanation: 'طاقة الوضع (PE) = الكتلة (m) × تسارع الجاذبية (g) × الارتفاع (h) = ٥ × ٩.٨ × ٤ = ٢٠ × ٩.٨ = ١٩٦ جول.'
      },
      {
        domain: 'تحصيلي',
        subject: 'الكيمياء',
        topic: 'الكيمياء الحركية والاتزان',
        skill: 'تحديد العوامل المؤثرة في سرعة التفاعل',
        difficulty: 3,
        text: 'أي العوامل التالية يقلل من طاقة التنشيط ويزيد من سرعة التفاعل الكيميائي دون أن يُستهلك؟',
        options: ['زيادة درجة الحرارة', 'زيادة التركيز', 'إضافة العامل المحفز (الإنزيم/المحفز)', 'زيادة الضغط'],
        correct_index: 2,
        explanation: 'العامل المحفز (Catalyst) يعمل على تقليل طاقة التنشيط للتفاعل مما يزيد من سرعة حدوثه، وهو لا يُستهلك أثناء التفاعل ولا يغير من موضع الاتزان الكيميائي.'
      },
      {
        domain: 'تحصيلي',
        subject: 'الأحياء',
        topic: 'الوراثة والخلية',
        skill: 'تحديد خصائص الأحماض النووية وبناء البروتين',
        difficulty: 3,
        text: 'القاعدة النيتروجينية التي توجد في الحمض النووي الريبوزي (RNA) ولا توجد في (DNA) هي:',
        options: ['الثايمين (Thymine)', 'اليوراسيل (Uracil)', 'الأدينين (Adenine)', 'الجوانين (Guanine)'],
        correct_index: 1,
        explanation: 'اليوراسيل (Uracil) يحل محل الثايمين في جزيء RNA ويرتبط مع الأدينين، بينما الثايمين يوجد حصراً في DNA.'
      }
    ]
  }
];

async function main() {
  const pool = new Pool({ connectionString: getDatabaseUrl() });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Fetch the primary tenant (سنتر الخوارزمي)
    const tenantRes = await client.query("select id, name from tenants where slug = 'alkhwarizmi' limit 1");
    let tenantId = tenantRes.rows[0]?.id;
    if (!tenantId) {
      const anyTenant = await client.query('select id from tenants order by created_at asc limit 1');
      tenantId = anyTenant.rows[0]?.id;
    }

    console.log('📌 Tenant ID:', tenantId);

    // Fetch an admin/owner user to be the creator
    const userRes = await client.query("select id from users where tenant_id = $1 and role in ('owner', 'admin') limit 1", [tenantId]);
    const creatorId = userRes.rows[0]?.id || null;

    for (const item of COURSES_DATA) {
      console.log(`\n⏳ جارٍ معالجة: ${item.name} (${item.code})...`);

      // 1. Insert or update course
      const courseRes = await client.query(
        `insert into courses (tenant_id, name, code, category, duration_hours, capacity, price, description, objectives, requirements, status)
         values ($1, $2, $3, $4, $5, 10000, $6, $7, $8, $9, 'active')
         on conflict (tenant_id, code) do update set
           name = excluded.name,
           category = excluded.category,
           duration_hours = excluded.duration_hours,
           price = excluded.price,
           description = excluded.description,
           objectives = excluded.objectives,
           requirements = excluded.requirements,
           status = 'active',
           updated_at = now()
         returning id, name, code`,
        [
          tenantId,
          item.name,
          item.code,
          item.category,
          item.duration_hours,
          item.price,
          item.description,
          item.objectives,
          item.requirements,
        ]
      );
      const course = courseRes.rows[0];
      console.log(`   ✅ تم تجهيز الدورة: ${course.name} [ID: ${course.id}]`);

      // 2. Insert or update open self-paced Group
      const groupRes = await client.query(
        `insert into groups (tenant_id, course_id, name, capacity, mode, status)
         values ($1, $2, 'دفعة التعلم الذاتي 2026 — مسار مفتوح', 10000, 'online', 'active')
         returning id`,
        [tenantId, course.id]
      );
      const groupId = groupRes.rows[0]?.id;
      console.log(`   ✅ تم إنشاء مجموعة التعلم الذاتي المفتوحة [ID: ${groupId}]`);

      // 3. Create or update Exam
      const examRes = await client.query(
        `insert into exams (tenant_id, course_id, title, kind, duration_minutes, randomize, created_by)
         values ($1, $2, $3, 'practice', $4, true, $5)
         returning id`,
        [tenantId, course.id, item.examTitle, item.examDuration, creatorId]
      );
      const examId = examRes.rows[0].id;
      console.log(`   ✅ تم إنشاء الامتحان المحاكي: ${item.examTitle} [ID: ${examId}]`);

      // 4. Insert Questions and link to exam
      let pos = 1;
      for (const q of item.questions) {
        const qRes = await client.query(
          `insert into questions (tenant_id, course_id, domain, subject, topic, skill, difficulty, kind, text, options, correct_index, explanation, created_by, status)
           values ($1, $2, $3, $4, $5, $6, $7, 'mcq', $8, $9::jsonb, $10, $11, $12, 'active')
           returning id`,
          [
            tenantId,
            course.id,
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

        // Link question to exam
        await client.query(
          `insert into exam_questions (exam_id, question_id, position)
           values ($1, $2, $3)
           on conflict (exam_id, question_id) do nothing`,
          [examId, qId, pos++]
        );
      }
      console.log(`   ✅ تم ربط ${item.questions.length} أسئلة استراتيجية بالامتحان وبنك الأسئلة.`);
    }

    await client.query('COMMIT');
    console.log('\n==========================================================');
    console.log('🎉 تم إنشاء وحفظ الدورات التأسيسية المجانية الثلاث بكامل تفاصيلها بنجاح!');
    console.log('==========================================================');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ أثناء الإضافة:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
