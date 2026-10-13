'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PortalAttendance() {
  const [rows, setRows] = useState<{ attendance_date: string; status: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/attendance').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
  }, []);

  const LABELS: Record<string, string> = { present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'معذور' };
  const COLORS: Record<string, string> = { present: 'success', absent: 'unpaid', late: 'partial', excused: 'excused' };

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link href="/portal" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
        <h1 className="font-extrabold mr-4">حضوري</h1>
      </header>
      <main className="p-4 lg:p-8 max-w-2xl mx-auto space-y-2">
        {error && <div className="error">{error}</div>}
        {rows.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد سجلات حضور بعد</div>}
        {rows.map((r, i) => (
          <div key={i} className="bento-card p-4 flex items-center justify-between">
            <span>{new Date(r.attendance_date).toLocaleDateString('ar-EG')}</span>
            <span className={'badge ' + (COLORS[r.status] || 'pending')}>{LABELS[r.status] || r.status}</span>
          </div>
        ))}
      </main>
    </div>
  );
}