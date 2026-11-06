"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import CrudPage from "@/components/CrudPage";

type Option = {
  value: string;
  label: string;
};

export default function Groups() {
  const [courses, setCourses] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [assignGroup, setAssignGroup] = useState<any>(null);
  const [assignData, setAssignData] = useState<{ current: any[]; available: any[] } | null>(null);
  const [assignSel, setAssignSel] = useState<Record<string, { checked: boolean; enrollmentId?: string }>>({});
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState("");

  async function openAssign(row: any) {
    setAssignGroup(row);
    setAssignData(null);
    setAssignMsg("");
    try {
      const r = await fetch(`/api/enrollments?groupId=${row.id}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "تعذر التحميل");
      setAssignData({ current: j.current || [], available: j.available || [] });
      const sel: Record<string, { checked: boolean; enrollmentId?: string }> = {};
      for (const s of j.current || []) sel[s.id] = { checked: true, enrollmentId: s.enrollment_id };
      setAssignSel(sel);
    } catch (e) {
      setAssignMsg(e instanceof Error ? e.message : "تعذر التحميل");
    }
  }

  async function saveAssign() {
    if (!assignGroup || !assignData) return;
    setAssignBusy(true);
    setAssignMsg("");
    try {
      for (const s of assignData.available) {
        if (assignSel[s.id]?.checked) {
          const r = await fetch("/api/enrollments", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ student_id: s.id, group_id: assignGroup.id }),
          });
          if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "تعذر الإسناد"); }
        }
      }
      for (const s of assignData.current) {
        const wasChecked = assignSel[s.id]?.checked;
        if (wasChecked === false && s.enrollment_id) {
          const r = await fetch(`/api/enrollments/${s.enrollment_id}`, { method: "DELETE" });
          if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "تعذر الإزالة"); }
        }
      }
      setAssignMsg("تم حفظ الإسنادات");
      setAssignGroup(null);
      window.location.reload();
    } catch (e) {
      setAssignMsg(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setAssignBusy(false);
    }
  }

  useEffect(() => {
    async function loadOptions() {
      try {
        const [coursesRes, teachersRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/teachers"),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();

          setCourses(
            Array.isArray(data)
              ? data.map((item: any) => ({
                  value: item.id,
                  label: item.name,
                }))
              : [],
          );
        }

        if (teachersRes.ok) {
          const data = await teachersRes.json();

          setTeachers(
            Array.isArray(data)
              ? data.map((item: any) => ({
                  value: item.id,
                  label:
                    item.name ||
                    [item.first_name, item.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                    item.email ||
                    item.id,
                }))
              : [],
          );
        }
      } catch (error) {
        console.error("Failed to load group options:", error);
      }
    }

    void loadOptions();
  }, []);

  return (
    <Shell
      title="المجموعات والجداول"
      subtitle="تشغيل الدورات والمواعيد وإدارة المجموعات"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="bento-card p-5">
            <p className="text-sm font-bold text-slate-800">المجموعات</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              تنظيم الطلاب والمدربين والجداول في مكان واحد.
            </p>
          </div>

          <div className="bento-card p-5">
            <p className="text-sm font-bold text-slate-800">تشغيل مباشر</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              تعديل وحذف وإدارة حالة المجموعة من البيانات الفعلية.
            </p>
          </div>
        </div>


        <div className="mb-6">
        </div>

        <CrudPage
          title="مجموعة"
          subtitle="إدارة بيانات المجموعة والجدول والمدرب"
          endpoint="/api/groups"
          filters={[
            {
              key: "status",
              label: "الحالة",
              options: [
                { value: "active", label: "نشطة" },
                { value: "completed", label: "مكتملة" },
                { value: "cancelled", label: "ملغاة" },
              ],
            },
            ...(courses.length > 0
              ? [
                  {
                    key: "course_name",
                    label: "الدورة",
                    options: courses.map((c) => ({ value: c.label, label: c.label })),
                  },
                ]
              : []),
          ]}
          rowActions={(row) => [{ label: "إسناد طلاب", onClick: () => openAssign(row) }]}
          columns={[
            { key: "name", label: "المجموعة" },
            { key: "course_name", label: "الدورة" },
            { key: "teacher_name", label: "المدرب" },
            { key: "student_count", label: "الطلاب" },
            { key: "capacity", label: "السعة" },
            { key: "status", label: "الحالة" },
          ]}
          fields={[
            {
              key: "name",
              label: "اسم المجموعة",
              required: true,
            },
            {
              key: "course_id",
              label: "الدورة",
              type: "select",
              required: true,
              options: courses,
            },
            {
              key: "teacher_id",
              label: "المدرب",
              type: "select",
              options: teachers,
            },
            {
              key: "capacity",
              label: "السعة",
              type: "number",
            },
            {
              key: "room",
              label: "القاعة",
            },
            {
              key: "start_date",
              label: "تاريخ البداية",
              type: "date",
            },
            {
              key: "end_date",
              label: "تاريخ النهاية",
              type: "date",
            },
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "scheduled", label: "مجدولة" },
                { value: "active", label: "نشطة" },
                { value: "completed", label: "مكتملة" },
              ],
            },
          ]}
        />

        {assignGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAssignGroup(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-extrabold text-slate-800">إسناد طلاب — {assignGroup.name}</h2>
                <p className="text-xs text-slate-500 mt-1">علّم الطلاب المسجلين وأزل علامة من المتحولين، ثم احفظ.</p>
              </div>
              <div className="p-5 max-h-96 overflow-y-auto space-y-1.5">
                {!assignData && <p className="text-sm text-slate-500">جاري التحميل...</p>}
                {assignData && assignData.current.length === 0 && assignData.available.length === 0 && (
                  <p className="text-sm text-slate-500">لا طلاب في المركز بعد — أضف طلاباً من صفحة الطلاب.</p>
                )}
                {assignData && assignData.current.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignSel[s.id]?.checked || false}
                      onChange={(e) => setAssignSel((p) => ({ ...p, [s.id]: { checked: e.target.checked, enrollmentId: s.enrollment_id } }))}
                      className="w-4 h-4"
                    />
                    <span>{s.name} <span className="text-xs text-slate-400">({s.student_no})</span></span>
                    <span className="mr-auto text-[10px] text-emerald-600 font-bold">مسجل حالياً</span>
                  </label>
                ))}
                {assignData && assignData.available.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignSel[s.id]?.checked || false}
                      onChange={(e) => setAssignSel((p) => ({ ...p, [s.id]: { checked: e.target.checked } }))}
                      className="w-4 h-4"
                    />
                    <span>{s.name} <span className="text-xs text-slate-400">({s.student_no})</span></span>
                    <span className="mr-auto text-[10px] text-slate-400">{s.type === 'online' ? 'أونلاين' : 'سنتر'}</span>
                  </label>
                ))}
              </div>
              {assignMsg && <div className="px-5 pb-2 text-xs text-red-600">{assignMsg}</div>}
              <div className="p-5 pt-0 flex justify-end gap-2">
                <button className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl" onClick={() => setAssignGroup(null)}>إلغاء</button>
                <button className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50" disabled={assignBusy} onClick={saveAssign}>
                  {assignBusy ? "جارٍ الحفظ..." : "حفظ الإسنادات"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
