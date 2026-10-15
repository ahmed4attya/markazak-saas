'use client';

import { BookMarked } from 'lucide-react';
import Shell from '@/components/Shell';

export default function Lessons() {
  return (
    <Shell title="الدروس" subtitle="دروس الدورات المنشورة للطلاب">
      <div className="panel p-10 text-center">
        <BookMarked size={40} className="mx-auto text-[color:var(--gold)] mb-3" />
        <h3 className="font-extrabold text-lg mb-1">لا دروس منشورة بعد</h3>
        <p className="text-sm text-[color:var(--muted)] max-w-md mx-auto leading-7">
          ستظهر هنا دروس كل دورة (نصوص، ملخصات، روابط) بمجرد إضافتها من فريق المركز —
          ويمكن حالياً استخدام مكتبة الملفات والفيديو لنشر المحتوى التعليمي.
        </p>
        <div className="flex gap-2 justify-center mt-5">
          <a href="/library" className="ghost">مكتبة الملفات</a>
          <a href="/videos" className="primary">مكتبة الفيديو</a>
        </div>
      </div>
    </Shell>
  );
}
