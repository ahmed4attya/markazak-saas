'use client';

import { useEffect, useState } from 'react';

export default function PortalCourses() {
  const [rows, setRows] = useState<{ id: string; name: string; category: string | null; student_name?: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
  }, []);

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-3 pt-6">
      <h1 className="text-xl font-extrabold mb-1">دوراتي</h1>
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
  );
}
