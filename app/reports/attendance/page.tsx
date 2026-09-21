'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Download, FileText, Calendar } from 'lucide-react';

type ReportRow = {
  student_name: string;
  student_no: string;
  present_count: string;
  total_count: string;
};

export default function AttendanceReport() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [from, setFrom] = useState(new Date().toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadReport() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/attendance?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('تعذر تحميل التقرير');
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReport(); }, []);

  function downloadCSV() {
    const headers = 'Student Name,Student No,Present,Total,Percentage\\n';
    const rows = data.map(r => {
      const p = parseInt(r.present_count);
      const t = parseInt(r.total_count);
      const perc = t > 0 ? ((p / t) * 100).toFixed(1) : '0';
      return `${r.student_name},${r.student_no},${p},${t},${perc}%`;
    }).join('\\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${from}_to_${to}.csv`);
    link.click();
  }

  return (
    <Shell title="تقارير الحضور" subtitle="ملخص نسبة حضور الطلاب خلال فترة محددة">
      <div className="space-y-6" dir="rtl">
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">من تاريخ</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-xl border p-2 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-xl border p-2 outline-none focus:border-blue-500" />
          </div>
          <button onClick={loadReport} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50">
            {loading ? 'جاري التحميل...' : 'تحديث التقرير'}
          </button>
          <button onClick={downloadCSV} disabled={data.length === 0} className="ghost flex items-center gap-2 px-4 py-2 rounded-xl border">
            <Download size={16} /> تصدير CSV
          </button>
        </div>

        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">الطالب</th>
                <th className="p-4">رقم الطالب</th>
                <th className="p-4">أيام الحضور</th>
                <th className="p-4">إجمالي الحصص</th>
                <th className="p-4">النسبة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-gray-500">جاري التحميل...</td></tr>
              ) : data.length ? (
                data.map((row, i) => {
                  const p = parseInt(row.present_count);
                  const t = parseInt(row.total_count);
                  const perc = t > 0 ? ((p / t) * 100).toFixed(1) : '0';
                  return (
                    <tr key={i} className="border-b last:border-none hover:bg-gray-50">
                      <td className="p-4 font-medium">{row.student_name}</td>
                      <td className="p-4 text-gray-500">{row.student_no}</td>
                      <td className="p-4">{p}</td>
                      <td className="p-4">{t}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${Number(perc) >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {perc}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={5} className="p-10 text-center text-gray-500">لا توجد بيانات لهذه الفترة</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
