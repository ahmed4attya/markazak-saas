'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { ClipboardCheck, Copy, Plus, Trash2, Search, RotateCcw, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, X, CheckSquare, Square, Layers, Wand2, BookOpen } from 'lucide-react';
import Shell from '@/components/Shell';
import { evaluateQuestion, autoSelectQuestions, BaseQuestion } from '@/lib/question-engine';

type Exam = { id: string; title: string; kind: string; duration_minutes: number | null; question_count: number; course_name: string | null };
type Question = BaseQuestion & { domain: string; topic: string | null };
type Course = { id: string; name: string };
type Bank = { id: string; name: string; domain: string; count: number };

const domainLabels: Record<string, string> = { quant: 'قدرات كمي', verbal: 'قدرات لفظي', achievement: 'تحصيلي' };

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  
  // Selection Mode: 'auto' (shows ONLY selected questions) vs 'manual' (shows all with recommendations)
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [excludeUsed, setExcludeUsed] = useState(true);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [manualDifficulty, setManualDifficulty] = useState('');

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
    const [examResponse, questionResponse, courseResponse, usedResponse, banksResponse] = await Promise.all([
      fetch('/api/exams'),
      fetch('/api/questions?limit=300'),
      fetch('/api/courses'),
      fetch('/api/questions/used-ids'),
      fetch('/api/questions/banks'),
    ]);
    if (!examResponse.ok || !questionResponse.ok) throw new Error('تعذر تحميل بيانات الامتحانات');
    setExams(await examResponse.json());
    setQuestions(await questionResponse.json());
    if (courseResponse.ok) setCourses(await courseResponse.json());
    if (banksResponse.ok) setBanks(await banksResponse.json());
    if (usedResponse.ok) {
      const u = await usedResponse.json();
      if (Array.isArray(u.usedIds)) {
        setUsedIds(new Set(u.usedIds));
      }
    }
  }, []);

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'تعذر التحميل')); }, [load]);

  // Fast on-demand fetch when specific bank is chosen
  useEffect(() => {
    if (!selectedBank) return;
    const sp = new URLSearchParams();
    sp.set('bank', selectedBank);
    sp.set('limit', '500');
    fetch('/api/questions?' + sp.toString())
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setQuestions((prev) => {
            const map = new Map(prev.map((q) => [q.id, q]));
            data.forEach((q: Question) => map.set(q.id, q));
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, [selectedBank]);

  // Questions available for selected course and bank
  const currentPool = useMemo(() => {
    let pool = questions;
    if (courseId) {
      pool = pool.filter((q) => !q.course_id || q.course_id === courseId);
    }
    if (selectedBank) {
      pool = pool.filter((q) => q.subject === selectedBank || q.skill === selectedBank || q.topic === selectedBank);
    }
    return pool;
  }, [questions, courseId, selectedBank]);

  // Questions currently selected
  const selectedQuestions = useMemo(() => {
    const map = new Map(questions.map((q) => [q.id, q]));
    return selected.map((id) => map.get(id)).filter(Boolean) as Question[];
  }, [questions, selected]);

  // Scored pool for manual and auto mode
  const scoredPool = useMemo(() => {
    return currentPool.map((q) => evaluateQuestion(q, usedIds));
  }, [currentPool, usedIds]);

  // Filtered pool for manual selection
  const manualFilteredPool = useMemo(() => {
    return scoredPool.filter(({ question, isRecommended, isUsed }) => {
      if (excludeUsed && isUsed) return false;
      if (showOnlyRecommended && !isRecommended) return false;
      if (manualDifficulty && String(question.difficulty) !== manualDifficulty) return false;
      if (manualSearch.trim()) {
        const s = manualSearch.trim().toLowerCase();
        const match =
          (question.text || '').toLowerCase().includes(s) ||
          (question.topic || '').toLowerCase().includes(s) ||
          (question.skill || '').toLowerCase().includes(s) ||
          (domainLabels[question.domain] || '').toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [scoredPool, excludeUsed, showOnlyRecommended, manualDifficulty, manualSearch]);

  function toggleQuestion(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  // Auto-generate question selection
  function handleAutoGenerate(num: number) {
    if (!currentPool.length) {
      setError('لا توجد أسئلة كافية في هذا البنك/الدورة حالياً');
      return;
    }
    const chosen = autoSelectQuestions(currentPool, num, usedIds, {
      excludeUsed,
      prioritizeRecommended: true,
    });
    setSelected(chosen.map((q) => q.id));
    const bankLabel = selectedBank ? ` من ${selectedBank}` : '';
    setSuccess(`تم اختيار ${chosen.length} سؤالاً بنجاح${bankLabel} بواسطة الخوارزمية الذكية`);
  }

  // Replace a single selected question with another unused one
  function replaceSingleQuestion(oldId: string) {
    const currentSelectedSet = new Set(selected);
    const candidate = currentPool.find((q) => {
      if (currentSelectedSet.has(q.id)) return false;
      if (excludeUsed && usedIds.has(q.id)) return false;
      return true;
    });
    if (!candidate) {
      setError('لم يتم العثور على سؤال بديل غير مستخدم في هذا البنك');
      return;
    }
    setSelected((prev) => prev.map((id) => (id === oldId ? candidate.id : id)));
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
      setSuccess('تم إنشاء الامتحان بنجاح وحفظه');
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
    <Shell title="الامتحانات والمحاكاة" subtitle="أنشئ تدريباً يومياً أو محاكاة كاملة لقدرات كمي ولفظي والتحصيلي مع تقسيم البنوك">
      <div className="space-y-6">
        <div className="toolbar">
          <div className="flex items-center gap-3 text-sm text-[color:var(--muted)]"><ClipboardCheck size={18} className="text-[color:var(--gold)]" /> {exams.length} امتحاناً</div>
          <button className="primary" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> امتحان جديد</button>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && <div className="panel space-y-5">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
            <h2 className="text-lg font-bold text-[color:var(--text)] flex items-center gap-2">
              <Sparkles size={20} className="text-[color:var(--gold)]" />
              <span>إنشاء امتحان جديد</span>
            </h2>
            <span className="text-xs text-[color:var(--muted)]">بنك الأسئلة مقسم إلى {banks.length} بنكاً معتمداً (+15.4K سؤال)</span>
          </div>

          <div className="formGrid">
            <label>العنوان<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="محاكاة قدرات كمي — النموذج 1" /></label>
            <label>الدورة
              <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSelected([]); }}>
                <option value="">اختر الدورة التدريبية</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
              </select>
            </label>
            <label>بنك الأسئلة المحدد (المصدر)
              <select value={selectedBank} onChange={(e) => { setSelectedBank(e.target.value); setSelected([]); }}>
                <option value="">📂 جميع بنوك الأسئلة (+15.4K سؤال)</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.count} سؤال)
                  </option>
                ))}
              </select>
            </label>
            <label>النوع<select value={kind} onChange={(e) => setKind(e.target.value as 'practice' | 'simulation')}><option value="practice">تدريب</option><option value="simulation">محاكاة كاملة</option></select></label>
            <label>المدة بالدقائق<input type="number" min="1" max="600" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} /></label>
          </div>

          {/* Mode Switcher Tabs: Auto vs Manual */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[color:var(--muted)]">طريقة اختيار الأسئلة:</span>
                <div className="inline-flex rounded-xl p-1 bg-[color:var(--surface-3)] border border-[color:var(--border)]">
                  <button
                    type="button"
                    onClick={() => setSelectionMode('auto')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      selectionMode === 'auto'
                        ? 'bg-[color:var(--gold)] text-black shadow-sm'
                        : 'text-[color:var(--text-soft)] hover:text-[color:var(--text)]'
                    }`}
                  >
                    <Wand2 size={14} />
                    <span>⚡ أوتوماتيك (التوليد الذكي)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      selectionMode === 'manual'
                        ? 'bg-[color:var(--gold)] text-black shadow-sm'
                        : 'text-[color:var(--text-soft)] hover:text-[color:var(--text)]'
                    }`}
                  >
                    <Layers size={14} />
                    <span>✋ يدوي (مع توصيات الخوارزمية)</span>
                  </button>
                </div>
              </div>

              {/* Exclusion Toggle (Prevent duplicate questions) */}
              <label className="flex items-center gap-2 text-xs font-bold text-[color:var(--text)] cursor-pointer select-none bg-[color:var(--surface-3)] px-3 py-1.5 rounded-xl border border-[color:var(--border)]">
                <input
                  type="checkbox"
                  checked={excludeUsed}
                  onChange={(e) => setExcludeUsed(e.target.checked)}
                  className="rounded text-[color:var(--gold)] focus:ring-0 cursor-pointer"
                />
                <span>🚫 استبعاد الأسئلة المستخدمة سابقاً في الاختبارات والواجبات</span>
                {usedIds.size > 0 && (
                  <span className="text-[10px] text-[color:var(--gold)] bg-[color:var(--surface-1)] px-1.5 py-0.5 rounded-md font-mono">
                    ({usedIds.size} مستبعد)
                  </span>
                )}
              </label>
            </div>

            {/* AUTO MODE */}
            {selectionMode === 'auto' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[color:var(--surface-1)] p-3 rounded-xl border border-[color:var(--border)]">
                  <div>
                    <h4 className="text-xs font-bold text-[color:var(--gold)] flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>
                        حدد عدد الأسئلة ليتم توليدها
                        {selectedBank ? ` من ${selectedBank}:` : ' من البنك:'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-[color:var(--muted)] mt-0.5">
                      تنتقي الخوارزمية الأسئلة بتوازن تربوي من البنك المختار دون تكرار أي سؤال تم اختباره سابقاً.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 10, 15, 20, 30, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleAutoGenerate(num)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition cursor-pointer"
                      >
                        {num} أسئلة
                      </button>
                    ))}
                    {selected.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelected([])}
                        className="px-2.5 py-1 text-xs font-bold text-red-400 hover:underline cursor-pointer"
                      >
                        تفريغ الكل
                      </button>
                    )}
                  </div>
                </div>

                {/* ONLY SELECTED QUESTIONS APPEAR IN AUTO MODE */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-[color:var(--text)] flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span>الأسئلة المختارة للاختبار ({selected.length} سؤالاً محدد)</span>
                    </h3>
                    {selected.length > 0 && (
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-800/40">
                        جاهزة للاعتماد والامتحان
                      </span>
                    )}
                  </div>

                  {selected.length === 0 ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-1)]">
                      <Wand2 size={32} className="mx-auto text-[color:var(--gold)] mb-2 opacity-60" />
                      <p className="text-sm font-bold text-[color:var(--text)]">لم يتم توليد أي أسئلة بعد</p>
                      <p className="text-xs text-[color:var(--muted)] mt-1">
                        اختر البنك أو الدورة بالأعلى ثم اضغط على أحد أزرار عدد الأسئلة لتوليدها فوراً وستظهر الأسئلة المختارة فقط هنا.
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2.5 rounded-xl border border-[color:var(--border)] p-3 bg-[color:var(--surface-1)]">
                      {selectedQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)] transition space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[color:var(--surface-3)] text-xs font-bold flex items-center justify-center text-[color:var(--gold)]">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-[color:var(--gold)]">
                                {domainLabels[q.domain] || q.domain}
                              </span>
                              {q.subject && (
                                <span className="text-[11px] text-[color:var(--gold)] bg-[color:var(--surface-3)] px-2 py-0.5 rounded-md font-bold">
                                  {q.subject}
                                </span>
                              )}
                              {q.topic && q.topic !== q.subject && (
                                <span className="text-[11px] text-[color:var(--muted)] bg-[color:var(--surface-3)] px-2 py-0.5 rounded-md">
                                  {q.topic}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Sparkles size={10} />
                                <span>اختيار الخوارزمية الذكية</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                title="استبدال بسؤال بديل غير مكرر"
                                onClick={() => replaceSingleQuestion(q.id)}
                                className="px-2 py-1 text-xs font-bold text-[color:var(--text-soft)] hover:text-[color:var(--gold)] bg-[color:var(--surface-3)] rounded-lg border border-[color:var(--border)] flex items-center gap-1 cursor-pointer"
                              >
                                <RefreshCw size={12} />
                                <span>استبدال</span>
                              </button>
                              <button
                                type="button"
                                title="حذف هذا السؤال"
                                onClick={() => toggleQuestion(q.id)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg cursor-pointer"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-[color:var(--text)] font-semibold leading-relaxed">
                            {q.text || 'انظر الشكل المرفق للإجابة عن السؤال'}
                          </p>

                          {Array.isArray(q.options) && q.options.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                              {q.options.map((opt, oi) => (
                                <div
                                  key={oi}
                                  className="text-[11px] px-2 py-1 rounded-lg bg-[color:var(--surface-3)] text-[color:var(--text-soft)] border border-[color:var(--border)] truncate"
                                >
                                  <span className="font-bold text-[color:var(--gold)] ml-1">
                                    {['أ', 'ب', 'ج', 'د'][oi] || oi + 1})
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MANUAL MODE */}
            {selectionMode === 'manual' && (
              <div className="space-y-3">
                {/* Manual Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[color:var(--surface-1)] p-3 rounded-xl border border-[color:var(--border)]">
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                      <input
                        type="text"
                        value={manualSearch}
                        onChange={(e) => setManualSearch(e.target.value)}
                        placeholder="ابحث في نص السؤال أو المهارة..."
                        className="w-full pr-8 pl-2 py-1 text-xs rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text)] outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowOnlyRecommended((p) => !p)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                        showOnlyRecommended
                          ? 'border-[color:var(--gold)] bg-[color:var(--gold)]/10 text-[color:var(--gold)]'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-[color:var(--text)]'
                      }`}
                    >
                      <Sparkles size={12} />
                      <span>توصيات الخوارزمية فقط ⭐</span>
                    </button>

                    <select
                      value={manualDifficulty}
                      onChange={(e) => setManualDifficulty(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text)]"
                    >
                      <option value="">كل مستويات الصعوبة</option>
                      <option value="1">سهل (1)</option>
                      <option value="2">مقبول (2)</option>
                      <option value="3">متوسط (3)</option>
                      <option value="4">متقدم (4)</option>
                      <option value="5">صعب جداً (5)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[color:var(--gold)]">
                      {selected.length} محدد
                    </span>
                    <span className="text-[11px] text-[color:var(--muted)]">
                      من أصل {manualFilteredPool.length} متاح
                    </span>
                  </div>
                </div>

                {/* All Questions List */}
                <div className="max-h-96 overflow-y-auto space-y-2 rounded-xl border border-[color:var(--border)] p-3 bg-[color:var(--surface-1)]">
                  {manualFilteredPool.length === 0 ? (
                    <p className="text-xs text-[color:var(--muted)] text-center py-6">
                      لا توجد أسئلة تطابق الفلاتر المحددة — جرب إلغاء تفعيل بعض الفلاتر أو تغيير البنك.
                    </p>
                  ) : (
                    manualFilteredPool.map(({ question: q, isRecommended, isUsed, reasons }) => {
                      const isChecked = selected.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestion(q.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                            isChecked
                              ? 'border-[color:var(--gold)] bg-[color:var(--surface-2)] shadow-sm'
                              : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)]'
                          }`}
                        >
                          <div className="mt-0.5 text-[color:var(--gold)]">
                            {isChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-[color:var(--muted)]" />}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[color:var(--gold)]">
                                  {domainLabels[q.domain] || q.domain}
                                </span>
                                {q.subject && (
                                  <span className="text-[11px] text-[color:var(--gold)] bg-[color:var(--surface-3)] px-2 py-0.5 rounded-md font-bold">
                                    {q.subject}
                                  </span>
                                )}
                                {q.topic && q.topic !== q.subject && (
                                  <span className="text-[11px] text-[color:var(--muted)] bg-[color:var(--surface-3)] px-2 py-0.5 rounded-md">
                                    {q.topic}
                                  </span>
                                )}
                                {isRecommended && (
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Sparkles size={10} />
                                    <span>موصى به ({reasons.join(' · ')})</span>
                                  </span>
                                )}
                                {isUsed && (
                                  <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertTriangle size={10} />
                                    <span>مستخدم سابقاً</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-[color:var(--text)] font-semibold leading-relaxed">
                              {q.text || 'انظر الشكل المرفق للإجابة عن السؤال'}
                            </p>

                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1">
                                {q.options.map((opt, oi) => (
                                  <div
                                    key={oi}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[color:var(--surface-3)] text-[color:var(--text-soft)] truncate"
                                  >
                                    <span className="font-bold text-[color:var(--gold)] ml-1">
                                      {['أ', 'ب', 'ج', 'د'][oi] || oi + 1})
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="primary"
              disabled={busy || !title.trim() || !courseId || selected.length === 0}
              onClick={createExam}
            >
              حفظ الامتحان ({selected.length} أسئلة محددة)
            </button>
            <button className="ghost" onClick={() => setShowForm(false)}>
              إلغاء
            </button>
          </div>
        </div>}

        {/* Smart Filter Bar for existing exams */}
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
