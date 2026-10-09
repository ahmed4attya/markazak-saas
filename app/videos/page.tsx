'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Upload, Trash2, Play, FileVideo } from 'lucide-react';
import Shell from '@/components/Shell';

type VideoRow = { id: string; title: string; mime: string | null; size_bytes: number | string; duration_seconds: number | null; storage_key: string; created_at: string };
type Course = { id: string; name: string };
type Me = { name: string; email: string; userId: string };

const ACCEPT = '.mp4,.webm,.mov,.m4v';

function Watermark({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} style={{ position: 'absolute', left: ((i % 4) * 25 + 3) + '%', top: (Math.floor(i / 4) * 33 + 10) + '%', transform: 'rotate(-18deg)', opacity: 0.4, fontSize: 12, color: '#ffffff', textShadow: '0 0 2px rgba(0,0,0,.8)', whiteSpace: 'nowrap' }}>{text}</span>
      ))}
    </div>
  );
}

export default function Videos() {
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<VideoRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const qs = courseId ? '?courseId=' + encodeURIComponent(courseId) : '';
    const r = await fetch('/api/videos' + qs);
    if (r.ok) setRows(await r.json()); else setError('تعذر تحميل مكتبة الفيديو');
  }, [courseId]);

  useEffect(() => { load().catch(() => setError('تعذر تحميل المكتبة')); }, [load]);
  useEffect(() => {
    fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setCourses(d); }).catch(() => {});
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && d.name) setMe(d); }).catch(() => {});
  }, []);

  function readDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => { const d = Math.round(v.duration); URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : null); };
        v.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        v.src = url;
      } catch { resolve(null); }
    });
  }

  async function onPick(f: File | null) {
    if (!f) return;
    setBusy(true); setError(''); setOk('');
    try {
      if (f.size > 500 * 1024 * 1024) throw new Error('حجم الفيديو يتجاوز الحد 500MB');
      const durationSeconds = await readDuration(f);
      const prep = await fetch('/api/videos/prepare', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filename: f.name, contentType: f.type, sizeBytes: f.size, courseId: courseId || null }),
      });
      if (!prep.ok) { const j = await prep.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'الملف غير مسموح'); }
      const { pathname } = (await prep.json()) as { pathname: string };
      const res = await upload(pathname, f, { access: 'public', handleUploadUrl: '/api/videos/upload' });
      const done = await fetch('/api/videos/upload-complete', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: res.url, pathname: res.pathname, title: f.name, contentType: res.contentType, sizeBytes: f.size, durationSeconds, courseId: courseId || null }),
      });
      if (!done.ok) { const j = await done.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'فشل تسجيل الفيديو'); }
      setOk('تم رفع الفيديو بنجاح');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الرفع');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onDelete(row: VideoRow) {
    if (!window.confirm('حذف الفيديو: ' + row.title + '؟')) return;
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/videos/' + row.id, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'فشل الحذف'); }
      setOk('تم حذف الفيديو');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحذف');
    } finally { setBusy(false); }
  }

  function fmtSize(n: number | string): string {
    const b = Number(n) || 0;
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024) return (b / 1024).toFixed(0) + ' KB';
    return String(b) + ' B';
  }
  function fmtDur(s: number | null): string {
    if (!s || s <= 0) return '-';
    const m = Math.floor(s / 60); const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }
  const wmText = me ? (me.name + ' — ' + me.email + ' — ' + new Date().toLocaleDateString('ar-EG')) : 'سنتر الخوارزمي';

  return (
    <Shell title="مكتبة الفيديو" subtitle="رفع وتشغيل فيديوهات الدورات بعلامة مائية ووصول محمي">
      <div className="space-y-6">
        <div className="toolbar">
          <div className="flex items-center gap-2">
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-56">
              <option value="">كل الدورات</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onPick(e.target.files ? e.target.files[0] : null)} />
            <button className="primary" disabled={busy} onClick={() => inputRef.current?.click()}>
              <Upload size={16} /> رفع فيديو
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}

        <div className="panel tablePanel">
          <div className="tableWrap">
            <table className="dataTable">
              <thead><tr><th>العنوان</th><th>الحجم</th><th>المدة</th><th>أضيف في</th><th></th></tr></thead>
              <tbody>
                {rows.length === 0 && (<tr><td className="tableEmpty" colSpan={5}>لا توجد فيديوهات بعد — ابدأ برفع أول فيديو</td></tr>)}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><span className="inline-flex items-center gap-2"><FileVideo size={16} className="text-[color:var(--blue)]" /> {r.title}</span></td>
                    <td>{fmtSize(r.size_bytes)}</td>
                    <td>{fmtDur(r.duration_seconds)}</td>
                    <td>{new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPlaying(r)} className="ghost !min-h-0 py-1.5 px-3"><Play size={14} /> تشغيل</button>
                        
                        <button onClick={() => onDelete(r)} disabled={busy} className="ghost !min-h-0 py-1.5 px-3"><Trash2 size={14} /> حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {playing && (
          <div className="modalBack" onClick={() => setPlaying(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modalHead"><h2>{playing.title}</h2><button onClick={() => setPlaying(null)}>×</button></div>
              <div style={{ position: 'relative', background: '#000' }}>
                <video src={'/api/videos/' + playing.id + '/stream'} controls autoPlay style={{ width: '100%', maxHeight: '70vh', display: 'block' }} />
                <Watermark text={wmText} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}