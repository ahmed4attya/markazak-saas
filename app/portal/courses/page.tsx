'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PortalCourses() {
  const [rows, setRows] = useState<{ id: string; name: string; category: string | null; student_name?: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link href="/portal" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
        <h1 className="font-extrabold mr-4">دوراتي</h1>
      </header>
      <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-3">
        {error && <div className="error">{error}</div>}
        {rows.length === 0 && <div className="bento-card p-8 text-center text-[color:var(--muted)]">لا توجد دورات مسجلة بعد</div>}
        {rows.map((r) => (
          <div key={r.id} className="bento-card p-5 flex items-center justify-between">
            <div>
              <b>{r.name}</b>
              <div className="text-xs text-[color:var(--muted)] mt-1">{r.student_name ? 'الطالب: ' + r.student_name : ''} {r.category ? '· ' + r.category : ''}</div>
            </div>
            <span className="badge paid">نشطة</span>
          </div>
        ))}
      </main>
    </div>
  );
}
