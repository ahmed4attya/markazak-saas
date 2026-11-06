"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Video, FolderOpen, ClipboardList, Play, Download, GraduationCap } from "lucide-react";
import PortalVideoPlayer from "@/components/PortalVideoPlayer";

type Course = { id: string; name: string; category: string | null; teacher_names?: string };
type VRow = { id: string; title: string; course_id?: string; course_name?: string; student_name?: string };
type FRow = { id: string; name: string; size_bytes: number | string; course_id?: string; course_name?: string; student_name?: string };
type ERow = { id: string; title: string; course_name: string; question_count: number; done_count?: number; student_name?: string };
type ARow = { id: string; title: string; course_name: string; due_date: string | null; max_score: number | string; my_score?: number | string | null; student_name?: string };

export default function PortalCourseDetail() {
  const params = useParams<{ id: string }>();
  const courseId = (params?.id as string) || "";
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<VRow[]>([]);
  const [files, setFiles] = useState<FRow[]>([]);
  const [exams, setExams] = useState<ERow[]>([]);
  const [assignments, setAssignments] = useState<ARow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      fetch("/api/learner/courses").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/learner/videos").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/learner/files").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/learner/exams").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/learner/assignments").then((r) => (r.ok ? r.json() : [])),
    ]).then(([courses, videos, files, exams, assignments]) => {
      const c = (Array.isArray(courses) ? courses : []).find((x) => x.id === courseId);
      if (c) setCourse(c);
      setVideos((Array.isArray(videos) ? videos : []).filter((v) => v.course_id === courseId || v.course_name));
      setFiles((Array.isArray(files) ? files : []).filter((f) => f.course_id === courseId || f.course_name));
      setExams((Array.isArray(exams) ? exams : []).filter((x) => x.course_name));
      setAssignments((Array.isArray(assignments) ? assignments : []).filter((x) => x.course_name));
    }).catch(() => setError("تعذر تحميل الدورة")).finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return <main className="p-4 lg:p-8 max-w-3xl mx-auto pt-6"><div className="bento-card p-10 text-center text-[color:var(--muted)]">جاري التحميل…</div></main>;
  }
  if (!course) {
    return (
      <main className="p-4 lg:p-8 max-w-3xl mx-auto pt-6">
        <div className="bento-card p-8 text-center text-[color:var(--danger)]">الدورة غير موجودة أو غير مسجل بها</div>
        <div className="text-center mt-4"><Link href="/portal/courses" className="ghost">رجوع لدوراتي</Link></div>
      </main>
    );
  }

  const myExams = exams.filter((x) => x.course_name === course.name);
  const myAssignments = assignments.filter((x) => x.course_name === course.name);
  const myVideos = videos.filter((v) => v.course_name === course.name);
  const myFiles = files.filter((f) => f.course_name === course.name);

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto pt-6 space-y-6">
      <div className="bento-card p-6">
        <span className="badge">{course.category || "دورة"}</span>
        <h1 className="mt-2 text-2xl font-extrabold">{course.name}</h1>
        {course.teacher_names ? (
          <p className="mt-2 text-sm text-[color:var(--muted)] flex items-center gap-1.5"><GraduationCap size={15} className="text-[color:var(--gold)]" /> المعلم: {course.teacher_names}</p>
        ) : null}
      </div>

      <section>
        <h2 className="font-extrabold mb-3 flex items-center gap-2"><Video size={18} className="text-[color:var(--gold)]" /> الفيديوهات ({myVideos.length})</h2>
        {myVideos.length === 0 && <div className="bento-card p-5 text-center text-sm text-[color:var(--muted)]">لا فيديوهات بعد</div>}
        <div className="space-y-2">
          {myVideos.map((v) => (
            <div key={v.id} className="bento-card p-4 flex items-center justify-between">
              <span>{v.title}{v.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {v.student_name}</span> : null}</span>
              <button onClick={() => setPlaying(v)} className="primary !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"><Play size={12} /> تشغيل</button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-extrabold mb-3 flex items-center gap-2"><FolderOpen size={18} className="text-[color:var(--blue)]" /> الملفات ({myFiles.length})</h2>
        {myFiles.length === 0 && <div className="bento-card p-5 text-center text-sm text-[color:var(--muted)]">لا ملفات بعد</div>}
        <div className="space-y-2">
          {myFiles.map((f) => (
            <div key={f.id} className="bento-card p-4 flex items-center justify-between">
              <span>{f.name}{f.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {f.student_name}</span> : null}</span>
              <a href={"/api/files/" + f.id + "/download"} className="ghost !min-h-0 py-1.5 px-3 text-xs flex items-center gap-1"><Download size={12} /> تحميل</a>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-extrabold mb-3 flex items-center gap-2"><ClipboardList size={18} className="text-[color:var(--rose)]" /> الامتحانات ({myExams.length})</h2>
        {myExams.length === 0 && <div className="bento-card p-5 text-center text-sm text-[color:var(--muted)]">لا امتحانات بعد</div>}
        <div className="space-y-2">
          {myExams.map((e) => (
            <div key={e.id + (e.student_name || "")} className="bento-card p-4 flex items-center justify-between">
              <span>{e.title}{e.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {e.student_name}</span> : null}</span>
              {!e.student_name && <Link href={"/portal/exams/" + e.id} className="primary !min-h-0 py-1.5 px-3 text-xs">ابدأ الامتحان</Link>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-extrabold mb-3 flex items-center gap-2"><BookOpen size={18} className="text-[color:var(--violet)]" /> الواجبات ({myAssignments.length})</h2>
        {myAssignments.length === 0 && <div className="bento-card p-5 text-center text-sm text-[color:var(--muted)]">لا واجبات بعد</div>}
        <div className="space-y-2">
          {myAssignments.map((a) => (
            <div key={a.id + (a.student_name || "")} className="bento-card p-4 flex items-center justify-between">
              <span>{a.title}{a.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {a.student_name}</span> : null}</span>
              <Link href="/portal/assignments" className="ghost !min-h-0 py-1.5 px-3 text-xs">افتح واجباتي</Link>
            </div>
          ))}
        </div>
      </section>

      {playing && (
        <PortalVideoPlayer videoId={playing.id} title={playing.title} onClose={() => setPlaying(null)} />
      )}
    </main>
  );
}
