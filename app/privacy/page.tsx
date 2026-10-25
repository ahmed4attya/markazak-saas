import Link from "next/link";

export const metadata = { title: "سياسة الخصوصية | منصة الخوارزمي" };

export default function Privacy() {
  return (
    <main className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-14">
        <Link href="/" className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors">← العودة للرئيسية</Link>
        <h1 className="mt-4 text-3xl font-extrabold">سياسة الخصوصية</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">آخر تحديث: أكتوبر 2026</p>
        <div className="mt-8 space-y-5 leading-relaxed">
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">البيانات التي نجمعها</h2>
            <p>تُجمِع المنصة البيانات اللازمة لتشغيل الخدمة فقط: بيانات الحسابات (الاسم، البريد الإلكتروني، رقم الجوال)، السجلات الأكاديمية (الدورات، الحضور، الدرجات، محاولات الاختبارات)، وبيانات الاستخدام التقنية اللازمة للأمان مثل سجلات الدخول والتدقيق. لا نبيع بيانات المستخدمين ولا نشاركها مع أطراف ثالثة لأغراض تسويقية.</p>
          </section>
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">عزل المراكز</h2>
            <p>كل مركز تدريب مستأجر مستقل تُحصر بياناته داخل نطاق مركزه عبر عزل على مستوى الجلسات والاستعلامات؛ لا يمكن لأي مستخدم الوصول إلى بيانات مركز آخر. تُستثنى من ذلك البيانات العامة بطبيعتها مثل خطط الاشتراك المتاحة للعموم.</p>
          </section>
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">المحتوى والملفات</h2>
            <p>فيديوهات ومحتوى الدورات ملك للمركز الذي رفعها، ويُبَث محمياً بعلامة مائية تربط المشاهدة بحساب الطالب وتاريخها لردع التسريب وتمكين تتبع مصدره عند وقوعه.</p>
          </section>
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">حقوقك</h2>
            <p>يمكن لمدير المركز تصحيح بيانات حساباته أو حذفها وفق سياسات مركزه، ويمكن لولي الأمر الاطلاع على بيانات ابنه من حسابه في أي وقت. لأي استفسار يتعلق بالخصوصية، استخدم نموذج التواصل في الصفحة الرئيسية وسنعاود التواصل معك.</p>
          </section>
        </div>
      </div>
    </main>
  );
}