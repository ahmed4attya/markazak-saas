'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Upload, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import Shell from '@/components/Shell';

type Detail = { line: number; status: 'imported' | 'review' | 'rejected'; reason: string };
type Report = { total: number; imported: number; review: number; rejected: number; details: Detail[] };
type Me = { role: string };

const SAMPLE = [
  'domain,subject,topic,skill,difficulty,text,option1,option2,option3,option4,correct_index,explanation',
  'quant,رياضيات,النسب المئوية,الحساب الذهني,2,كم يساوي 15% من 200؟,20,30,35,40,1,15% من 200 = 30',
  'verbal,لغة عربية,الاظداد,المفردات,3,ما مضاد كلمة اليقظة؟,السهر,الغفلة,الانتباه,الصحيان,1,ضد اليقظة الغفلة',
].join('\n');

export default function QuestionsImport() {
  const [me, setMe] = useState<Me | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [courseId, setCourseId] = useState('');
  const [defaultDomain, setDefaultDomain] = useState('quant');
  const [csv, setCsv] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { setMe(d); setMeLoading(false); }).catch(() => setMeLoading(false));
    fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setCourses(d); }).catch(() => {});
  }, []);

  async function doImport() {
    setBusy(true); setError(''); setReport(null);
    try {
      const r = await fetch('/api/questions/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv, courseId: courseId || null, defaultDomain }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'تعذر الاستيراد');
      setReport(j as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر الاستيراد');
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setCsv(text);
  }

  if (meLoading) {
    return <Shell title="استيراد أسئلة CSV" subtitle="جاري التحقق..."><p>جاري التحميل...</p></Shell>;
  }
  if (!me || !(me.role === 'owner' || me.role === 'manager' || me.role === 'admin' || me.role === 'teacher')) {
    return <Shell title="استيراد أسئلة CSV" subtitle=""><div className="error">غير مصرح</div></Shell>;
  }

  return (
    <Shell title="استيراد أسئلة CSV" subtitle="تعمير بنك القدرات والتحصيلي من ملف — الأسئلة المشتبهة باعتمادها على أشكال تُدرج للمُراجعة تلقائياً">
      <div className="space-y-6">
        <div className="panel p-4 text-sm leading-7 text-[color:var(--muted)]">
          <b className="text-[color:var(--text)]">الصيغة:</b> السطر الأول ترويسة أعمدة (إنجليزية أو عربية):
          domain، subject، topic، skill، difficulty، text، option1..option6، correct_index، explanation.
          رقم الإجابة <b>يبدأ من 0</b> (أول خيار = 0). الترميز UTF-8. الحد 500 سطر للدفعة.
          أي سطر يذكر (شكل/رسم/مدرج/بياني) يُستورد بحالة <span className="badge pending">مراجعة</span> ولا يظهر للطلاب حتى تُفعّله.
        </div>

        <div className="panel space-y-4">
          <div className="formGrid">
            <label>الدورة (اختياري)
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">أسئلة عامة (مدير فقط)</option>
                {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </label>
            <label>المجال الافتراضي (إن غاب العمود)
              <select value={defaultDomain} onChange={(e) => setDefaultDomain(e.target.value)}>
                <option value="quant">قدرات كمي</option>
                <option value="verbal">قدرات لفظي</option>
                <option value="achievement">تحصيلي</option>
              </select>
            </label>
          </div>
          <label className="block">ملف CSV
            <input type="file" accept=".csv,.txt" onChange={onFile} />
          </label>
          <label className="block">أو الصق المحتوى مباشرة
            <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} placeholder={SAMPLE} />
          </label>
          <div className="flex gap-2 items-center">
            <button className="primary" disabled={busy || !csv.trim()} onClick={doImport}>
              <Upload size={16} /> {busy ? 'جاري الاستيراد...' : 'تحليل واستيراد'}
            </button>
            <button className="ghost" onClick={() => setCsv(SAMPLE)}>تعبئة نموذج</button>
            <Link href="/questions" className="ghost">رجوع لبنك الأسئلة</Link>
          </div>
          {error && <div className="error">{error}</div>}
        </div>

        {report && (
          <div className="panel space-y-4">
            <h3 className="font-extrabold">تقرير الاستيراد</h3>
            <div className="flex flex-wrap gap-3">
              <span className="badge success"><CheckCircle2 size={13} className="inline" /> مستورد نشط: {report.imported}</span>
              <span className="badge pending"><AlertTriangle size={13} className="inline" /> للمُراجعة: {report.review}</span>
              <span className="badge unpaid"><XCircle size={13} className="inline" /> مرفوض: {report.rejected}</span>
              <span className="badge">الإجمالي: {report.total}</span>
            </div>
            <div className="tableWrap">
              <table className="dataTable">
                <thead><tr><th>السطر</th><th>الحالة</th><th>السبب</th></tr></thead>
                <tbody>
                  {report.details.map((d) => (
                    <tr key={d.line}>
                      <td>{d.line}</td>
                      <td><span className={'badge ' + (d.status === 'imported' ? 'success' : d.status === 'review' ? 'pending' : 'unpaid')}>{d.status === 'imported' ? 'نشط' : d.status === 'review' ? 'مراجعة' : 'مرفوض'}</span></td>
                      <td>{d.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
