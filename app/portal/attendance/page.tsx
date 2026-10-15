'use client';

import { useEffect, useState } from 'react';

export default function PortalAttendance() {
  const [rows, setRows] = useState<{ attendance_date: string; status: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/attendance').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
  }, []);

  const LABELS: Record<string, string> = { present: 'حاضر', absent: 'غائب', late: 'متأخر', excused: 'معذور' };
  const COLORS: Record<string, string> = { present: 'success', absent: 'unpaid', late: 'partial', excused: 'excused' };

  return (
    <main className="p-4 lg:p-8 max-w-2xl mx-auto space-y-2 pt-6">
      <h1 className="text-xl font-extrabold mb-1">حضوري</h1>
      {error && <div className="error">{error}</div>}
      {rows.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد سجلات حضور بعد</div>}
      {rows.map((r, i) => (
        <div key={i} className="bento-card p-4 flex items-center justify-between">
          <span>{new Date(r.attendance_date).toLocaleDateString('ar-EG')}</span>
          <span className={'badge ' + (COLORS[r.status] || 'pending')}>{LABELS[r.status] || r.status}</span>
        </div>
      ))}
    </main>
  );
}
