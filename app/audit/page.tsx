'use client';

import { useCallback, useEffect, useState } from 'react';
import Shell from '@/components/Shell';

type AuditRow = { id: string; action: string; entity: string | null; entity_id: string | null; metadata: unknown; created_at: string; user_name: string | null };

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'الكل' },
  { key: 'student', label: 'طالب' },
  { key: 'course', label: 'دورة' },
  { key: 'group', label: 'مجموعة' },
  { key: 'invoice', label: 'فاتورة' },
  { key: 'user', label: 'مستخدم' },
  { key: 'subscription', label: 'اشتراك' },
  { key: 'file', label: 'ملف' },
  { key: 'video', label: 'فيديو' },
];

const ACTION_LABELS: Record<string, string> = {
  login: 'تسجيل دخول', logout: 'تسجيل خروج',
  'file.upload': 'رفع ملف', 'file.delete': 'حذف ملف',
  'video.upload': 'رفع فيديو', 'video.delete': 'حذف فيديو', 'video.play': 'تشغيل فيديو',
};

const ENTITY_LABELS: Record<string, string> = {
  student: 'طالب', course: 'دورة', group: 'مجموعة', invoice: 'فاتورة',
  user: 'مستخدم', subscription: 'اشتراك', file: 'ملف', video: 'فيديو', enrollment: 'تسجيل',
};

export default function Audit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams();
      if (entity) qs.set('entity', entity);
      qs.set('page', String(page));
      const r = await fetch('/api/audit?' + qs.toString());
      if (r.status === 403) { setError('سجل التدقيق متاح للمدير فقط'); return; }
      if (!r.ok) throw new Error('failed');
      const d = await r.json();
      setRows(d.rows || []); setTotal(d.total || 0);
    } catch { setError('تعذر تحميل السجل'); }
    finally { setLoading(false); }
  }, [entity, page]);

  useEffect(() => { load(); }, [load]);

  function fmtDate(s: string) {
    const d = new Date(s);
    return d.toLocaleDateString('ar-EG') + ' · ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <Shell title="سجل التدقيق" subtitle={'كل الإجراءات المهمة مسجلة باسم من قام بها — ' + total + ' حدث'}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button key={t.key || 'all'} onClick={() => { setEntity(t.key); setPage(1); }}
              className={(entity === t.key ? 'primary' : 'ghost') + ' !min-h-0 py-1.5 px-4 rounded-full'}>
              {t.label}
            </button>
          ))}
        </div>
        {error && <div className="error">{error}</div>}
        <div className="panel tablePanel">
          <div className="tableWrap">
            <table className="dataTable">
              <thead><tr><th>الوقت</th><th>المستخدم</th><th>الإجراء</th><th>الكيان</th><th>تفاصيل</th></tr></thead>
              <tbody>
                {rows.length === 0 && (<tr><td className="tableEmpty" colSpan={5}>{loading ? 'جارٍ التحميل...' : 'لا توجد أحداث في هذا التصنيف بعد'}</td></tr>)}
                {rows.map((r) => (
                  <tr key={String(r.id)}>
                    <td>{fmtDate(r.created_at)}</td>
                    <td>{r.user_name || '—'}</td>
                    <td>{ACTION_LABELS[r.action] || r.action}</td>
                    <td>{r.entity ? (ENTITY_LABELS[r.entity] || r.entity) : '—'}</td>
                    <td>{r.metadata ? JSON.stringify(r.metadata).slice(0, 80) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[color:var(--muted)]">صفحة {page} من {pages}</span>
          <div className="flex items-center gap-2">
            <button className="ghost !min-h-0 py-1.5 px-4" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>السابق</button>
            <button className="ghost !min-h-0 py-1.5 px-4" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>التالي</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}