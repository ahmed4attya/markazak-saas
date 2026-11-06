import Link from "next/link";

export const metadata = { title: "الشروط والأحكام | منصة الخوارزمي" };

export default function Terms() {
  return (
    <main className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-14">
        <Link href="/" className="text-sm text-[color:var(--muted)] hover:text-[color:var(--text)] transition-colors">← العودة للرئيسية</Link>
        <h1 className="mt-4 text-3xl font-extrabold">الشروط والأحكام</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">آخر تحديث: أكتوبر 2026</p>
        <div className="mt-8 space-y-5 leading-relaxed">
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">الاتفاق على الشروط</h2>
            <p>باستخدامك منصة الخوارزمي أو إنشاء حساب داخلها فأنت توافق على هذه الشروط. إن كنت تستخدم المنصة نيابة عن مركز تدريب فأنت تؤكد أنك مخوّل بالتعاقد عنه، وأن بيانات المركز التي تُدخلها صحيحة ومسؤوليتك.</p>
          </section>
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">الحسابات والأدوار</h2>
            <p>تمنح المنصة أدواراً معزولة الصلاحيات (مدير مركز، معلم، طالب، ولي أمر) وكل دور يرى ما يخصه فقط. أنت مسؤول عن سرية بيانات دخولك وعن ما يتم من خلال حسابك، ويجب إبلاغنا فوراً عن أي استخدام غير مصرح.</p>
          </section>
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">المحتوى والملكية الفكرية</h2>
            <p>تحتفظ المراكز بملكية محتواها التعليمي (الأسئلة، الملفات، الفيديوهات)، وتحتفظ المنصة بملكية برمجياتها وهويتها وعلامتها. يمنع نسخ أو إعادة بيع أي جزء من المنصة أو محاولة تجاوز آليات الحماية مثل العزل والعلامة المائية وحدود الاستخدام.</p>
          </section>
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">الاشتراكات والدفع</h2>
            <p>تُقدَّم الخطط باختصالات واضحة في صفحة الأسعار، وما وُسم بأنه مبدئي يبقى غير نهائي حتى إقراره. تُحصَّل الاشتراكات وفق الدورة المختارة ويمكن لمدير المركز مراجعة فواتيره من داخل النظام.</p>
          </section>
          <section className="bento-card p-6">
            <h2 className="font-bold mb-2">حدود المسؤولية والتعديلات</h2>
            <p>تُقدَّم الخدمة كما هي مع جهود مستمرة للتطور والصيانة، ولا تضمن المنصة نتائج تعليمية محددة لطالب أو مركز. قد تُحدَّث هذه الشروط، ويُعتمد تاريخ آخر تحديث المعروض أعلاه مرجعاً لأي نسخة سابقة.</p>
          </section>
        </div>
      </div>
    </main>
  );
}