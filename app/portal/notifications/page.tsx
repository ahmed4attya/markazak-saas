'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type NRow = { id: string; title: string; body: string | null; read_at: string | null; created_at: string };

export default function PortalNotifications() {
  const [rows, setRows] = useState<NRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/notifications').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setRows(d.rows || []); }).catch(() => setError('تعذر التحميل'));
  }, []);

  function markAll() {
    fetch('/api/learner/notifications', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'read-all' }) }).then(() => {
      setRows((p) => p.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
    }).catch(() => {});
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center justify-between px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
          <h1 className="font-extrabold">الإشعارات</h1>
        </div>
        <button onClick={markAll} className="ghost !min-h-0 py-1.5 px-3 text-xs">تعليم الكل كمقروء</button>
      </header>
      <main className="p-4 lg:p-8 max-w-2xl mx-auto space-y-2">
        {rows.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد إشعارات بعد</div>}
        {rows.map((r) => (
          <div key={r.id} className={'bento-card p-4 ' + (r.read_at ? '' : 'border-[color:var(--gold-border)]')}>
            <b>{r.title}</b>
            {r.body && <p className="text-sm text-[color:var(--muted)] mt-1">{r.body}</p>}
            <div className="text-xs text-[color:var(--muted-dim)] mt-2">{new Date(r.created_at).toLocaleString('ar-EG')}</div>
          </div>
        ))}
      </main>
    </div>
  );
}