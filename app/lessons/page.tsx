'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookMarked,
  Plus,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Clock,
  Layers,
} from 'lucide-react';
import Shell from '@/components/Shell';

interface Course {
  id: string;
  name: string;
  code?: string;
}

interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration_minutes: number;
  sort_order: number;
  is_free_preview: boolean;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_order: number;
  lessons: Lesson[];
}

export default function LessonsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Modals state
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState(15);
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');

  // 1) Fetch courses
  useEffect(() => {
    fetch('/api/courses')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Course[]) => {
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load courses', err));
  }, []);

  // 2) Fetch curriculum for selected course
  const loadCurriculum = useCallback(async (courseId: string) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/curriculum`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules || []);
        // Expand all modules by default
        const initialExpanded: Record<string, boolean> = {};
        for (const m of data.modules || []) {
          initialExpanded[m.id] = true;
        }
        setExpandedModules(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to load curriculum', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCurriculum(selectedCourseId);
    }
  }, [selectedCourseId, loadCurriculum]);

  // Handlers
  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleTitle.trim() || !selectedCourseId) return;

    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourseId,
          title: moduleTitle.trim(),
          description: moduleDesc.trim() || null,
          sort_order: modules.length + 1,
        }),
      });

      if (res.ok) {
        setModuleTitle('');
        setModuleDesc('');
        setShowAddModuleModal(false);
        await loadCurriculum(selectedCourseId);
      }
    } catch (err) {
      console.error('Failed to create module', err);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة وجميع دروسها؟')) return;
    try {
      const res = await fetch(`/api/modules?id=${moduleId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCurriculum(selectedCourseId);
      }
    } catch (err) {
      console.error('Failed to delete module', err);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !targetModuleId || !selectedCourseId) return;

    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourseId,
          module_id: targetModuleId,
          title: lessonTitle.trim(),
          content: lessonContent.trim() || null,
          video_url: lessonVideoUrl.trim() || null,
          duration_minutes: Number(lessonDuration) || 0,
          sort_order: 0,
        }),
      });

      if (res.ok) {
        setLessonTitle('');
        setLessonContent('');
        setLessonVideoUrl('');
        setShowAddLessonModal(false);
        await loadCurriculum(selectedCourseId);
      }
    } catch (err) {
      console.error('Failed to create lesson', err);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
      const res = await fetch(`/api/lessons?id=${lessonId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadCurriculum(selectedCourseId);
      }
    } catch (err) {
      console.error('Failed to delete lesson', err);
    }
  };

  return (
    <Shell title="المنهج والدروس" subtitle="إدارة وحدات ودروس الدورات وطباعة خطة المنهج">
      <div className="space-y-6">
        {/* Top Bar: Course Selector + Actions */}
        <div className="panel p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookMarked className="text-[color:var(--gold)]" size={24} />
            <div>
              <label className="block text-xs text-[color:var(--muted)] mb-1">اختر الدورة التدريبية</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-md px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
              >
                {courses.length === 0 ? (
                  <option value="">لا توجد دورات مسجلة</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCourseId && (
              <>
                <a
                  href={`/api/courses/${selectedCourseId}/curriculum/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="ghost flex items-center gap-2 border border-[color:var(--border)] px-3 py-2 rounded-md text-sm font-semibold hover:bg-[color:var(--bg-muted)]"
                >
                  <Printer size={16} />
                  <span>طباعة خطة المنهج (PDF)</span>
                </a>

                <button
                  onClick={() => setShowAddModuleModal(true)}
                  className="primary flex items-center gap-2 bg-[color:var(--gold)] text-slate-900 font-bold px-4 py-2 rounded-md text-sm hover:opacity-95"
                >
                  <Plus size={16} />
                  <span>إضافة وحدة</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modules & Lessons List */}
        {loading ? (
          <div className="panel p-10 text-center text-sm text-[color:var(--muted)]">
            جاري تحميل خطة المنهج...
          </div>
        ) : modules.length === 0 ? (
          <div className="panel p-10 text-center">
            <Layers size={40} className="mx-auto text-[color:var(--gold)] mb-3" />
            <h3 className="font-extrabold text-lg mb-1">لا توجد وحدات تدريبية مضافة بعد</h3>
            <p className="text-sm text-[color:var(--muted)] max-w-md mx-auto leading-7 mb-4">
              ابدأ بإضافة الوحدة الأولى للدورة لتقسيم محتواها الأكاديمي وإدراج الدروس والفيديوهات.
            </p>
            {selectedCourseId && (
              <button
                onClick={() => setShowAddModuleModal(true)}
                className="primary inline-flex items-center gap-2 bg-[color:var(--gold)] text-slate-900 font-bold px-4 py-2 rounded-md text-sm"
              >
                <Plus size={16} />
                <span>إضافة الوحدة الأولى</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((m, mIdx) => (
              <div key={m.id} className="panel border border-[color:var(--border)] rounded-lg overflow-hidden">
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(m.id)}
                  className="p-4 bg-[color:var(--bg-card)] flex items-center justify-between cursor-pointer select-none hover:bg-[color:var(--bg-muted)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[color:var(--gold)]/20 text-[color:var(--gold)] flex items-center justify-center font-bold text-xs">
                      {mIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-base">{m.title}</h4>
                      {m.description && (
                        <p className="text-xs text-[color:var(--muted)] mt-0.5">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs bg-[color:var(--bg-muted)] px-2.5 py-1 rounded-full text-[color:var(--muted)]">
                      {m.lessons.length} درس
                    </span>
                    <button
                      onClick={() => {
                        setTargetModuleId(m.id);
                        setShowAddLessonModal(true);
                      }}
                      className="text-xs font-semibold bg-[color:var(--gold)]/20 text-[color:var(--gold)] hover:bg-[color:var(--gold)]/30 px-3 py-1.5 rounded-md flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>إضافة درس</span>
                    </button>
                    <button
                      onClick={() => handleDeleteModule(m.id)}
                      className="text-red-500 hover:text-red-600 p-1.5 rounded-md hover:bg-red-500/10"
                      title="حذف الوحدة"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => toggleModule(m.id)}
                      className="text-[color:var(--muted)] p-1.5"
                    >
                      {expandedModules[m.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Lessons inside Module */}
                {expandedModules[m.id] && (
                  <div className="border-t border-[color:var(--border)] divide-y divide-[color:var(--border)]">
                    {m.lessons.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[color:var(--muted)]">
                        لا توجد دروس في هذه الوحدة حتى الآن. اضغط على «إضافة درس» لبدء إدخال الدروس.
                      </div>
                    ) : (
                      m.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          className="p-3.5 px-6 flex items-center justify-between hover:bg-[color:var(--bg-muted)]/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[color:var(--muted)] w-5 text-center">
                              {lIdx + 1}
                            </span>
                            {lesson.video_url ? (
                              <Video size={16} className="text-blue-400" />
                            ) : (
                              <FileText size={16} className="text-emerald-400" />
                            )}
                            <div>
                              <span className="font-semibold text-sm">{lesson.title}</span>
                              {lesson.content && (
                                <p className="text-xs text-[color:var(--muted)] line-clamp-1">
                                  {lesson.content}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {lesson.duration_minutes > 0 && (
                              <span className="text-xs text-[color:var(--muted)] flex items-center gap-1">
                                <Clock size={12} />
                                <span>{lesson.duration_minutes} دقيقة</span>
                              </span>
                            )}
                            <button
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="text-red-400 hover:text-red-500 p-1"
                              title="حذف الدرس"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Module */}
        {showAddModuleModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="panel bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-4">إضافة وحدة تدريبية جديدة</h3>
              <form onSubmit={handleCreateModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">عنوان الوحدة</label>
                  <input
                    type="text"
                    required
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="مثال: الوحدة الأولى: مقدمة في علوم البيانات"
                    className="w-full bg-[color:var(--bg-muted)] border border-[color:var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">وصف أو أهداف الوحدة (اختياري)</label>
                  <textarea
                    rows={3}
                    value={moduleDesc}
                    onChange={(e) => setModuleDesc(e.target.value)}
                    placeholder="نبذة مختصرة عما سيتعلمه المتدرب في هذه الوحدة..."
                    className="w-full bg-[color:var(--bg-muted)] border border-[color:var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModuleModal(false)}
                    className="ghost px-4 py-2 text-sm rounded-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="primary bg-[color:var(--gold)] text-slate-900 font-bold px-4 py-2 text-sm rounded-md hover:opacity-95"
                  >
                    حفظ الوحدة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Lesson */}
        {showAddLessonModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="panel bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl max-w-lg w-full p-6 shadow-2xl">
              <h3 className="font-bold text-lg mb-4">إضافة درس جديد للوحدة</h3>
              <form onSubmit={handleCreateLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">عنوان الدرس</label>
                  <input
                    type="text"
                    required
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="مثال: الدرس 1: تهيئة بيئة العمل والمفاهيم الأساسية"
                    className="w-full bg-[color:var(--bg-muted)] border border-[color:var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">المدة التقديرية (بالدقائق)</label>
                    <input
                      type="number"
                      min={1}
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-[color:var(--bg-muted)] border border-[color:var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">رابط الفيديو (اختياري)</label>
                    <input
                      type="url"
                      value={lessonVideoUrl}
                      onChange={(e) => setLessonVideoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[color:var(--bg-muted)] border border-[color:var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">محتوى أو ملخص الدرس (اختياري)</label>
                  <textarea
                    rows={4}
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    placeholder="اكتب تفاصيل وملاحظات الدرس هنا..."
                    className="w-full bg-[color:var(--bg-muted)] border border-[color:var(--border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--gold)]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddLessonModal(false)}
                    className="ghost px-4 py-2 text-sm rounded-md"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="primary bg-[color:var(--gold)] text-slate-900 font-bold px-4 py-2 text-sm rounded-md hover:opacity-95"
                  >
                    حفظ الدرس
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
