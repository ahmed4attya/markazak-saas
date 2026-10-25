"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, XCircle, AlertCircle } from "lucide-react";

export default function PortalAttendance() {
  const [rows, setRows] = useState<{ attendance_date: string; status: string; student_name?: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/learner/attendance").then((r) => (r.ok ? r.json() : [])).then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => setError("تعذر التحميل"));
  }, []);

  const LABELS: Record<string, string> = { present: "حاضر", absent: "غائب", late: "متأخر", excused: "معذور" };
  const COLORS: Record<string, string> = { present: "success", absent: "unpaid", late: "partial", excused: "excused" };

  const present = rows.filter((r) => r.status === "present").length;
  const late = rows.filter((r) => r.status === "late").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const excused = rows.filter((r) => r.status === "excused").length;
  const rate = rows.length ? Math.round(((present + late) / rows.length) * 100) : 0;
  const c = 2 * Math.PI * 58;

  return (
    <main className="p-4 lg:p-8 max-w-3xl mx-auto pt-6 space-y-4">
      <h1 className="text-xl font-extrabold mb-1">حضوري</h1>

      <div className="bento-card p-6 flex items-center gap-6">
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="58" stroke="var(--surface-3)" strokeWidth="9" fill="transparent" />
            <circle
              cx="65" cy="65" r="58" stroke="var(--success)" strokeWidth="9" fill="transparent"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c - (c * rate) / 100}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{rate}%</span>
            <span className="text-[10px] text-[color:var(--muted)]">معدل الحضور</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="p-3 rounded-xl bg-[color:var(--success-soft)] text-[color:var(--success)] text-xs font-bold flex items-center gap-2"><CheckCircle2 size={14} /> حاضر {present}</div>
          <div className="p-3 rounded-xl bg-[color:var(--warning-soft)] text-[color:var(--warning)] text-xs font-bold flex items-center gap-2"><Clock3 size={14} /> متأخر {late}</div>
          <div className="p-3 rounded-xl bg-[color:var(--danger-soft)] text-[color:var(--danger)] text-xs font-bold flex items-center gap-2"><XCircle size={14} /> غائب {absent}</div>
          <div className="p-3 rounded-xl bg-[color:var(--blue-soft)] text-[color:var(--blue)] text-xs font-bold flex items-center gap-2"><AlertCircle size={14} /> معذور {excused}</div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {rows.length === 0 && <div className="bento-card p-6 text-center text-[color:var(--muted)]">لا توجد سجلات حضور بعد</div>}
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="bento-card p-4 flex items-center justify-between">
            <span>{new Date(r.attendance_date).toLocaleDateString("ar-EG")}{r.student_name ? <span className="text-xs text-[color:var(--muted)]"> — {r.student_name}</span> : null}</span>
            <span className={"badge " + (COLORS[r.status] || "pending")}>{LABELS[r.status] || r.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
