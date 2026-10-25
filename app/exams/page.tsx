'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { ClipboardCheck, Copy, Plus, Trash2, Search, RotateCcw } from 'lucide-react';
import Shell from '@/components/Shell';

type Exam = { id: string; title: string; kind: string; duration_minutes: number | null; question_count: number; course_name: string | null };
type Question = { id: string; text: string; domain: string; topic: string | null };
type Course = { id: string; name: string };

const domainLabels: Record<string, string> = { quant: 'قدرات كمي', verbal: 'قدرات لفظي', achievement: 'تحصيلي' };

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [kind, setKind] = useState<'practice' | 'simulation'>('practice');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKind, setFilterKind] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (filterKind && e.kind !== filterKind) return false;
      if (filterCourse && e.course_name !== filterCourse) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const match =
          e.title.toLowerCase().includes(q) ||
          (e.course_name || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [exams, filterKind, filterCourse, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery.trim() || filterKind || filterCourse);

  const load = useCallback(async () => {
    const [examResponse, questionResponse, courseResponse] = await Promise.all([
      fetch('/api/exams'),
      fetch('/api/questions'),
      fetch('/api/courses'),
    ]);
    if (!examResponse.ok || !questionResponse.ok) throw new Error('تعذر تحميل بيانات الامتحانات');
    setExams(await examResponse.json());
    setQuestions(await questionResponse.json());
    if (courseResponse.ok) setCourses(await courseResponse.json());
  }, []);

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'تعذر التحميل')); }, [load]);

  function toggleQuestion(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function createExam() {
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          courseId: courseId || null,
          kind,
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
          randomize: true,
          questionIds: selected,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'تعذر إنشاء الامتحان');
      setSuccess('تم إنشاء الامتحان');
      setTitle(''); setSelected([]); setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر إنشاء الامتحان'); }
    finally { setBusy(false); }
  }

  async function copyExam(id: string) {
    setBusy(true); setError(''); setSuccess('');
    try {
      const response = await fetch('/api/exams/' + id + '/copy', { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'تعذر النسخ');
      setSuccess('تم نسخ الامتحان');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر النسخ'); }
    finally { setBusy(false); }
  }

  async function removeExam(id: string) {
    if (!window.confirm('حذف الامتحان؟')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/exams/' + id, { method: 'DELETE' });
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'تعذر الحذف'); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحذف'); }
    finally { setBusy(false); }
  }

  return (
    <Shell title="الامتحانات والمحاكاة" subtitle="أنشئ تدريباً يومياً أو محاكاة كاملة لقدرات كمي ولفظي والتحصيلي">
      <div className="space-y-6">
        <div className="toolbar">
          <div className="flex items-center gap-3 text-sm text-[color:var(--muted)]"><ClipboardCheck size={18} className="text-[color:var(--gold)]" /> {exams.length} امتحاناً</div>
          <button className="primary" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> امتحان جديد</button>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && <div className="panel space-y-4">
          <h2 className="text-lg font-bold text-[color:var(--text)]">إنشاء امتحان</h2>
          <div className="formGrid">
            <label>العنوان<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="محاكاة قدرات كمي — النموذج 1" /></label>
            <label>الدورة
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">اختر الدورة</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
              </select>
            </label>
            <label>النوع<select value={kind} onChange={(e) => setKind(e.target.value as 'practice' | 'simulation')}><option value="practice">تدريب</option><option value="simulation">محاكاة كاملة</option></select></label>
            <label>المدة بالدقائق<input type="number" min="1" max="600" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} /></label>
          </div>
          <div className="flex items-center justify-between"><h3 className="font-bold text-[color:var(--text)]">اختر الأسئلة ({selected.length})</h3><span className="text-xs text-[color:var(--muted)]">يتم حفظ ترتيب الاختيار</span></div>
          <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-[color:var(--border)] p-3">
            {questions.map((question) => <label key={question.id} className="flex items-start gap-3 rounded-lg p-3 hover:bg-[color:var(--surface-2)] cursor-pointer"><input type="checkbox" checked={selected.includes(question.id)} onChange={() => toggleQuestion(question.id)} className="mt-1" /><span><span className="block text-xs text-[color:var(--gold)]">{domainLabels[question.domain] || question.domain} · {question.topic || 'عام'}</span><span className="text-sm text-[color:var(--text-soft)]">{question.text}</span></span></label>)}
            {!questions.length && <p className="text-sm text-[color:var(--muted)]">أضف أسئلة أولاً من بنك الأسئلة.</p>}
          </div>
          <div className="flex gap-2"><button className="primary" disabled={busy || !title.trim() || !courseId || selected.length === 0} onClick={createExam}>حفظ الامتحان</button><button className="ghost" onClick={() => setShowForm(false)}>إلغاء</button></div>
        </div>}

        {/* Smart Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative group min-w-[200px] flex-1 sm:flex-initial">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بعنوان الامتحان أو الدورة..."
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs outline-none"
              />
            </div>

            <select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold cursor-pointer"
            >
              <option value="">كل الأنواع (تدريب/محاكاة)</option>
              <option value="practice">تدريب</option>
              <option value="simulation">محاكاة كاملة</option>
            </select>

            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold cursor-pointer"
            >
              <option value="">كل الدورات</option>
              {courses.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterKind('');
                  setFilterCourse('');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-bold">
            عرض {filteredExams.length} من أصل {exams.length}
          </span>
        </div>

        <div className="panel tablePanel"><div className="tableWrap"><table className="dataTable"><thead><tr><th>الامتحان</th><th>الدورة</th><th>النوع</th><th>الأسئلة</th><th>المدة</th><th></th></tr></thead><tbody>
          {!filteredExams.length && <tr><td className="tableEmpty" colSpan={6}>لا توجد امتحانات تطابق البحث.</td></tr>}
          {filteredExams.map((exam) => <tr key={exam.id}><td><span className="font-bold text-[color:var(--text)]">{exam.title}</span></td><td>{exam.course_name || '—'}</td><td>{exam.kind === 'simulation' ? 'محاكاة' : 'تدريب'}</td><td>{exam.question_count}</td><td>{exam.duration_minutes ? `${exam.duration_minutes} دقيقة` : 'بدون مؤقت'}</td><td><div className="flex gap-1.5"><button className="ghost !min-h-0 py-1.5 px-3" disabled={busy} onClick={() => copyExam(exam.id)}><Copy size={14} /> نسخ</button><button className="ghost !min-h-0 py-1.5 px-3" disabled={busy} onClick={() => removeExam(exam.id)}><Trash2 size={14} /> حذف</button></div></td></tr>)}
        </tbody></table></div></div>
      </div>
    </Shell>
  );
}
