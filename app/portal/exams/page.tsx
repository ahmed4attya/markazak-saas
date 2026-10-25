"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Clock, CheckCircle2, Play } from "lucide-react";

type ERow = {
  id: string;
  title: string;
  kind: string;
  duration_minutes: number | null;
  course_name: string;
  question_count: number;
  done_count?: number;
  student_name?: string;
};

export default function PortalExams() {
  const [rows, setRows] = useState<ERow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/learner/exams").then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError("تعذر التحميل"));
  }, []);

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto pt-6 space-y-4">
      <div className="rounded-3xl p-6 bg-gradient-to-b from-[color:var(--gold-soft)] to-transparent border border-[color:var(--gold-border)]">
        <span className="rounded-full bg-[color:var(--gold)] text-[#0b0f17] px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5"><Target size={13} /> الامتحانات</span>
        <h1 className="mt-3 text-2xl font-extrabold">اختبر نفسك بجو الاختبار الحقيقي</h1>
        <p className="mt-1.5 text-sm text-[color:var(--muted)]">تدريبات يومية ومحاكاة كاملة بمؤقت حي وتصحيح فوري وتحليل لكل خطأ.</p>
      </div>

      {error && <div className="error">{error}</div>}
      {rows.length === 0 && <div className="bento-card p-8 text-center text-[color:var(--muted)]">لا امتحانات متاحة لدوراتك بعد</div>}

      <div className="space-y-3">
        {rows.map((e) => {
          const done = (e.done_count || 0) > 0;
          return (
            <div key={e.id + (e.student_name || "")} className="bento-card p-5 flex items-center gap-4">
              <div
                className={
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 " +
                  (done ? "border-[color:var(--success)] text-[color:var(--success)]" : "border-[color:var(--gold)] text-[color:var(--gold)]")
                }
                title={done ? "مكتمل" : "متاح"}
              >
                {done ? <CheckCircle2 size={20} /> : <Play size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <b className="block truncate">{e.title}</b>
                <div className="text-xs text-[color:var(--muted)] mt-0.5 flex flex-wrap gap-x-2">
                  <span>{e.course_name}</span>
                  <span>· {e.question_count} سؤال</span>
                  {e.duration_minutes ? <span>· {e.duration_minutes} دقيقة</span> : null}
                  <span>· {e.kind === "simulation" ? "محاكاة كاملة" : "تدريب"}</span>
                  {e.student_name ? <span>· {e.student_name}</span> : null}
                </div>
              </div>
              {e.student_name ? (
                <span className="badge pending shrink-0">متابعة فقط</span>
              ) : (
                <Link href={"/portal/exams/" + e.id} className="primary !min-h-0 py-2 px-4 text-xs shrink-0">
                  {done ? "إعادة" : "ابدأ"} ←
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-[color:var(--muted)]">
        <Clock size={13} /> المؤقت يبدأ مع أول سؤال والحفظ تلقائي كل 12 ثانية
      </div>
    </main>
  );
}
