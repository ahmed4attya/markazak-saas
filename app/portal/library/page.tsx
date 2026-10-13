'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Video, Download } from 'lucide-react';

type VRow = { id: string; title: string; student_name?: string };
type FRow = { id: string; name: string; size_bytes: number | string; storage_key: string; student_name?: string };

function fmt(b: number | string): string {
  const n = Number(b) || 0;
  if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
  if (n >= 1024) return (n / 1024).toFixed(0) + ' KB';
  return n + ' B';
}

export default function PortalLibrary() {
  const [videos, setVideos] = useState<VRow[]>([]);
  const [files, setFiles] = useState<FRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/learner/videos').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setVideos(d); }).catch(() => {});
    fetch('/api/learner/files').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setFiles(d); }).catch(() => {});
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link href="/portal" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
        <h1 className="font-extrabold mr-4">المكتبة</h1>
      </header>
      <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-8">
        {error && <div className="error">{error}</div>}
        <section>
          <h2 className="font-extrabold mb-3 flex items-center gap-2"><Video size={18} className="text-[color:var(--gold)]" /> الفيديوهات ({videos.length})</h2>
          {videos.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد فيديوهات بعد</div>}
          <div className="space-y-2">
            {videos.map((v) => (
              <div key={v.id} className="bento-card p-4 flex items-center justify-between">
                <span>{v.title}{v.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {v.student_name}</span> : null}</span>
                <a href={'/api/videos/' + v.id + '/stream'} target="_blank" rel="noreferrer" className="primary !min-h-0 py-1.5 px-3 text-xs">تشغيل</a>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-extrabold mb-3 flex items-center gap-2"><Download size={18} className="text-[color:var(--blue)]" /> الملفات ({files.length})</h2>
          {files.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد ملفات بعد</div>}
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="bento-card p-4 flex items-center justify-between">
                <span>{f.name} <span className="text-xs text-[color:var(--muted)]">({fmt(f.size_bytes)})</span></span>
                <a href={f.storage_key} target="_blank" rel="noreferrer" className="ghost !min-h-0 py-1.5 px-3 text-xs">تحميل</a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}