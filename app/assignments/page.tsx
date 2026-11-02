'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Wand2, Layers, RefreshCw, X, CheckSquare, Square, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Shell from '@/components/Shell';
import { evaluateQuestion, autoSelectQuestions, formatAssignmentQuestions, BaseQuestion } from '@/lib/question-engine';

type ARow = {
  id: string; title: string; description: string | null; due_date: string | null; max_score: number | string;
  course_id: string; course_name: string | null; group_name: string | null;
  submitted_count: number; graded_count: number;
};
type SubRow = { id: string; student_id: string; student_name: string; student_no: string; content: string | null; submitted_at: string | null; score: number | string | null; feedback: string | null; graded_at: string | null };

const EMPTY = { title: '', courseId: '', groupId: '', description: '', dueDate: '', maxScore: 100, questionIds: [] as string[] };

export default function Assignments() {
  const [rows, setRows] = useState<ARow[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string; course_id: string }[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState<typeof EMPTY>({ ...EMPTY });
  const [openId, setOpenId] = useState('');
  const [subs, setSubs] = useState<Record<string, SubRow[]>>({});
  const [gradeDraft, setGradeDraft] = useState<Record<string, { score: string; feedback: string }>>({});

  // Question Engine State for Assignments
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');
  const [excludeUsed, setExcludeUsed] = useState(true);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [courseQuestions, setCourseQuestions] = useState<BaseQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [assignRes, usedRes] = await Promise.all([
      fetch('/api/assignments'),
      fetch('/api/questions/used-ids'),
    ]);
    if (assignRes.ok) setRows(await assignRes.json()); else setError('تعذر تحميل الواجبات');
    if (usedRes.ok) {
      const u = await usedRes.json();
      if (Array.isArray(u.usedIds)) setUsedIds(new Set(u.usedIds));
    }
  }, []);

  useEffect(() => { load().catch(() => setError('تعذر التحميل')); }, [load]);
  useEffect(() => {
    fetch('/api/courses').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setCourses(d); }).catch(() => {});
    fetch('/api/groups').then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setGroups(d); }).catch(() => {});
  }, []);

  // Fetch course questions whenever course selection changes
  useEffect(() => {
    if (!f.courseId) {
      setCourseQuestions([]);
      setSelectedIds([]);
      return;
    }
    const sp = new URLSearchParams();
    sp.set('courseId', f.courseId);
    sp.set('limit', '1000');
    fetch('/api/questions?' + sp.toString())
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourseQuestions(data);
        } else {
          // Fallback to general pool if course has no dedicated questions
          fetch('/api/questions?limit=500')
            .then((r2) => (r2.ok ? r2.json() : []))
            .then((d2) => { if (Array.isArray(d2)) setCourseQuestions(d2); })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [f.courseId]);

  // Scored questions for manual mode and recommendations
  const scoredPool = useMemo(() => {
    return courseQuestions.map((q) => evaluateQuestion(q, usedIds));
  }, [courseQuestions, usedIds]);

  // Filtered pool for manual mode
  const manualFilteredPool = useMemo(() => {
    return scoredPool.filter(({ question, isRecommended, isUsed }) => {
      if (excludeUsed && isUsed) return false;
      if (showOnlyRecommended && !isRecommended) return false;
      if (manualSearch.trim()) {
        const s = manualSearch.trim().toLowerCase();
        const match =
          (question.text || '').toLowerCase().includes(s) ||
          (question.topic || '').toLowerCase().includes(s) ||
          (question.skill || '').toLowerCase().includes(s);
        if (!match) return false;
      }
      return true;
    });
  }, [scoredPool, excludeUsed, showOnlyRecommended, manualSearch]);

  // Selected question objects
  const selectedQuestions = useMemo(() => {
    const map = new Map(courseQuestions.map((q) => [q.id, q]));
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as BaseQuestion[];
  }, [courseQuestions, selectedIds]);

  // Apply selected questions to assignment text
  const applyQuestionsToAssignment = useCallback((questionsToApply: BaseQuestion[]) => {
    const selectedCourseName = courses.find((c) => c.id === f.courseId)?.name || 'القدرات والتحصيلي';
    const num = questionsToApply.length;
    const formatted = formatAssignmentQuestions(questionsToApply);
    const header = `📌 أسئلة الواجب التدريبي من بنك الأسئلة (${num} أسئلة):\n` +
      `تعليمات: أجب عن كافة الأسئلة موضحاً خطوات الحل ورمز الإجابة الصحيحة.\n\n`;

    setF((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : `واجب تدريبي — ${selectedCourseName} (${num} أسئلة)`,
      maxScore: num * 2,
      description: header + formatted,
      questionIds: questionsToApply.map((q) => q.id),
    }));
  }, [courses, f.courseId]);

  // AUTO GENERATE QUESTIONS
  function handleAutoGenerate(num: number) {
    if (!f.courseId) {
      setError('يرجى اختيار الدورة أولاً لتحديد بنك الأسئلة المناسب');
      return;
    }
    if (!courseQuestions.length) {
      setError('لا توجد أسئلة متاحة في بنك هذه الدورة حالياً');
      return;
    }
    setError(''); setOk('');
    const chosen = autoSelectQuestions(courseQuestions, num, usedIds, {
      excludeUsed,
      prioritizeRecommended: true,
    });
    const chosenIds = chosen.map((q) => q.id);
    setSelectedIds(chosenIds);
    applyQuestionsToAssignment(chosen);
    setOk(`تم توليد ${chosen.length} أسئلة ذكية غير مكررة وإدراجها في الواجب تلقائياً`);
  }

  // Replace a single question in auto mode
  function replaceSingleQuestion(oldId: string) {
    const currentSelectedSet = new Set(selectedIds);
    const candidate = courseQuestions.find((q) => {
      if (currentSelectedSet.has(q.id)) return false;
      if (excludeUsed && usedIds.has(q.id)) return false;
      return true;
    });
    if (!candidate) {
      setError('لم يتم العثور على سؤال بديل غير مستخدم');
      return;
    }
    const updatedIds = selectedIds.map((id) => (id === oldId ? candidate.id : id));
    setSelectedIds(updatedIds);
    const map = new Map(courseQuestions.map((q) => [q.id, q]));
    const updatedQuestions = updatedIds.map((id) => map.get(id)).filter(Boolean) as BaseQuestion[];
    applyQuestionsToAssignment(updatedQuestions);
  }

  // Remove a single question in auto mode
  function removeSingleQuestion(idToRemove: string) {
    const updatedIds = selectedIds.filter((id) => id !== idToRemove);
    setSelectedIds(updatedIds);
    const map = new Map(courseQuestions.map((q) => [q.id, q]));
    const updatedQuestions = updatedIds.map((id) => map.get(id)).filter(Boolean) as BaseQuestion[];
    applyQuestionsToAssignment(updatedQuestions);
  }

  // Toggle question in manual mode
  function toggleManualQuestion(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Manual button: Insert selected into assignment
  function handleInsertManualQuestions() {
    if (selectedQuestions.length === 0) {
      setError('يرجى تحديد سؤال واحد على الأقل من القائمة');
      return;
    }
    applyQuestionsToAssignment(selectedQuestions);
    setOk(`تم إدراج ${selectedQuestions.length} سؤالاً في نص الواجب بنجاح`);
  }

  async function onCreate() {
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: f.title,
          courseId: f.courseId || null,
          groupId: f.groupId || null,
          description: f.description,
          dueDate: f.dueDate || null,
          maxScore: Number(f.maxScore) || 100,
          questionIds: f.questionIds,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'فشل الإنشاء');
      setOk('تم إنشاء الواجب بنجاح وحفظه');
      setF({ ...EMPTY });
      setSelectedIds([]);
      setShowForm(false);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل الإنشاء'); }
    finally { setBusy(false); }
  }

  async function onDelete(row: ARow) {
    if (!window.confirm('حذف الواجب وكل تسليماته؟')) return;
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/assignments/' + row.id, { method: 'DELETE' });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || 'فشل الحذف'); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل الحذف'); }
    finally { setBusy(false); }
  }

  async function toggleSubs(row: ARow) {
    if (openId === row.id) { setOpenId(''); return; }
    setOpenId(row.id);
    try {
      const r = await fetch('/api/assignments/' + row.id);
      if (r.ok) { const j = await r.json(); setSubs((p) => ({ ...p, [row.id]: j.submissions || [] })); }
    } catch { setError('تعذر تحميل التسليمات'); }
  }

  async function saveGrade(assignmentId: string, sub: SubRow) {
    const draft = gradeDraft[sub.id];
    const score = Number(draft?.score ?? sub.score ?? NaN);
    setBusy(true); setError(''); setOk('');
    try {
      const r = await fetch('/api/assignments/' + assignmentId + '/grade', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studentId: sub.student_id, score, feedback: draft?.feedback ?? sub.feedback ?? '' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'فشل حفظ الدرجة');
      setOk('تم حفظ الدرجة بنجاح');
      const r2 = await fetch('/api/assignments/' + assignmentId);
      if (r2.ok) { const j2 = await r2.json(); setSubs((p) => ({ ...p, [assignmentId]: j2.submissions || [] })); }
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'فشل حفظ الدرجة'); }
    finally { setBusy(false); }
  }

  return (
    <Shell title="الواجبات" subtitle="إنشاء الواجبات ومتابعة التسليمات والتصحيح مع التوليد الذكي من بنك الأسئلة">
      <div className="space-y-6">
        <div className="toolbar">
          <span className="text-sm text-[color:var(--muted)]">{rows.length} واجباً</span>
          <button className="primary" onClick={() => setShowForm(!showForm)}><Plus size={16} /> واجب جديد</button>
        </div>
        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}

        {showForm && (
          <div className="panel space-y-5">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
              <h3 className="font-extrabold text-base text-[color:var(--text)] flex items-center gap-2">
                <Sparkles size={18} className="text-[color:var(--gold)]" />
                <span>إنشاء واجب تدريبي جديد</span>
              </h3>
              <span className="text-xs text-[color:var(--muted)]">سحب آلي أو يدوي من بنك الأسئلة (+15.4K)</span>
            </div>

            <div className="formGrid">
              <label>العنوان<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="واجب تدريبي — قدرات كمي (النسب المئوية)" /></label>
              <label>الدورة
                <select value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value, groupId: '' })}>
                  <option value="">— اختر الدورة أولاً لسحب الأسئلة —</option>
                  {courses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </label>
              <label>المجموعة (اختياري)
                <select value={f.groupId} onChange={(e) => setF({ ...f, groupId: e.target.value })} disabled={!f.courseId}>
                  <option value="">كل مجموعات الدورة</option>
                  {groups.filter((g) => g.course_id === f.courseId).map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                </select>
              </label>
              <label>تاريخ التسليم<input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></label>
              <label>الدرجة القصوى<input type="number" min={1} value={f.maxScore} onChange={(e) => setF({ ...f, maxScore: Number(e.target.value) })} /></label>
            </div>

            {/* Smart Question Generator Section for Assignments */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[color:var(--muted)]">سحب أسئلة الواجب:</span>
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
                      <span>⚡ أوتوماتيك (توليد فوري)</span>
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
                      <span>✋ يدوي (مع التوصيات الذكية)</span>
                    </button>
                  </div>
                </div>

                {/* Exclude used toggle */}
                <label className="flex items-center gap-2 text-xs font-bold text-[color:var(--text)] cursor-pointer select-none bg-[color:var(--surface-3)] px-3 py-1.5 rounded-xl border border-[color:var(--border)]">
                  <input
                    type="checkbox"
                    checked={excludeUsed}
                    onChange={(e) => setExcludeUsed(e.target.checked)}
                    className="rounded text-[color:var(--gold)] focus:ring-0 cursor-pointer"
                  />
                  <span>🚫 استبعاد الأسئلة المختارة سابقاً في الاختبارات والواجبات</span>
                  {usedIds.size > 0 && (
                    <span className="text-[10px] text-[color:var(--gold)] bg-[color:var(--surface-1)] px-1.5 py-0.5 rounded-md font-mono">
                      ({usedIds.size} مستبعد)
                    </span>
                  )}
                </label>
              </div>

              {/* AUTO MODE IN ASSIGNMENTS */}
              {selectionMode === 'auto' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[color:var(--surface-1)] p-3 rounded-xl border border-[color:var(--border)]">
                    <div>
                      <h4 className="text-xs font-bold text-[color:var(--gold)] flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>اختر عدد الأسئلة ليتم توليدها وإدراجها بنقرة واحدة:</span>
                      </h4>
                      <p className="text-[11px] text-[color:var(--muted)] mt-0.5">
                        تنتقي الخوارزمية الأسئلة الأنسب تربوياً، وتضبط الخيارات، وتحدد الدرجة الكلية للواجب تلقائياً.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[3, 5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleAutoGenerate(num)}
                          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] hover:border-[color:var(--gold)] hover:text-[color:var(--gold)] transition cursor-pointer"
                        >
                          {num} أسئلة
                        </button>
                      ))}
                      {selectedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setSelectedIds([]); setF((p) => ({ ...p, description: '', questionIds: [] })); }}
                          className="px-2.5 py-1 text-xs font-bold text-red-400 hover:underline cursor-pointer"
                        >
                          تفريغ
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ONLY SELECTED QUESTIONS PREVIEW IN AUTO MODE */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-xs text-[color:var(--text)] flex items-center gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        <span>الأسئلة المختارة للواجب ({selectedQuestions.length} سؤالاً محدد)</span>
                      </h4>
                      {selectedQuestions.length > 0 && (
                        <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-800/40">
                          مُدرجة في نص الواجب أدناه
                        </span>
                      )}
                    </div>

                    {selectedQuestions.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-1)]">
                        <Wand2 size={26} className="mx-auto text-[color:var(--gold)] mb-1.5 opacity-60" />
                        <p className="text-xs font-bold text-[color:var(--text)]">لم يتم توليد أي أسئلة للواجب بعد</p>
                        <p className="text-[11px] text-[color:var(--muted)] mt-0.5">
                          اختر الدورة أولاً ثم انقر على عدد الأسئلة أعلاه لتوليدها فوراً وستظهر الأسئلة المختارة فقط هنا.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2 rounded-xl border border-[color:var(--border)] p-3 bg-[color:var(--surface-1)]">
                        {selectedQuestions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-md bg-[color:var(--surface-3)] text-[11px] font-bold flex items-center justify-center text-[color:var(--gold)]">
                                  {idx + 1}
                                </span>
                                {q.topic && (
                                  <span className="text-[10px] text-[color:var(--muted)] bg-[color:var(--surface-3)] px-1.5 py-0.5 rounded">
                                    {q.topic}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Sparkles size={9} />
                                  <span>اختيار الخوارزمية</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="استبدال بسؤال بديل"
                                  onClick={() => replaceSingleQuestion(q.id)}
                                  className="px-2 py-0.5 text-[11px] font-bold text-[color:var(--text-soft)] hover:text-[color:var(--gold)] bg-[color:var(--surface-3)] rounded border border-[color:var(--border)] flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw size={10} />
                                  <span>استبدال</span>
                                </button>
                                <button
                                  type="button"
                                  title="حذف هذا السؤال"
                                  onClick={() => removeSingleQuestion(q.id)}
                                  className="p-1 text-red-400 hover:text-red-300 rounded cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-[color:var(--text)] line-clamp-2">
                              {q.text || 'انظر الشكل المرفق للإجابة عن السؤال'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MANUAL MODE IN ASSIGNMENTS */}
              {selectionMode === 'manual' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[color:var(--surface-1)] p-3 rounded-xl border border-[color:var(--border)]">
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
                        <input
                          type="text"
                          value={manualSearch}
                          onChange={(e) => setManualSearch(e.target.value)}
                          placeholder="ابحث في أسئلة هذه الدورة..."
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
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleInsertManualQuestions}
                        disabled={selectedIds.length === 0}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[color:var(--gold)] text-black disabled:opacity-50 transition cursor-pointer shadow-sm"
                      >
                        📥 إدراج المحددة ({selectedIds.length}) في الواجب
                      </button>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-[color:var(--border)] p-3 bg-[color:var(--surface-1)]">
                    {!f.courseId ? (
                      <p className="text-xs text-[color:var(--muted)] text-center py-6">
                        يرجى اختيار الدورة أولاً من حقل الدورة بالأعلى لعرض أسئلتها.
                      </p>
                    ) : manualFilteredPool.length === 0 ? (
                      <p className="text-xs text-[color:var(--muted)] text-center py-6">
                        لا توجد أسئلة تطابق الفلاتر المحددة لهذه الدورة.
                      </p>
                    ) : (
                      manualFilteredPool.map(({ question: q, isRecommended, isUsed, reasons }) => {
                        const isChecked = selectedIds.includes(q.id);
                        return (
                          <div
                            key={q.id}
                            onClick={() => toggleManualQuestion(q.id)}
                            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                              isChecked
                                ? 'border-[color:var(--gold)] bg-[color:var(--surface-2)] shadow-sm'
                                : 'border-[color:var(--border)] bg-[color:var(--surface-2)] hover:border-[color:var(--border-strong)]'
                            }`}
                          >
                            <div className="mt-0.5 text-[color:var(--gold)]">
                              {isChecked ? <CheckSquare size={17} /> : <Square size={17} className="text-[color:var(--muted)]" />}
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {q.topic && (
                                  <span className="text-[10px] text-[color:var(--muted)] bg-[color:var(--surface-3)] px-1.5 py-0.5 rounded">
                                    {q.topic}
                                  </span>
                                )}
                                {isRecommended && (
                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Sparkles size={9} />
                                    <span>موصى به ({reasons.join(' · ')})</span>
                                  </span>
                                )}
                                {isUsed && (
                                  <span className="text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AlertTriangle size={9} />
                                    <span>مستخدم سابقاً</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[color:var(--text)] font-semibold leading-relaxed">
                                {q.text || 'انظر الشكل المرفق للإجابة عن السؤال'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <label className="block">الوصف / نص أسئلة الواجب والتعليمات
              <textarea
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                rows={6}
                placeholder="تظهر هنا الأسئلة المختارة مع خياراتها الأربعة ودرجة الواجب..."
                className="font-sans text-xs leading-relaxed"
              />
            </label>

            <div className="flex gap-2">
              <button className="primary" disabled={busy || !f.title || !f.courseId} onClick={onCreate}>
                إنشاء الواجب وحفظه
              </button>
              <button className="ghost" onClick={() => setShowForm(false)}>
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rows.length === 0 && <div className="panel p-8 text-center text-[color:var(--muted)]">لا توجد واجبات بعد</div>}
          {rows.map((r) => (
            <div key={r.id} className="panel p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <b>{r.title}</b>
                  <div className="text-xs text-[color:var(--muted)] mt-1">
                    {r.course_name}{r.group_name ? ' · ' + r.group_name : ''}
                    {r.due_date ? ' · التسليم: ' + new Date(r.due_date).toLocaleDateString('ar-EG') : ''}
                    {' · من ' + r.max_score}
                  </div>
                  {r.description && <p className="text-xs text-[color:var(--muted)] mt-1 whitespace-pre-line line-clamp-3">{r.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="badge pending">مُسلّم {r.submitted_count}</span>
                  <span className="badge success">مُصحح {r.graded_count}</span>
                  <button className="ghost !min-h-0 py-1.5 px-3" onClick={() => toggleSubs(r)}>
                    {openId === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />} التسليمات
                  </button>
                  <button className="ghost !min-h-0 py-1.5 px-3 text-[color:var(--danger)]" onClick={() => onDelete(r)} disabled={busy}><Trash2 size={14} /></button>
                </div>
              </div>
              {openId === r.id && (
                <div className="mt-4 space-y-2 border-t border-[color:var(--border)] pt-4">
                  {(subs[r.id] || []).length === 0 && <p className="text-xs text-[color:var(--muted)]">لا تسليمات بعد</p>}
                  {(subs[r.id] || []).map((sub) => (
                    <div key={sub.id} className="p-3 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <b className="text-sm">{sub.student_name} <span className="text-[color:var(--muted)] text-xs">({sub.student_no})</span></b>
                        <span className="text-xs text-[color:var(--muted)]">{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('ar-EG') : 'تسليم ورقي'}</span>
                      </div>
                      {sub.content && <p className="text-sm whitespace-pre-line bg-[color:var(--surface-3)] p-3 rounded-lg">{sub.content}</p>}
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="text-xs">الدرجة (من {r.max_score})
                          <input type="number" min={0} max={Number(r.max_score)} className="w-24" value={gradeDraft[sub.id]?.score ?? (sub.score ?? '')} onChange={(e) => setGradeDraft((p) => ({ ...p, [sub.id]: { score: e.target.value, feedback: p[sub.id]?.feedback ?? sub.feedback ?? '' } }))} />
                        </label>
                        <label className="text-xs flex-1 min-w-48">الملاحظات
                          <input value={gradeDraft[sub.id]?.feedback ?? sub.feedback ?? ''} onChange={(e) => setGradeDraft((p) => ({ ...p, [sub.id]: { score: p[sub.id]?.score ?? String(sub.score ?? ''), feedback: e.target.value } }))} placeholder="ملاحظة للطالب..." />
                        </label>
                        <button className="primary !min-h-0 py-1.5 px-3 text-xs" disabled={busy} onClick={() => saveGrade(r.id, sub)}>حفظ الدرجة</button>
                        {sub.graded_at && <span className="badge success">مُصححة</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
