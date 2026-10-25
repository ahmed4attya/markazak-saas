"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PortalCourses() {
  const [rows, setRows] = useState<{ id: string; name: string; category: string | null; teacher_names?: string; student_name?: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/learner/courses").then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError("تعذر التحميل"));
  }, []);

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto space-y-3 pt-6">
      <h1 className="text-xl font-extrabold mb-1">دوراتي</h1>
      {error && <div className="error">{error}</div>}
      {rows.length === 0 && <div className="bento-card p-8 text-center text-[color:var(--muted)]">لا توجد دورات مسجلة بعد</div>}
      {rows.map((r) => (
        <div key={r.id + (r.student_name || "")} className="bento-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <b>{r.name}</b>
              {r.category && <span className="badge mr-2">{r.category}</span>}
              <div className="text-xs text-[color:var(--muted)] mt-1">
                {r.student_name ? "الطالب: " + r.student_name : ""}
                {r.teacher_names ? (r.student_name ? " · " : "") + "المعلم: " + r.teacher_names : ""}
              </div>
            </div>
            <span className="badge paid shrink-0">نشطة</span>
          </div>
          <div className="mt-3">
            <Link href={"/portal/courses/" + r.id} className="primary !min-h-0 py-2 px-4 text-xs inline-flex items-center gap-1.5">
              ادخل الدورة <ArrowLeft size={13} />
            </Link>
          </div>
        </div>
      ))}
    </main>
  );
}
