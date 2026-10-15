'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Video, FolderOpen, CalendarCheck, Bell, ClipboardList, NotebookPen, TrendingUp } from 'lucide-react';

export default function Portal() {
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/learner/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setMe(d); }).catch(() => {});
    fetch('/api/learner/notifications').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) setUnread(d.unread || 0); }).catch(() => {});
  }, []);

  const cards = [
    { href: '/portal/courses', label: 'دوراتي', Icon: BookOpen, color: 'text-[color:var(--blue)]' },
    { href: '/portal/exams', label: 'امتحاناتي', Icon: ClipboardList, color: 'text-[color:var(--rose)]' },
    { href: '/portal/assignments', label: 'واجباتي', Icon: NotebookPen, color: 'text-[color:var(--violet)]' },
    { href: '/portal/results', label: 'نتائجي', Icon: TrendingUp, color: 'text-[color:var(--success)]' },
    { href: '/portal/library', label: 'المكتبة', Icon: FolderOpen, color: 'text-[color:var(--success)]' },
    { href: '/portal/videos', label: 'الفيديوهات', Icon: Video, color: 'text-[color:var(--gold)]' },
    { href: '/portal/attendance', label: 'حضوري', Icon: CalendarCheck, color: 'text-[color:var(--indigo)]' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f17] flex items-center justify-center text-lg font-bold">خ</div>
          <span className="font-bold">بوابة سنتر الخوارزمي</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/portal/notifications" className="relative p-2 text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] rounded-full">
            <Bell size={20} />
            {unread > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>}
          </Link>
        </div>
      </header>
      <main className="p-4 lg:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2">{me?.name ? `أهلاً ${me.name}` : 'أهلاً بك'}</h1>
        <p className="text-[color:var(--muted)] mb-8">{me?.role === 'guardian' ? 'متابعة أبنائك من مكان واحد' : 'مساحة التعلم الخاصة بك'}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="bento-card p-6 flex flex-col items-center gap-3 hover:border-[color:var(--gold-border)] transition-colors">
              <c.Icon size={32} className={c.color} />
              <span className="font-bold">{c.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}