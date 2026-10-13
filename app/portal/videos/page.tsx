'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

type VRow = { id: string; title: string; student_name?: string };

export default function PortalVideos() {
  const [rows, setRows] = useState<VRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/videos').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link href="/portal" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
        <h1 className="font-extrabold mr-4">الفيديوهات</h1>
      </header>
      <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-2">
        {error && <div className="error">{error}</div>}
        {rows.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد فيديوهات بعد</div>}
        {rows.map((v) => (
          <div key={v.id} className="bento-card p-4 flex items-center justify-between">
            <span>{v.title}{v.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {v.student_name}</span> : null}</span>
            <a href={'/api/videos/' + v.id + '/stream'} target="_blank" rel="noreferrer" className="primary !min-h-0 py-1.5 px-3 text-xs"><Play size={14} className="inline-block ml-1" /> تشغيل</a>
          </div>
        ))}
      </main>
    </div>
  );
}