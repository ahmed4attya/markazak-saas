'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, ClipboardCheck, LogOut, PlayCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Learner = { role: string; students: Array<{ id: string; name: string; student_no: string; type: string }>; enrollments: Array<{ course_id: string | null; course_name: string | null; group_name: string }> };
type Exam = { id: string; title: string; kind: string; duration_minutes: number | null; question_count: number; course_name: string | null };
type Assignment = { id: string; title: string; description: string | null; due_at: string | null; points: number; course_name: string; student_id: string; student_name: string; submission_id: string | null; submitted_at: string | null; grade: number | null; feedback: string | null };
type Lesson = { id: string; title: string; description: string | null; body: string | null; course_name: string; student_id: string; student_name: string; position: number; duration_minutes: number; completed: boolean; seconds_watched: number };
type Progress = { attempts: { total: number; completed: number; average_score: number }; assignments: { total: number; submitted: number; graded: number; average_grade: number }; courses: Array<{ id: string; name: string; exams: number; assignments: number }> };

export default function LearnerPortal() {
  const router = useRouter();
  const [learner, setLearner] = useState<Learner | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/learner/me'), fetch('/api/learner/exams'), fetch('/api/assignments'), fetch('/api/learner/progress'), fetch('/api/learner/lessons')]).then(async ([profile, examResponse, assignmentResponse, progressResponse, lessonResponse]) => {
      if (!profile.ok || !examResponse.ok || !assignmentResponse.ok || !progressResponse.ok) throw new Error('لا يمكن تحميل البوابة بهذا الحساب');
      setLearner(await profile.json()); setExams(await examResponse.json()); setAssignments(await assignmentResponse.json()); setProgress(await progressResponse.json()); if (lessonResponse.ok) setLessons(await lessonResponse.json());
    }).catch((e) => setError(e instanceof Error ? e.message : 'تعذر التحميل'));
  }, []);

  async function start(examId: string) {
    setBusy(examId); setError('');
    try {
      const response = await fetch('/api/attempts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ examId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'تعذر بدء الامتحان');
      router.push('/portal/attempts/' + body.attempt.id);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر بدء الامتحان'); }
    finally { setBusy(''); }
  }

  async function submitAssignment(id: string) {
    setBusy(id); setError('');
    try { const response = await fetch('/api/assignments/' + id + '/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ answerText: answers[id] || '' }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'تعذر التسليم'); setAssignments((current) => current.map((item) => item.id === id ? { ...item, submission_id: body.id, submitted_at: body.submitted_at } : item)); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر التسليم'); } finally { setBusy(''); }
  }

  async function completeLesson(id: string) { setBusy(id); setError(''); try { const response = await fetch(`/api/learner/lessons/${id}/progress`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ completed: true, secondsWatched: 0 }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'تعذر حفظ التقدم'); setLessons((current) => current.map((lesson) => lesson.id === id ? { ...lesson, completed: true } : lesson)); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر حفظ التقدم'); } finally { setBusy(''); } }

  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }

  if (error) return <main dir="rtl" className="min-h-screen bg-[color:var(--bg)] p-6 text-[color:var(--text)]"><div className="mx-auto max-w-xl panel"><p className="error">{error}</p></div></main>;
  if (!learner) return <main dir="rtl" className="min-h-screen bg-[color:var(--bg)] p-6 text-[color:var(--text)]"><div className="mx-auto max-w-xl panel">جاري تحميل بوابتك...</div></main>;
  const student = learner.students[0];

  return <main dir="rtl" className="min-h-screen bg-[color:var(--bg)] text-[color:var(--text)] p-4 lg:p-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"><div><div className="flex items-center gap-2 text-[color:var(--gold)]"><ShieldCheck size={18} /> بوابة التعلم الآمنة</div><h1 className="mt-2 text-2xl font-bold">مرحباً {student?.name}</h1><p className="text-sm text-[color:var(--muted)]">رقم الطالب: {student?.student_no}</p></div><button className="ghost" onClick={logout}><LogOut size={16} /> خروج</button></header>
      <section className="grid gap-4 md:grid-cols-4"><div className="panel"><BookOpen className="text-[color:var(--blue)]" /><p className="mt-3 text-sm text-[color:var(--muted)]">دوراتي</p><strong className="text-2xl">{learner.enrollments.length}</strong></div><div className="panel"><ClipboardCheck className="text-[color:var(--gold)]" /><p className="mt-3 text-sm text-[color:var(--muted)]">متوسط الاختبارات</p><strong className="text-2xl">{progress?.attempts.average_score || 0}%</strong></div><div className="panel"><CheckCircle2 className="text-[color:var(--success)]" /><p className="mt-3 text-sm text-[color:var(--muted)]">الواجبات المسلّمة</p><strong className="text-2xl">{progress?.assignments.submitted || 0}/{progress?.assignments.total || 0}</strong></div><div className="panel"><ShieldCheck className="text-[color:var(--success)]" /><p className="mt-3 text-sm text-[color:var(--muted)]">حالة الحساب</p><strong className="text-lg">مربوط وآمن</strong></div></section>
      <section className="panel space-y-4"><h2 className="text-xl font-bold">الامتحانات المتاحة</h2>{!exams.length && <p className="text-[color:var(--muted)]">لا توجد امتحانات متاحة لدوراتك حالياً.</p>}{exams.map((exam) => <div key={exam.id} className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-bold">{exam.title}</p><p className="mt-1 text-sm text-[color:var(--muted)]">{exam.course_name || 'دورة'} · {exam.question_count} سؤال · {exam.duration_minutes ? `${exam.duration_minutes} دقيقة` : 'بدون مؤقت'}</p></div>{learner.role === 'student' ? <button className="primary" disabled={busy === exam.id} onClick={() => start(exam.id)}><PlayCircle size={16} /> {busy === exam.id ? 'جاري البدء...' : 'ابدأ الامتحان'}</button> : <span className="badge">متابعة ولي الأمر</span>}</div>)}</section>
      <section className="panel space-y-4"><h2 className="text-xl font-bold">واجباتي</h2>{!assignments.length && <p className="text-[color:var(--muted)]">لا توجد واجبات متاحة.</p>}{assignments.map((item) => <div key={`${item.id}-${item.student_id}`} className="space-y-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="font-bold">{item.title}</p><p className="text-sm text-[color:var(--muted)]">{item.student_name} · {item.course_name} · {item.points} نقطة · {item.due_at ? new Date(item.due_at).toLocaleString('ar-SA') : 'مفتوح'}</p></div>{item.grade !== null && <span className="font-bold text-[color:var(--success)]">الدرجة: {item.grade}</span>}</div>{learner.role === 'guardian' ? <p className="text-sm text-[color:var(--muted)]">عرض ولي الأمر فقط{item.submitted_at ? ` · تم التسليم ${new Date(item.submitted_at).toLocaleString('ar-SA')}` : ''}</p> : item.submission_id ? <p className="text-sm text-[color:var(--success)]">تم التسليم {item.submitted_at ? new Date(item.submitted_at).toLocaleString('ar-SA') : ''}</p> : <><textarea value={answers[item.id] || ''} onChange={(e) => setAnswers((current) => ({ ...current, [item.id]: e.target.value }))} placeholder="اكتب حلك أو ملاحظتك هنا..." rows={3} /><button className="primary" disabled={busy === item.id || !(answers[item.id] || '').trim()} onClick={() => submitAssignment(item.id)}>تسليم الواجب</button></>}</div>)}</section>
      <section className="panel space-y-4"><h2 className="text-xl font-bold">مسار الدروس</h2>{!lessons.length && <p className="text-[color:var(--muted)]">لا توجد دروس منشورة لدوراتك حالياً.</p>}{lessons.map((lesson) => <div key={`${lesson.id}-${lesson.student_id}`} className="flex flex-col gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-bold">{lesson.title}</p><p className="text-sm text-[color:var(--muted)]">{lesson.student_name} · {lesson.course_name} · الدرس {lesson.position} · {lesson.duration_minutes} دقيقة</p>{lesson.description && <p className="mt-2 text-sm text-[color:var(--muted)]">{lesson.description}</p>}</div>{lesson.completed ? <span className="badge">مكتمل</span> : learner.role === 'student' ? <button className="primary" disabled={busy === lesson.id} onClick={() => completeLesson(lesson.id)}>تحديد كمكتمل</button> : <span className="badge">متابعة ولي الأمر</span>}</div>)}</section>
    </div>
  </main>;
}
