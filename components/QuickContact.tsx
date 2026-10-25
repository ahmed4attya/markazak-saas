'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Send, X, Clock, Wallet } from 'lucide-react';

type Late = { invoice_id: string; number: string; amount: string; due_date: string; student_name: string | null; student_phone: string | null };
type Absent = { id: string; attendance_date: string; student_name: string | null; student_phone: string | null };

export default function QuickContact({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'late' | 'absent'>('late');
  const [late, setLate] = useState<Late[]>([]);
  const [absent, setAbsent] = useState<Absent[]>([]);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!open) return;
    setError(''); setOkMsg('');
    const r = await fetch('/api/quick-contact');
    if (r.status === 403) { setError('التواصل السريع متاح للمدير فقط'); return; }
    if (!r.ok) { setError('تعذر تحميل البيانات'); return; }
    const d = await r.json();
    setLate(d.late || []); setAbsent(d.absent || []);
  }, [open]);

  useEffect(() => { load(); }, [load]);

  function waLink(phone: string | null, msg: string): string {
    const digits = (phone || '').replace(/[^0-9]/g, '');
    const intl = digits.startsWith('0') ? '966' + digits.slice(1) : digits;
    return 'https://wa.me/' + intl + '?text=' + encodeURIComponent(msg);
  }

  async function sendNotification(title: string, body: string, payload: Record<string, unknown>) {
    setBusy(true); setError(''); setOkMsg('');
    try {
      const r = await fetch('/api/quick-contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, body, ...payload }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error((j as { error?: string }).error || 'فشل الإرسال'); }
      const j = await r.json();
      setOkMsg('تم إرسال الإشعار' + (j.sent > 1 ? ' (' + j.sent + ' مستلم)' : ''));
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل الإرسال'); }
    finally { setBusy(false); }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(2,6,16,0.5)] backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[color:var(--surface)] border-l border-[color:var(--border)] shadow-3 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[color:var(--border)]">
          <h2 className="text-lg font-extrabold text-[color:var(--text)]">التواصل السريع</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[color:var(--surface-2)] text-[color:var(--muted)]"><X size={18} /></button>
        </div>
        <p className="px-5 pt-4 text-xs text-[color:var(--muted)]">تذكيرات شخصية ورسالة واحدة تفتح المحادثة بنص جاهز يمكنك تعديله قبل الإرسال.</p>

        <div className="flex gap-2 p-4">
          <button onClick={() => setTab('late')} className={(tab === 'late' ? 'primary' : 'ghost') + ' !min-h-0 py-2 px-4 flex-1'}><Wallet size={14} className="inline-block ml-1" /> متأخر السداد ({late.length})</button>
          <button onClick={() => setTab('absent')} className={(tab === 'absent' ? 'primary' : 'ghost') + ' !min-h-0 py-2 px-4 flex-1'}><Clock size={14} className="inline-block ml-1" /> غائبو اليوم ({absent.length})</button>
        </div>

        {error && <div className="error mx-5">{error}</div>}
        {okMsg && <div className="success mx-5">{okMsg}</div>}

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
          {tab === 'late' && late.length === 0 && <p className="text-sm text-[color:var(--muted)] text-center py-8">لا توجد فواتير متأخرة — رصيدك نظيف ✓</p>}
          {tab === 'late' && late.map((l) => (
            <div key={l.invoice_id} className="panel !p-4 space-y-3">
              <div className="flex items-center justify-between">
                <b className="text-[color:var(--text)]">{l.student_name || 'بدون طالب'}</b>
                <span className="badge unpaid">{l.amount} ريال</span>
              </div>
              <div className="text-xs text-[color:var(--muted)]">فاتورة {l.number} — استحقاق {new Date(l.due_date).toLocaleDateString('ar-EG')}</div>
              <div className="flex items-center gap-2">
                {l.student_phone && (
                  <a target="_blank" rel="noreferrer" href={waLink(l.student_phone, 'السلام عليكم ' + (l.student_name || '') + '، نود تذكيركم بوجود فاتورة مستحقة رقم ' + l.number + ' بمبلغ ' + l.amount + ' ريال — ' + 'سنتر الخوارزمي')}
                    className="ghost !min-h-0 py-2 px-3 text-xs flex-1 justify-center"><MessageCircle size={14} className="inline-block ml-1" /> واتساب</a>
                )}
                              <div className="flex items-center gap-2">
                {l.student_phone && (
                  <a target="_blank" rel="noreferrer" href={waLink(l.student_phone, 'السلام عليكم ' + (l.student_name || '') + '، نود تذكيركم بوجود فاتورة مستحقة رقم ' + l.number + ' بمبلغ ' + l.amount + ' ريال — ' + 'سنتر الخوارزمي')}
                    className="ghost !min-h-0 py-2 px-3 text-xs flex-1 justify-center"><MessageCircle size={14} className="inline-block ml-1" /> واتساب</a>
                )}
              </div>
              </div>
            </div>
          ))}
          {tab === 'absent' && absent.length === 0 && <p className="text-sm text-[color:var(--muted)] text-center py-8">لا يوجد غائبون اليوم ✓</p>}
          {tab === 'absent' && absent.length > 0 && (
            <div className="panel !p-4 space-y-3">
              <div className="flex items-center justify-between">
                <b className="text-[color:var(--text)]">غائبو اليوم</b>
                <span className="badge pending">{absent.length}</span>
              </div>
              <div className="text-xs text-[color:var(--muted)]">{absent.map((a) => a.student_name).filter(Boolean).join('، ')}</div>
              <div className="flex items-center gap-2">
                {absent[0]?.student_phone && (
                  <a target="_blank" rel="noreferrer" href={waLink(absent[0].student_phone, 'السلام عليكم، نود إعلامكم بغياب اليوم لـ ' + (absent[0].student_name || '') + ' — سنتر الخوارزمي')}
                    className="ghost !min-h-0 py-2 px-3 text-xs flex-1 justify-center"><MessageCircle size={14} className="inline-block ml-1" /> واتساب (الأول)</a>
                )}
                <button disabled={busy} onClick={() => sendNotification('غياب اليوم', 'سُجّل غياب اليوم — يرجى التواصل مع الإدارة.', { toAllAbsent: true })}
                  className="primary !min-h-0 py-2 px-3 text-xs flex-1 justify-center"><Send size={14} className="inline-block ml-1" /> إشعار للجميع</button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}