'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Download, FileText } from 'lucide-react';
import Shell from '@/components/Shell';

type FileRow = { id: string; name: string; mime: string | null; size_bytes: number | string; storage_key: string; created_at: string };
type Course = { id: string; name: string };

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt';

export default function Library() {
  const [rows, setRows] = useState<FileRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const qs = courseId ? '?courseId=' + encodeURIComponent(courseId) : '';
    const r = await fetch('/api/files' + qs);
    if (r.ok) setRows(await r.json()); else setError('تعذر تحميل المكتبة');
  }, [courseId]);

  useEffect(() => { load().catch(() => setError('تعذر تحميل المكتبة')); }, [load]);

  useEffect(() => {
    fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setCourses(d); }).catch(() => {});
  }, []);

  async function onPick(f: File | null) {
    if (!f) return;
    setBusy(true); setError(''); setOk('');
    try {
      if (f.size > 100 * 1024 * 1024) throw new Error('حجم الملف يتجاوز الحد 100MB');

      const formData = new FormData();
      formData.append('file', f);
      if (courseId) formData.append('courseId', courseId);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'فشل رفع الملف');
      }

      setOk('تم رفع الملف بنجاح');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الرفع');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onDelete(row: FileRow) {
    if (!window.confirm('حذف الملف: ' + row.name + '؟')) return;
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/files/' + row.id, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'فشل الحذف'); }
      setOk('تم حذف الملف');
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

  return (
    <Shell title="مكتبة الملفات" subtitle="رفع وتنظيم ملفات الدورات والمجموعات">
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
              <Upload size={16} /> رفع ملف
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}

        <div className="panel tablePanel">
          <div className="tableWrap">
            <table className="dataTable">
              <thead>
                <tr><th>الاسم</th><th>الحجم</th><th>النوع</th><th>أضيف في</th><th></th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td className="tableEmpty" colSpan={5}>لا توجد ملفات بعد — ابدأ برفع أول ملف</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><span className="inline-flex items-center gap-2"><FileText size={16} className="text-[color:var(--blue)]" /> {r.name}</span></td>
                    <td>{fmtSize(r.size_bytes)}</td>
                    <td>{(r.mime || '').split('/').pop() || '-'}</td>
                    <td>{new Date(r.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <a href={'/api/files/' + r.id + '/download'} download target="_blank" rel="noopener noreferrer" className="ghost !min-h-0 py-1.5 px-3"><Download size={14} /> تحميل</a>
                        <button onClick={() => onDelete(r)} disabled={busy} className="ghost !min-h-0 py-1.5 px-3"><Trash2 size={14} /> حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
