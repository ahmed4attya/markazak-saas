'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';

type NRow = { id: string; title: string; body: string | null; read_at: string | null; created_at: string };

export default function Notifications() {
  const [rows, setRows] = useState<NRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/notifications').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setRows(d.rows || []); }).catch(() => setError('تعذر التحميل'));
  }, []);

  function markAll() {
    fetch('/api/notifications', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'read-all' }) }).then(() => {
      setRows((p) => p.map((x) => ({ ...x, read_at: x.read_at || new Date().toISOString() })));
    }).catch(() => {});
  }

  return (
    <Shell title="الإشعارات" subtitle="إشعاراتك داخل المنصة">
      <div className="space-y-4">
        <button onClick={markAll} className="ghost !min-h-0 py-1.5 px-3 text-xs">تعليم الكل كمقروء</button>
        {error && <div className="error">{error}</div>}
        {rows.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد إشعارات بعد</div>}
        {rows.map((r) => (
          <div key={r.id} className={'bento-card p-4 ' + (r.read_at ? '' : 'border-[color:var(--gold-border)]')}>
            <b>{r.title}</b>
            {r.body && <p className="text-sm text-[color:var(--muted)] mt-1">{r.body}</p>}
            <div className="text-xs text-[color:var(--muted-dim)] mt-2">{new Date(r.created_at).toLocaleString('ar-EG')}</div>
          </div>
        ))}
      </div>
    </Shell>
  );
}