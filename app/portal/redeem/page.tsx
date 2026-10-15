'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, KeyRound } from 'lucide-react';

export default function PortalRedeem() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ courseName: string; subEnd: string; resumed: boolean } | null>(null);

  async function redeem() {
    setBusy(true); setError(''); setResult(null);
    try {
      const r = await fetch('/api/learner/redeem', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'تعذر التفعيل');
      setResult(j);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر التفعيل'); }
    finally { setBusy(false); }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] font-['IBM_Plex_Sans_Arabic']">
      <header className="h-14 flex items-center px-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <Link href="/portal" className="flex items-center gap-2 text-[color:var(--muted)] hover:text-[color:var(--gold)]"><ArrowRight size={18} /> رجوع</Link>
        <h1 className="font-extrabold mr-4">تفعيل كود</h1>
      </header>
      <main className="p-4 lg:p-8 max-w-xl mx-auto">
        {result ? (
          <div className="bento-card p-8 text-center space-y-3">
            <KeyRound size={40} className="text-[color:var(--success)] mx-auto" />
            <p className="font-extrabold text-lg">تم التفعيل بنجاح!</p>
            <p>الدورة: <b>{result.courseName}</b></p>
            <p className="text-[color:var(--muted)] text-sm">اشتراكك فعال حتى <b>{new Date(result.subEnd).toLocaleDateString('ar-EG')}</b>{result.resumed ? ' (تمت الإضافة لاشتراكك الحالي)' : ''}</p>
            <div className="flex gap-2 justify-center pt-2">
              <Link href="/portal/courses" className="primary">دوراتي</Link>
              <button className="ghost" onClick={() => { setResult(null); setCode(''); }}>تفعيل كود آخر</button>
            </div>
          </div>
        ) : (
          <div className="bento-card p-6 space-y-4">
            <p className="text-sm text-[color:var(--muted)]">أدخل كود التفعيل الذي حصلت عليه من المركز لفتح الدورة أو تمديد اشتراكك.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="MKZ-XXXX-XXXX"
              dir="ltr"
              className="w-full text-center font-mono text-lg tracking-widest"
            />
            {error && <div className="error">{error}</div>}
            <button className="primary w-full" disabled={busy || !code.trim()} onClick={redeem}>
              <KeyRound size={16} className="inline ml-1" /> {busy ? 'جاري التحقق...' : 'تفعيل'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
