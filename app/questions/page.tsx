'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  HelpCircle,
  Upload,
  BookOpen,
  Image as ImageIcon,
  X,
  Edit3,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import Shell from '@/components/Shell';

type Question = {
  id: string;
  course_id: string | null;
  domain: string;
  subject: string | null;
  topic: string | null;
  skill: string | null;
  difficulty: number;
  kind: string;
  text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  passage?: string | null;
  image_url?: string | null;
  status?: string;
  created_at: string;
};

type Course = { id: string; name: string };

const DOMAIN_LABELS: Record<string, string> = {
  quant: 'قدرات كمي',
  verbal: 'قدرات لفظي',
  achievement: 'تحصيلي',
};

const OPT_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

const EMPTY_FORM = {
  courseId: '',
  domain: 'quant',
  subject: '',
  topic: '',
  skill: '',
  difficulty: 3,
  text: '',
  passage: '',
  imageUrl: '',
  o1: '',
  o2: '',
  o3: '',
  o4: '',
  correctIndex: 0,
  explanation: '',
};

export default function Questions() {
  const [rows, setRows] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });

  // Modals
  const [previewPassage, setPreviewPassage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Edit Modal State
  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    courseId: string;
    domain: string;
    subject: string;
    topic: string;
    skill: string;
    difficulty: number;
    text: string;
    passage: string;
    imageUrl: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    status: string;
  } | null>(null);

  // Smart Filters
  const [filterDomain, setFilterDomain] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'review' | 'disabled'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterAttachment, setFilterAttachment] = useState<'all' | 'passage' | 'image' | 'both'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial read of URL search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const st = sp.get('status');
      if (st && ['active', 'review', 'disabled'].includes(st)) {
        setFilterStatus(st as any);
      }
      const d = sp.get('domain');
      if (d) setFilterDomain(d);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/questions');
      if (r.ok) {
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
      } else {
        setError('تعذر تحميل بنك الأسئلة');
      }
    } catch {
      setError('تعذر تحميل بنك الأسئلة');
    }
  }, []);

  useEffect(() => {
    load().catch(() => setError('تعذر التحميل'));
  }, [load]);

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setCourses(d);
      })
      .catch(() => {});
  }, []);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Status filter
      if (filterStatus !== 'all' && (r.status || 'active') !== filterStatus) return false;
      // Domain filter
      if (filterDomain && r.domain !== filterDomain) return false;
      // Course filter
      if (filterCourse && r.course_id !== filterCourse) return false;
      // Difficulty filter
      if (filterDifficulty && String(r.difficulty) !== filterDifficulty) return false;
      // Attachment filter
      if (filterAttachment === 'passage' && (!r.passage || !r.passage.trim())) return false;
      if (filterAttachment === 'image' && (!r.image_url || !r.image_url.trim())) return false;
      if (filterAttachment === 'both' && (!r.passage?.trim() || !r.image_url?.trim())) return false;
      // Search query (search in text, options, topic, skill, subject, explanation)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const textMatch = (r.text || '').toLowerCase().includes(q);
        const topicMatch = (r.topic || '').toLowerCase().includes(q);
        const skillMatch = (r.skill || '').toLowerCase().includes(q);
        const subjectMatch = (r.subject || '').toLowerCase().includes(q);
        const expMatch = (r.explanation || '').toLowerCase().includes(q);
        const optMatch = Array.isArray(r.options) && r.options.some((opt) => String(opt || '').toLowerCase().includes(q));
        if (!textMatch && !topicMatch && !skillMatch && !subjectMatch && !expMatch && !optMatch) {
          return false;
        }
      }
      return true;
    });
  }, [rows, filterStatus, filterDomain, filterCourse, filterDifficulty, filterAttachment, searchQuery]);

  // Counts by status for quick segment tabs
  const counts = useMemo(() => {
    let active = 0;
    let review = 0;
    let disabled = 0;
    for (const r of rows) {
      if (r.status === 'review') review++;
      else if (r.status === 'disabled') disabled++;
      else active++;
    }
    return { all: rows.length, active, review, disabled };
  }, [rows]);

  const hasActiveFilters = Boolean(
    filterDomain || filterCourse || filterStatus !== 'all' || filterDifficulty || filterAttachment !== 'all' || searchQuery.trim()
  );

  function resetFilters() {
    setFilterDomain('');
    setFilterCourse('');
    setFilterStatus('all');
    setFilterDifficulty('');
    setFilterAttachment('all');
    setSearchQuery('');
  }

  // Create new question
  async function onSaveNew() {
    setBusy(true);
    setError('');
    setOk('');
    try {
      const options = [f.o1, f.o2, f.o3, f.o4].map((x) => x.trim()).filter(Boolean);
      const r = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseId: f.courseId || null,
          domain: f.domain,
          subject: f.subject,
          topic: f.topic,
          skill: f.skill,
          difficulty: Number(f.difficulty),
          kind: 'mcq',
          text: f.text,
          passage: f.passage.trim() || null,
          imageUrl: f.imageUrl.trim() || null,
          options,
          correctIndex: f.correctIndex,
          explanation: f.explanation,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'فشل الحفظ');
      }
      setOk('تم حفظ السؤال بنجاح');
      setF({ ...EMPTY_FORM });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحفظ');
    } finally {
      setBusy(false);
    }
  }

  // Open Edit Modal
  function openEdit(q: Question) {
    const rawOpts = Array.isArray(q.options) ? q.options : [];
    const opts = rawOpts.length > 0 ? rawOpts.map((o) => String(o || '')) : ['', '', '', ''];
    while (opts.length < 4) opts.push('');

    setEditingQuestion({
      id: q.id,
      courseId: q.course_id || '',
      domain: q.domain || 'quant',
      subject: q.subject || '',
      topic: q.topic || '',
      skill: q.skill || '',
      difficulty: q.difficulty || 3,
      text: q.text || '',
      passage: q.passage || '',
      imageUrl: q.image_url || '',
      options: opts,
      correctIndex: typeof q.correct_index === 'number' ? q.correct_index : 0,
      explanation: q.explanation || '',
      status: q.status || 'active',
    });
  }

  // Save Edit (from modal)
  async function saveEdit(overrideStatus?: string) {
    if (!editingQuestion) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      const cleanOpts = editingQuestion.options.map((x) => x.trim()).filter(Boolean);
      if (cleanOpts.length < 2) {
        throw new Error('يجب تحديد خيارين للإجابة على الأقل');
      }
      if (editingQuestion.correctIndex >= cleanOpts.length) {
        throw new Error('يرجى اختيار إجابة صحيحة صالحة من بين الخيارات المتاحة');
      }

      const nextStatus = overrideStatus || editingQuestion.status;

      const r = await fetch('/api/questions', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: editingQuestion.id,
          text: editingQuestion.text,
          options: cleanOpts,
          correctIndex: editingQuestion.correctIndex,
          explanation: editingQuestion.explanation,
          passage: editingQuestion.passage.trim() || null,
          imageUrl: editingQuestion.imageUrl.trim() || null,
          difficulty: Number(editingQuestion.difficulty),
          domain: editingQuestion.domain,
          subject: editingQuestion.subject || null,
          topic: editingQuestion.topic || null,
          skill: editingQuestion.skill || null,
          courseId: editingQuestion.courseId || null,
          status: nextStatus,
        }),
      });

      const resData = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(resData.error || 'تعذر حفظ التعديلات');

      setOk(
        nextStatus === 'active' && editingQuestion.status === 'review'
          ? '✓ تم حفظ السؤال واعتماده كنَشِط ليظهر للطلاب'
          : '✓ تم حفظ تعديلات السؤال بنجاح'
      );
      setEditingQuestion(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر حفظ التعديلات');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: Question) {
    if (!window.confirm('حذف هذا السؤال نهائياً من بنك الأسئلة؟')) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/questions?id=' + row.id, { method: 'DELETE' });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || 'فشل الحذف');
      }
      setOk('تم حذف السؤال');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل الحذف');
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(row: Question) {
    const next = row.status === 'active' ? 'disabled' : 'active';
    setBusy(true);
    setError('');
    setOk('');
    try {
      const r = await fetch('/api/questions', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: row.id, status: next }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || 'فشل التحديث');
      }
      setOk(next === 'active' ? 'تم تفعيل السؤال — سيظهر للطلاب' : 'تم تعطيل السؤال — لن يظهر في الامتحانات');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'فشل التحديث');
    } finally {
      setBusy(false);
    }
  }

  function setCreateOpt(i: number, v: string) {
    const key = ('o' + (i + 1)) as 'o1' | 'o2' | 'o3' | 'o4';
    setF((p) => ({ ...p, [key]: v }));
  }

  return (
    <Shell
      title="بنك الأسئلة"
      subtitle="إدارة أسئلة القدرات والتحصيلي — تصفية ذكية، مراجعة المسودات، تعديل الأسئلة وإجاباتها، والقطع والأشكال"
    >
      <div className="space-y-6" dir="rtl">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {ok && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{ok}</span>
          </div>
        )}

        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Quick Segment Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              كل الأسئلة ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900'
              }`}
            >
              النشطة ({counts.active})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('review')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'review'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-700 dark:text-amber-400 hover:text-amber-900'
              }`}
            >
              قيد المراجعة / مسودات ({counts.review})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('disabled')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'disabled'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              المعطلة ({counts.disabled})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/questions/import"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <Upload size={15} />
              <span>استيراد أسئلة (نماذج / PDF / AI)</span>
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={15} />
              <span>سؤال جديد</span>
            </button>
          </div>
        </div>

        {/* Smart Filters Toolbar */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Filter size={15} className="text-blue-500" />
              <span>الفلاتر الذكية والبحث المتقدم</span>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-500">
                عرض {filteredRows.length} من أصل {rows.length}
              </span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>إعادة ضبط الفلاتر</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative group lg:col-span-2">
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في السؤال، الخيارات، المهارة، الشرح..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Domain Filter */}
            <div>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">كل المجالات (كمي/لفظي/تحصيلي)</option>
                <option value="quant">قدرات كمي</option>
                <option value="verbal">قدرات لفظي</option>
                <option value="achievement">تحصيلي</option>
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">كل الدورات التدريبية</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Attachments Filter */}
            <div>
              <select
                value={filterAttachment}
                onChange={(e) => setFilterAttachment(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">كل الملحقات (قطعة/شكل)</option>
                <option value="passage">📖 يحتوي على قطعة مقروءة</option>
                <option value="image">🖼️ يحتوي على شكل هندسي/رسم</option>
                <option value="both">📖+🖼️ يحتوي على قطعة وشكل</option>
              </select>
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-blue-500" />
                <span>إضافة سؤال جديد إلى بنك الأسئلة</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <label className="space-y-1 block">
                <span className="font-bold text-slate-700 dark:text-slate-300">الدورة (اختياري)</span>
                <select
                  value={f.courseId}
                  onChange={(e) => setF({ ...f, courseId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="">سؤال عام (للمركز كله)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 block">
                <span className="font-bold text-slate-700 dark:text-slate-300">المجال الرئيسي</span>
                <select
                  value={f.domain}
                  onChange={(e) => setF({ ...f, domain: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value="quant">قدرات كمي</option>
                  <option value="verbal">قدرات لفظي</option>
                  <option value="achievement">تحصيلي</option>
                </select>
              </label>

              <label className="space-y-1 block">
                <span className="font-bold text-slate-700 dark:text-slate-300">الموضوع</span>
                <input
                  value={f.topic}
                  onChange={(e) => setF({ ...f, topic: e.target.value })}
                  placeholder="مثال: التناسب الطردي، التناظر اللفظي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1 block">
                <span className="font-bold text-slate-700 dark:text-slate-300">الصعوبة (1-5)</span>
                <select
                  value={f.difficulty}
                  onChange={(e) => setF({ ...f, difficulty: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                >
                  <option value={1}>★ سهل جداً (1)</option>
                  <option value={2}>★★ سهل (2)</option>
                  <option value={3}>★★★ متوسط (3)</option>
                  <option value={4}>★★★★ متقدم (4)</option>
                  <option value={5}>★★★★★ صعب / للتفوق (5)</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                القطعة المقروءة (اختياري — لأسئلة استيعاب المقروء)
              </span>
              <textarea
                value={f.passage}
                onChange={(e) => setF({ ...f, passage: e.target.value })}
                rows={2}
                placeholder="ألصق نص القطعة إن كان السؤال يعتمد على قراءة نص..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                رابط الصورة أو الشكل الهندسي (اختياري)
              </span>
              <input
                value={f.imageUrl}
                onChange={(e) => setF({ ...f, imageUrl: e.target.value })}
                placeholder="https://... رابط صورة الشكل التوضيحي"
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-left outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">نص السؤال *</span>
              <textarea
                value={f.text}
                onChange={(e) => setF({ ...f, text: e.target.value })}
                rows={2}
                placeholder="اكتب نص السؤال هنا..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-blue-500 font-medium"
              />
            </label>

            {/* Options */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">خيارات الإجابة وحدد الإجابة الصحيحة *</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => {
                  const optKey = ('o' + (i + 1)) as 'o1' | 'o2' | 'o3' | 'o4';
                  const isCorrect = f.correctIndex === i;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setF({ ...f, correctIndex: i })}
                        className={`h-6 w-6 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center transition cursor-pointer ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                        title="انقر لتحديد هذا الخيار كإجابة صحيحة"
                      >
                        {OPT_LETTERS[i]}
                      </button>
                      <input
                        value={f[optKey]}
                        onChange={(e) => setCreateOpt(i, e.target.value)}
                        placeholder={`نص الخيار (${OPT_LETTERS[i]})${isCorrect ? ' ✓ الصحيح' : ''}`}
                        className="w-full bg-transparent outline-none text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-1 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">شرح طريقة الحل (تغذية المراجعة الذكية)</span>
              <textarea
                value={f.explanation}
                onChange={(e) => setF({ ...f, explanation: e.target.value })}
                rows={2}
                placeholder="شرح طريقة الحل الصحيحة خطوة بخطوة..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-blue-500"
              />
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                onClick={() => setShowForm(false)}
              >
                إلغاء
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={busy || !f.text.trim()}
                onClick={onSaveNew}
              >
                {busy ? 'جارٍ الحفظ…' : 'حفظ السؤال'}
              </button>
            </div>
          </div>
        )}

        {/* Questions Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700/80">
                <tr>
                  <th className="px-4 py-3 font-bold">#</th>
                  <th className="px-4 py-3 font-bold">السؤال والخيارات</th>
                  <th className="px-4 py-3 font-bold text-center">المجال والموضوع</th>
                  <th className="px-4 py-3 font-bold text-center">الصعوبة</th>
                  <th className="px-4 py-3 font-bold text-center">الحالة</th>
                  <th className="px-4 py-3 font-bold text-center min-w-[130px]">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      {hasActiveFilters
                        ? 'لا توجد أسئلة تطابق الفلاتر المحددة — جرب تفريغ الفلاتر'
                        : 'بنك الأسئلة فارغ حالياً — أضف سؤالاً جديداً أو استورد أسئلة'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => {
                    const rawOpts = Array.isArray(r.options) ? r.options : [];
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-3 max-w-lg space-y-1.5">
                          {/* Question text with click to edit */}
                          <div
                            onClick={() => openEdit(r)}
                            className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                            title="انقر لتعديل هذا السؤال"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <HelpCircle size={14} className="text-blue-500 shrink-0" />
                              <span>{r.text}</span>
                            </span>
                          </div>

                          {/* Options pills with correct answer highlighted */}
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {rawOpts.map((opt, optIdx) => {
                              const isCorrect = r.correct_index === optIdx;
                              return (
                                <span
                                  key={optIdx}
                                  onClick={() => openEdit(r)}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border cursor-pointer transition ${
                                    isCorrect
                                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-500/20'
                                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400'
                                  }`}
                                  title={isCorrect ? 'الإجابة الصحيحة المحددة' : 'خيار إجابة'}
                                >
                                  <strong>{OPT_LETTERS[optIdx] || optIdx + 1}:</strong>
                                  <span className="truncate max-w-[130px]">{String(opt)}</span>
                                  {isCorrect && <span className="text-emerald-500 font-bold">✓</span>}
                                </span>
                              );
                            })}
                          </div>

                          {/* Attachments preview buttons */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {r.passage && (
                              <button
                                type="button"
                                onClick={() => setPreviewPassage(r.passage || '')}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md hover:bg-amber-500/20 transition cursor-pointer"
                              >
                                <BookOpen size={11} />
                                <span>قطعة مقروءة</span>
                              </button>
                            )}
                            {r.image_url && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(r.image_url || '')}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md hover:bg-blue-500/20 transition cursor-pointer"
                              >
                                <ImageIcon size={11} />
                                <span>شكل هندسي</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {DOMAIN_LABELS[r.domain] || r.domain}
                            </span>
                            <span className="text-[11px] text-slate-400">{r.topic || '—'}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-amber-500 tracking-wider">
                          {'★'.repeat(r.difficulty || 3)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              r.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : r.status === 'review'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {r.status === 'active' ? 'نشط' : r.status === 'review' ? 'قيد المراجعة' : 'معطل'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition cursor-pointer border border-blue-200 dark:border-blue-900/60"
                              title="تعديل السؤال والإجابات"
                            >
                              <Edit3 size={13} />
                              <span>تعديل</span>
                            </button>

                            {/* Status Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleStatus(r)}
                              disabled={busy}
                              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                r.status === 'active'
                                  ? 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              {r.status === 'active' ? 'تعطيل' : 'تفعيل'}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => onDelete(r)}
                              disabled={busy}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="حذف السؤال"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Full Question Edit Modal (نافذة تعديل السؤال والإجابات الشاملة) */}
        {/* ============================================================== */}
        {editingQuestion && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setEditingQuestion(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      تعديل السؤال والإجابة الصحيحة
                    </h3>
                    <p className="text-xs text-slate-400">
                      قم بتصحيح نص السؤال، الخيارات، تحديد الإجابة الصحيحة، وتحديث القطعة أو الشكل التوضيحي.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 space-y-4 pr-1 pl-1 text-xs">
                {/* Meta classification row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <label className="space-y-1 block">
                    <span className="font-bold text-slate-700 dark:text-slate-300">المجال</span>
                    <select
                      value={editingQuestion.domain}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, domain: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="quant">قدرات كمي</option>
                      <option value="verbal">قدرات لفظي</option>
                      <option value="achievement">تحصيلي</option>
                    </select>
                  </label>

                  <label className="space-y-1 block">
                    <span className="font-bold text-slate-700 dark:text-slate-300">الدورة التدريبية</span>
                    <select
                      value={editingQuestion.courseId}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, courseId: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value="">سؤال عام (للمركز)</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 block">
                    <span className="font-bold text-slate-700 dark:text-slate-300">الموضوع / المهارة</span>
                    <input
                      value={editingQuestion.topic}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                      placeholder="الموضوع أو المهارة..."
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="font-bold text-slate-700 dark:text-slate-300">الصعوبة</span>
                    <select
                      value={editingQuestion.difficulty}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, difficulty: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    >
                      <option value={1}>★ سهل جداً (1)</option>
                      <option value={2}>★★ سهل (2)</option>
                      <option value={3}>★★★ متوسط (3)</option>
                      <option value={4}>★★★★ متقدم (4)</option>
                      <option value={5}>★★★★★ صعب (5)</option>
                    </select>
                  </label>
                </div>

                {/* Question Text */}
                <label className="block space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">نص السؤال *</span>
                  <textarea
                    value={editingQuestion.text}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                    rows={3}
                    placeholder="اكتب أو عدّل نص السؤال هنا..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium leading-relaxed outline-none focus:border-blue-500"
                  />
                </label>

                {/* Options List with Interactive Correct Answer Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      خيارات الإجابة — انقر على الحرف لتحديد الإجابة الصحيحة ✓
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingQuestion.options.length < 6) {
                          setEditingQuestion({
                            ...editingQuestion,
                            options: [...editingQuestion.options, ''],
                          });
                        }
                      }}
                      disabled={editingQuestion.options.length >= 6}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40"
                    >
                      + إضافة خيار إضافي
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {editingQuestion.options.map((optText, optIdx) => {
                      const isCorrect = editingQuestion.correctIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          {/* 1-click correct answer button */}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingQuestion({
                                ...editingQuestion,
                                correctIndex: optIdx,
                              })
                            }
                            className={`h-7 w-7 rounded-lg text-xs font-black shrink-0 flex items-center justify-center transition cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                            title="اضغط هنا لتحديد هذا الخيار كإجابة صحيحة"
                          >
                            {OPT_LETTERS[optIdx] || optIdx + 1}
                          </button>

                          <input
                            type="text"
                            value={optText}
                            onChange={(e) => {
                              const updated = [...editingQuestion.options];
                              updated[optIdx] = e.target.value;
                              setEditingQuestion({
                                ...editingQuestion,
                                options: updated,
                              });
                            }}
                            placeholder={`الخيار (${OPT_LETTERS[optIdx] || optIdx + 1})${isCorrect ? ' ✓ الإجابة الصحيحة' : ''}`}
                            className="w-full bg-transparent outline-none text-xs font-medium"
                          />

                          {isCorrect && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm shrink-0">
                              ✓
                            </span>
                          )}

                          {editingQuestion.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = editingQuestion.options.filter((_, i) => i !== optIdx);
                                const newCorrect =
                                  editingQuestion.correctIndex === optIdx
                                    ? 0
                                    : editingQuestion.correctIndex > optIdx
                                    ? editingQuestion.correctIndex - 1
                                    : editingQuestion.correctIndex;
                                setEditingQuestion({
                                  ...editingQuestion,
                                  options: updated,
                                  correctIndex: newCorrect,
                                });
                              }}
                              className="text-slate-300 hover:text-red-500 p-1 shrink-0"
                              title="حذف هذا الخيار"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                <label className="block space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    شرح طريقة الحل (تغذية المراجعة الذكية للطلاب)
                  </span>
                  <textarea
                    value={editingQuestion.explanation}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        explanation: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="شرح طريقة الوصول للحل الصحيح خطوة بخطوة..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:border-blue-500"
                  />
                </label>

                {/* Passage & Image Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Reading Passage */}
                  <label className="block space-y-1">
                    <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <BookOpen size={13} />
                      <span>القطعة المقروءة المرتبطة (استيعاب المقروء)</span>
                    </span>
                    <textarea
                      value={editingQuestion.passage}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          passage: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="نص القطعة أو المقال الذي يستند عليه السؤال..."
                      className="w-full px-3 py-2 rounded-xl border border-amber-300/60 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 outline-none focus:border-amber-500"
                    />
                  </label>

                  {/* Figure / Image */}
                  <div className="space-y-1">
                    <span className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <ImageIcon size={13} />
                      <span>رابط الشكل الهندسي / الصورة التوضيحية</span>
                    </span>
                    <input
                      type="url"
                      value={editingQuestion.imageUrl}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="https://... رابط الصورة المباشر"
                      dir="ltr"
                      className="w-full px-3 py-2 rounded-xl border border-blue-300/60 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-left outline-none focus:border-blue-500 text-xs"
                    />
                    {editingQuestion.imageUrl && (
                      <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={editingQuestion.imageUrl}
                          alt="معاينة الشكل"
                          className="h-12 w-auto object-contain rounded border border-slate-200"
                        />
                        <span className="text-[11px] text-slate-500">معاينة حية لشكل السؤال</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Selection */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">حالة السؤال:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, status: 'active' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        editingQuestion.status === 'active'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      نشط (يظهر للطلاب)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, status: 'review' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        editingQuestion.status === 'review'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      مسودة / قيد المراجعة
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion({ ...editingQuestion, status: 'disabled' })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        editingQuestion.status === 'disabled'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      معطل
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {editingQuestion.status === 'review' && (
                    <button
                      type="button"
                      onClick={() => saveEdit('active')}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      <span>حفظ واعتماد السؤال كنَشِط ✓</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => saveEdit()}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <span>{busy ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for passage preview */}
        {previewPassage && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewPassage(null)}
          >
            <div
              className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-amber-600" size={20} />
                  <h3 className="font-extrabold text-lg">القطعة المقروءة المرتبطة بالسؤال</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPassage(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 leading-relaxed whitespace-pre-line text-sm p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                {previewPassage}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                  onClick={() => setPreviewPassage(null)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for image preview */}
        {previewImage && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 p-2 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X size={18} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage} alt="شكل هندسي" className="max-h-[80vh] w-auto object-contain rounded-xl" />
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
