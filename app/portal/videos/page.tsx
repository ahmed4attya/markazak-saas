'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import PortalVideoPlayer from '@/components/PortalVideoPlayer';

type VRow = { id: string; title: string; student_name?: string };

export default function PortalVideos() {
  const [rows, setRows] = useState<VRow[]>([]);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState<VRow | null>(null);

  useEffect(() => {
    fetch('/api/learner/videos').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError('تعذر التحميل'));
  }, []);

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-2 pt-6">
      <h1 className="text-xl font-extrabold mb-1">الفيديوهات</h1>
      {error && <div className="error">{error}</div>}
      {rows.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد فيديوهات بعد</div>}
      {rows.map((v) => (
        <div key={v.id} className="bento-card p-4 flex items-center justify-between">
          <span>{v.title}{v.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {v.student_name}</span> : null}</span>
          <button onClick={() => setPlaying(v)} className="primary !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"><Play size={13} /> تشغيل</button>
        </div>
      ))}

      {playing && (
        <PortalVideoPlayer videoId={playing.id} title={playing.title} onClose={() => setPlaying(null)} />
      )}
    </main>
  );
}
