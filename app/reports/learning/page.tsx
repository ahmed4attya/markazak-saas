'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';

type Course = { id: string; name: string; category: string | null; exams: number; attempts: number; completed: number; average_score: number; assignments: number; submissions: number; graded: number; average_grade: number };
type Report = { courses: Course[]; totals: { exams: number; attempts: number; completed: number; assignments: number; submissions: number; graded: number } };

export default function LearningReportsPage() {
  const [report, setReport] = useState<Report | null>(null); const [courseId, setCourseId] = useState(''); const [error, setError] = useState('');
  async function load() { setError(''); const response = await fetch('/api/reports/learning' + (courseId ? `?courseId=${encodeURIComponent(courseId)}` : '')); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'تعذر تحميل التقرير'); setReport(body); }
  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'تعذر التحميل')); }, [courseId]);
  return <Shell title="تحليلات التعلم" subtitle="قياس أداء الاختبارات والواجبات ضمن نطاق صلاحيتك"><div className="space-y-6">{error && <div className="error">{error}</div>}<div className="toolbar"><select value={courseId} onChange={(e) => setCourseId(e.target.value)}><option value="">كل الدورات المسموحة</option>{report?.courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></div>{report && <><div className="grid gap-4 md:grid-cols-3"><Metric label="الاختبارات" value={report.totals.exams} /><Metric label="المحاولات المكتملة" value={report.totals.completed} /><Metric label="التسليمات المصححة" value={report.totals.graded} /></div><div className="panel tablePanel"><div className="tableWrap"><table className="dataTable"><thead><tr><th>الدورة</th><th>الاختبارات</th><th>المحاولات</th><th>متوسط الاختبار</th><th>الواجبات</th><th>التسليمات</th><th>متوسط الدرجات</th></tr></thead><tbody>{!report.courses.length && <tr><td colSpan={7} className="tableEmpty">لا توجد بيانات ضمن نطاقك.</td></tr>}{report.courses.map((course) => <tr key={course.id}><td className="font-bold">{course.name}</td><td>{course.exams}</td><td>{course.attempts} ({course.completed} مكتملة)</td><td>{course.average_score}%</td><td>{course.assignments}</td><td>{course.submissions} ({course.graded} مصححة)</td><td>{course.average_grade}</td></tr>)}</tbody></table></div></div></>}</div></Shell>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="panel"><p className="text-sm text-[color:var(--muted)]">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></div>; }
