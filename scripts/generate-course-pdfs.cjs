// scripts/generate-course-pdfs.cjs
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const docsDir = path.join(process.cwd(), 'public', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

const PDF_PAGES = [
  {
    fileName: 'qiyas-quant-rules-2026.pdf',
    title: 'مذكرة القوانين الذهبية — قدرات كمي 2026',
    subtitle: 'شرح مبسط لقوانين الحساب والجبر والهندسة والمقارنات واستراتيجيات الحل الذهني السريع',
    color: '#f59e0b',
    sections: [
      {
        title: '1. استراتيجيات الحل الذهني السريع (توفير الوقت)',
        content: `
          <ul>
            <li><strong>طريقة التدرج المنتظم:</strong> لحساب النسب المئوية بسرعة (10%، 20%، 50%) بدون ضرب وقسمة تقليدية.</li>
            <li><strong>قاعدة التجريب الذكي للخيارات:</strong> ابدأ بالخيار المتوسط (ب أو ج) لمعرفة هل الناتج يحتاج قيمة أكبر أو أصغر.</li>
            <li><strong>استبعاد الخيارات غير المنطقية:</strong> حذف الإجابات المستحيلة هندسياً أو حسابياً قبل الشروع في التفكير.</li>
            <li><strong>الحل بالرسم التخطيطي:</strong> تمثيل الكسور والمسائل الحسابية بأشكال بصرية لسهولة الاستنتاج.</li>
          </ul>
        `
      },
      {
        title: '2. قوانين الحساب والجبر الأساسية',
        content: `
          <table class="data-table">
            <tr><th>القانون / المفهوم</th><th>الصيغة الرياضية</th><th>ملاحظة وتطبيق</th></tr>
            <tr><td>الزيادة والنقصان بنفس النسبة س%</td><td>النقصان = (س² ÷ 100)%</td><td>زيادة 20% ثم خفض 20% = نقص 4% دائماً</td></tr>
            <tr><td>المتوسط الحسابي</td><td>المجموع ÷ العدد</td><td>المجموع = المتوسط × العدد</td></tr>
            <tr><td>ضرب الأسس ذات الأساس الموحد</td><td>س^أ × س^ب = س^(أ+ب)</td><td>تُجمع الأسس في الضرب وتُطرح في القسمة</td></tr>
            <tr><td>قوة القوة (رفع الأس لأس)</td><td>(س^أ)^ب = س^(أ×ب)</td><td>تُضرب الأسس ببعضها</td></tr>
            <tr><td>المتطابقة الشهيرة: فرق بين مربعين</td><td>س² - ص² = (س - ص)(س + ص)</td><td>تستخدم لتبسيط الكسور الجبرية الكبيرة</td></tr>
          </table>
        `
      },
      {
        title: '3. قوانين الهندسة والمثلثات والزوايا',
        content: `
          <ul>
            <li><strong>مجموع زوايا المثلث:</strong> 180 درجة، والزاوية الخارجية تساوي مجموع الزاويتين الداخليتين البعيدتين.</li>
            <li><strong>المثلث القائم الشهير (فيثاغورس):</strong> أطوال أضلاعه (3، 4، 5) أو مضاعفاتها (6، 8، 10) وكذلك (5، 12، 13).</li>
            <li><strong>المثلث 30-60:</strong> الضلع المقابل للزاوية 30° يساوي نصف طول الوتر، والضلع المقابل لـ 60° = (الوتر ÷ 2) × جذر 3.</li>
            <li><strong>الدائرة:</strong> المحيط = 2 × ط × نق | المساحة = ط × نق². (ط تقريباً 3.14 أو 22/7).</li>
            <li><strong>مجموع زوايا الشكل الرباعي:</strong> 360 درجة، ومجموع زوايا المضلع المنتظم = (ن - 2) × 180.</li>
          </ul>
        `
      },
      {
        title: '4. قوانين السرعة والمسافة والحركة',
        content: `
          <table class="data-table">
            <tr><th>الحالة</th><th>القانون</th><th>مثال</th></tr>
            <tr><td>حركة في اتجاهين متعاكسين</td><td>الزمن = المسافة ÷ (السرعة الأولى + السرعة الثانية)</td><td>سيارتان تنطلقان مبتعدتين</td></tr>
            <tr><td>حركة في نفس الاتجاه (لحاق)</td><td>الزمن = فارق المسافة ÷ (فارق السرعتين)</td><td>سيارة تطارد سيارة أخرى</td></tr>
            <tr><td>السرعة المتوسطة</td><td>(2 × س1 × س2) ÷ (س1 + س2)</td><td>عند قطع نفس المسافة ذهاباً وإياباً</td></tr>
          </table>
        `
      },
      {
        title: '5. استراتيجيات أسئلة المقارنات',
        content: `
          <ul>
            <li><strong>الخيارات الثابتة:</strong> (أ) الأولى أكبر | (ب) الثانية أكبر | (ج) القيمتان متساويتان | (د) المعطيات غير كافية.</li>
            <li><strong>قاعدة التعويض:</strong> إذا كانت المتغيرات غير محددة (موجبة/سالبة/كسور)، جرّب أرقاماً مختلفة (0، 1، -1، 1/2)؛ فإذا تغيرت النتيجة يكون الجواب فوراً (د).</li>
            <li><strong>حذف المتشابهات:</strong> احذف القيم المشتركة من الطرفين قبل المقارنة للوصول لأبسط شكل ممكن.</li>
          </ul>
        `
      }
    ]
  },
  {
    fileName: 'qiyas-verbal-guide-2026.pdf',
    title: 'الدليل الشامل لاستراتيجيات القدرات — لفظي 2026',
    subtitle: 'قواعد التناظر اللفظي وإكمال الجمل والخطأ السياقي واستيعاب المقروء والارتباط والاختلاف',
    color: '#3b82f6',
    sections: [
      {
        title: '1. مهارة التناظر اللفظي (العلاقات بين المفردات)',
        content: `
          <ul>
            <li><strong>تحديد الاتجاه أولاً:</strong> هل العلاقة من اليمين لليسار أم العكس؟ (انتبه للعلاقة المقلوبة فهي الفخ الأكثر تكراراً).</li>
            <li><strong>أشهر أنواع العلاقات:</strong>
              <ul>
                <li><strong>علاقة الجزء بالكل:</strong> صفحة : كتاب | غرفة : منزل.</li>
                <li><strong>علاقة الاحتياج والاقتران:</strong> رئة : تنفس | قلب : ضخ.</li>
                <li><strong>علاقة سبب ونتيجة:</strong> فيروس : مرض | إهمال : رسوب.</li>
                <li><strong>علاقة تدرج وزمانية:</strong> شبل : أسد | فجر : ضحى.</li>
                <li><strong>علاقة مكانية أو فئوية:</strong> نمر : غابة | تفاح : برتقال (فواكه).</li>
              </ul>
            </li>
          </ul>
        `
      },
      {
        title: '2. مهارة إكمال الجمل (سياق المعنى والمفاتيح الدلالية)',
        content: `
          <p>تعتمد على تحديد الروابط اللغوية التي تحدد اتجاه المعنى في الجملة:</p>
          <ul>
            <li><strong>روابط التوافق (المعنى يسير في نفس الاتجاه):</strong> (وكذلك، وأيضاً، مما أدى إلى، كما أن).</li>
            <li><strong>روابط التناقض والاستدراك (المعنى ينقلب للعكس):</strong> (ولكن، غير أن، على الرغم من، بالرغم، بينما، إلا أن).</li>
            <li><strong>نصيحة ذهبية:</strong> جرّب الكلمة الأولى في الفراغ الأول أولاً؛ إذا لم تستقم مع المعنى، استبعد الخيار مباشرة دون قراءة الكلمة الثانية.</li>
          </ul>
        `
      },
      {
        title: '3. مهارة الخطأ السياقي (اكتشاف الكلمة المفسدة للمعنى)',
        content: `
          <ul>
            <li>الجملة في الأصل عبارة عن حكمة أو مثل مشهور أو حقيقة علمية تم تغيير كلمة واحدة فيها لتفسد المعنى.</li>
            <li><strong>الكلمات المستهدفة:</strong> غالباً ما تكون كلمة لها ضد مباشر (زاد / نقص، كبير / صغير، نافع / ضار، حسن / سيء).</li>
            <li><strong>قاعدة ذهبية:</strong> لا تبحث عن خطأ إملائي أو نحوي؛ الخطأ دائماً دلالي في المعنى فقط.</li>
            <li><strong>مثال:</strong> "من زاد حياؤه ذهب سروره وهان على الناس" ➔ الخطأ في (حياؤه) والصواب (وقاحته أو كِبره).</li>
          </ul>
        `
      },
      {
        title: '4. مهارة استيعاب المقروء (قراءة النصوص السريعة)',
        content: `
          <table class="data-table">
            <tr><th>الخطوة الاستراتيجية</th><th>الهدف</th></tr>
            <tr><td>1. قراءة الأسئلة قبل قراءة النص</td><td>لتحديد الكلمات المفتاحية في ثوانٍ والبحث عنها مباشرة أثناء القراءة</td></tr>
            <tr><td>2. فهم علاقات الجمل</td><td>السبب والنتيجة، التأكيد، التوضيح، والتفصيل بعد الإجمال</td></tr>
            <tr><td>3. حساب القرون والعقود</td><td>القرن = 100 سنة (العام 1948 = القرن 20). العقد = 10 سنوات (1948 = العقد الخامس)</td></tr>
            <tr><td>4. الفكرة الرئيسة مقابل الأفكار الجزئية</td><td>الفكرة الرئيسة تشمل النص كاملاً ولا تقتصر على فقرة واحدة فقط</td></tr>
          </table>
        `
      },
      {
        title: '5. مهارة الارتباط والاختلاف (المفردة الشاذة)',
        content: `
          <p>ابحث عن الرابط المفهومي أو الفئوي المشترك الذي يجمع 3 كلمات معاً، واستخرج الكلمة الرابعة التي تخرج عن هذا التصنيف (مثل: 3 عواصم ومدنية ليست عاصمة، 3 نباتات وحيوان، 3 معارك نبوية ومعركة في عصر لاحق).</p>
        `
      }
    ]
  },
  {
    fileName: 'tahsili-core-concepts-2026.pdf',
    title: 'المفاهيم الكبرى للاختبار التحصيلي — علمي 2026',
    subtitle: 'خلاصة القوانين والمفاهيم الأكثر تكراراً في مواد (الرياضيات، الفيزياء، الكيمياء، والأحياء)',
    color: '#e11d48',
    sections: [
      {
        title: '1. ركائز الرياضيات (سنوات الثانوي 1 - 2 - 3)',
        content: `
          <ul>
            <li><strong>المصفوفات والمحددات:</strong> محدد المصفوفة ثنائية الأبعاد |A| = (أ × د) - (ب × ج).</li>
            <li><strong>النظير الضربي للمصفوفة:</strong> يوجد فقط إذا كان المحدد لا يساوي صفراً.</li>
            <li><strong>حساب المثلثات:</strong> جا²(س) + جتا²(س) = 1 | ظل(س) = جا(س) ÷ جتا(س).</li>
            <li><strong>الاشتقاق:</strong> مشتقة س^ن = ن × س^(ن-1)، ومشتقة الثابت = صفر. ميل المماس = المشتقة الأولى.</li>
            <li><strong>المتجهات:</strong> حاصل الضرب الداخلي (القياسي) للمتجهين المتعامدين يساوي صفراً دائماً (u · v = 0).</li>
          </ul>
        `
      },
      {
        title: '2. ركائز الفيزياء (قوانين الميكانيكا والكهرباء والنووية)',
        content: `
          <table class="data-table">
            <tr><th>المفهوم</th><th>القانون</th><th>الوحدة</th></tr>
            <tr><td>القانون الثاني لنيوتن</td><td>القوة (F) = الكتلة (m) × التسارع (a)</td><td>نيوتن (N)</td></tr>
            <tr><td>طاقة الوضع الجذبية</td><td>PE = m × g × h (الكتلة × التسارع × الارتفاع)</td><td>جول (J)</td></tr>
            <tr><td>طاقة الحركة</td><td>KE = 0.5 × m × v² (نصف الكتلة × مربع السرعة)</td><td>جول (J)</td></tr>
            <tr><td>قانون أوم الكهربائي</td><td>فرق الجهد (V) = التيار (I) × المقاومة (R)</td><td>فولت (V)</td></tr>
            <tr><td>القدرة الكهربائية</td><td>P = V × I = I² × R</td><td>واط (W)</td></tr>
          </table>
        `
      },
      {
        title: '3. ركائز الكيمياء (الاتزان، الجدول الدوري، والعضوية)',
        content: `
          <ul>
            <li><strong>مبدأ لوشاتلييه:</strong> إذا أثّر مؤثر خارجي (حرارة، ضغط، تركيز) على نظام متزن، فإن النظام ينزاح في الاتجاه الذي يقلل من تأثير هذا المؤثر.</li>
            <li><strong>العامل المحفز:</strong> يزيد من سرعة التفاعل بخفض طاقة التنشيط دون أن يُستهلك في التفاعل.</li>
            <li><strong>الرقم الهيدروجيني pH:</strong> الأحماض (pH < 7)، القواعد (pH > 7)، المتعادل (pH = 7). مجموع pH + pOH = 14.</li>
            <li><strong>الكيمياء العضوية:</strong>
              <ul>
                <li>الألكانات: روابط أحادية مشبعة (CnH2n+2).</li>
                <li>الألكينات: روابط ثنائية غير مشبعة (CnH2n).</li>
                <li>المجموعات الوظيفية: الكحولات (-OH)، الأحماض الكربوكسيلية (-COOH)، الأمينات (-NH2).</li>
              </ul>
            </li>
          </ul>
        `
      },
      {
        title: '4. ركائز الأحياء (الخلية، الوراثة، وأجهزة الجسم)',
        content: `
          <ul>
            <li><strong>الفرق بين DNA و RNA:</strong>
              <ul>
                <li>DNA: شريط مزدوج، يحتوي القواعد (A, T, C, G)، السكر ريبوز منقوص الأكسجين.</li>
                <li>RNA: شريط مفرد، يحتوي قاعدة <strong>اليوراسيل (U)</strong> بدلاً من الثايمين، السكر ريبوز عادي.</li>
              </ul>
            </li>
            <li><strong>انقسام الخلية:</strong> المتساوي (للنمو وتعويض التالف وينتج خليتين متطابقتين)، المنصف (لتكوين الأمشاج وينتج 4 خلايا أحادية العدد الكروموسومي 1n).</li>
            <li><strong>أجهزة الجسم:</strong> الغشاء البلازمي ينظم النفاذية الاختيارية، الميتوكوندريا مصنع طاقة الخلية (ATP)، الريبوسومات مسؤولة عن بناء البروتين.</li>
          </ul>
        `
      }
    ]
  }
];

function buildHtml(item) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${item.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #1e293b;
      padding: 40px;
      line-height: 1.7;
      font-size: 13.5px;
    }
    .header {
      border-bottom: 3px solid ${item.color};
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      background: ${item.color}18;
      color: ${item.color};
      border: 1px solid ${item.color}44;
      padding: 4px 14px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 12px;
      display: inline-block;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .subtitle {
      color: #64748b;
      font-size: 13px;
    }
    .platform-brand {
      text-align: left;
    }
    .platform-brand .brand-name {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .platform-brand .edition {
      font-size: 11px;
      color: #94a3b8;
    }
    .section-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 20px;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: ${item.color};
      margin-bottom: 12px;
      border-right: 4px solid ${item.color};
      padding-right: 10px;
    }
    ul {
      padding-right: 22px;
    }
    li {
      margin-bottom: 8px;
    }
    strong {
      color: #0f172a;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }
    .data-table th, .data-table td {
      border: 1px solid #e2e8f0;
      padding: 9px 14px;
      text-align: right;
      font-size: 12.5px;
    }
    .data-table th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    .footer {
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">مبادرة التعلم الذاتي 2026 — مجاناً 100%</span>
      <h1>${item.title}</h1>
      <p class="subtitle">${item.subtitle}</p>
    </div>
    <div class="platform-brand">
      <div class="brand-name">منصة الخوارزمي</div>
      <div class="edition">Al-Khwarizmi Platform &copy; 2026</div>
    </div>
  </div>

  ${item.sections.map(s => `
    <div class="section-card">
      <div class="section-title">${s.title}</div>
      ${s.content}
    </div>
  `).join('')}

  <div class="footer">
    <span>منصة الخوارزمي — قدراتك واختباراتك بإتقان رقمي</span>
    <span>مذكرة دراسية مخصصة للطلاب والطالبات — غير مخصصة لإعادة البيع</span>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('🚀 بدء توليد ملفات الـ PDF الرسمية للمسارات الثلاثة...');
  const browser = await chromium.launch({ headless: true });

  for (const item of PDF_PAGES) {
    const page = await browser.newPage();
    const html = buildHtml(item);
    await page.setContent(html, { waitUntil: 'load' });
    const targetPath = path.join(docsDir, item.fileName);
    await page.pdf({
      path: targetPath,
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      printBackground: true
    });
    console.log(`✅ تم إنشاء الملف بنجاح: ${targetPath}`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 انتهى إنشاء جميع ملفات PDF بنجاح!');
}

main().catch(err => {
  console.error('❌ حدث خطأ:', err);
  process.exit(1);
});
