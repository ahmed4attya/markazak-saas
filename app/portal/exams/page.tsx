'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardList } from 'lucide-react';

type ERow = {
  id: string;
  title: string;
  kind: string;
  duration_minutes: number | null;
  course_name: string;
  question_count: number;
  done_count?: number;
  student_name?: string;
};

export default function PortalExams() {
  const [rows, setRows] = useState<ERow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/exams')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setRows(d); })
      .catch(() => setError('تعذر التحميل'));
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link href="/portal" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
        <h1 className="font-extrabold mr-4">امتحاناتي</h1>
      </header>
      <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-3">
        {error && <div className="error">{error}</div>}
        {rows.length === 0 && <div className="bento-card p-8 text-center text-[color:var(--muted)]">لا توجد امتحانات متاحة بعد</div>}
        {rows.map((e) => (
          <div key={e.id + (e.student_name || '')} className="bento-card p-5 flex items-center justify-between gap-4">
            <div>
              <b>{e.title}</b>
              <div className="text-xs text-[color:var(--muted)] mt-1">
                {e.course_name}{e.student_name ? ' — ' + e.student_name : ''}
                {' · '}{e.question_count} سؤال
                {e.duration_minutes ? ' · ' + e.duration_minutes + ' دقيقة' : ''}
                {' · '}{e.kind === 'simulation' ? 'محاكاة' : 'تدريب'}
                {(e.done_count || 0) > 0 ? ' · أُنجز ' + e.done_count + '×' : ''}
              </div>
            </div>
            {e.student_name ? (
              <span className="badge pending">للمتابعة</span>
            ) : (
              <Link href={'/portal/exams/' + e.id} className="primary !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1">
                <ClipboardList size={14} /> {(e.done_count || 0) > 0 ? 'إعادة' : 'ابدأ'}
              </Link>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
