"use client";

import { useCallback, useEffect, useState } from "react";
import Shell from "@/components/Shell";
import CrudPage from "@/components/CrudPage";
import PageStatsCards from "@/components/PageStatsCards";

export default function Courses() {
  const [teachersList, setTeachersList] = useState<{ id: string; name: string }[]>([]);
  const [allGroups, setAllGroups] = useState<{ id: string; name: string; course_id: string }[]>([]);
  const [tcCourse, setTcCourse] = useState<any>(null);
  const [tcAssigned, setTcAssigned] = useState<string[]>([]);
  const [tcSel, setTcSel] = useState<Record<string, boolean>>({});
  const [tcBusy, setTcBusy] = useState(false);
  const [tcMsg, setTcMsg] = useState("");
  const [stCourse, setStCourse] = useState<any>(null);
  const [stGroupId, setStGroupId] = useState("");
  const [stData, setStData] = useState<{ current: any[]; available: any[] } | null>(null);
  const [stSel, setStSel] = useState<Record<string, { checked: boolean; enrollmentId?: string }>>({});
  const [stBusy, setStBusy] = useState(false);
  const [stMsg, setStMsg] = useState("");

  const loadOptions = useCallback(async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([fetch("/api/users"), fetch("/api/groups")]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setTeachersList((Array.isArray(data) ? data : []).filter((u: any) => u.role === "teacher").map((u: any) => ({ id: u.id, name: u.name })));
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setAllGroups((Array.isArray(data) ? data : []).map((g: any) => ({ id: g.id, name: g.name, course_id: g.course_id })));
      }
    } catch { /* options stay empty */ }
  }, []);

  useEffect(() => { void loadOptions(); }, [loadOptions]);

  async function openTeachers(row: any) {
    setTcCourse(row);
    setTcAssigned([]);
    setTcSel({});
    setTcMsg("");
    try {
      const r = await fetch(`/api/course-teachers?courseId=${row.id}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "تعذر التحميل");
      const ids = (Array.isArray(j) ? j : []).map((u: any) => u.id);
      setTcAssigned(ids);
      const sel: Record<string, boolean> = {};
      for (const id of ids) sel[id] = true;
      setTcSel(sel);
    } catch (e) {
      setTcMsg(e instanceof Error ? e.message : "تعذر التحميل");
    }
  }

  async function saveTeachers() {
    if (!tcCourse) return;
    setTcBusy(true);
    setTcMsg("");
    try {
      for (const t of teachersList) {
        const wanted = tcSel[t.id] || false;
        const was = tcAssigned.includes(t.id);
        if (wanted && !was) {
          const r = await fetch("/api/course-teachers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ courseId: tcCourse.id, userId: t.id }),
          });
          if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "تعذر الإسناد"); }
        }
        if (!wanted && was) {
          const r = await fetch(`/api/course-teachers?courseId=${tcCourse.id}&userId=${t.id}`, { method: "DELETE" });
          if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "تعذر الإزالة"); }
        }
      }
      setTcMsg("تم حفظ إسنادات المعلمين");
      setTcCourse(null);
      window.location.reload();
    } catch (e) {
      setTcMsg(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setTcBusy(false);
    }
  }

  async function openStudents(row: any) {
    setStCourse(row);
    setStGroupId("");
    setStData(null);
    setStMsg("");
  }

  async function loadGroupStudents(gid: string) {
    setStGroupId(gid);
    setStData(null);
    setStSel({});
    if (!gid) return;
    try {
      const r = await fetch(`/api/enrollments?groupId=${gid}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "تعذر التحميل");
      setStData({ current: j.current || [], available: j.available || [] });
      const sel: Record<string, { checked: boolean; enrollmentId?: string }> = {};
      for (const s of j.current || []) sel[s.id] = { checked: true, enrollmentId: s.enrollment_id };
      setStSel(sel);
    } catch (e) {
      setStMsg(e instanceof Error ? e.message : "تعذر التحميل");
    }
  }

  async function saveStudents() {
    if (!stCourse || !stGroupId || !stData) return;
    setStBusy(true);
    setStMsg("");
    try {
      for (const s of stData.available) {
        if (stSel[s.id]?.checked) {
          const r = await fetch("/api/enrollments", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ student_id: s.id, group_id: stGroupId }),
          });
          if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "تعذر الإسناد"); }
        }
      }
      for (const s of stData.current) {
        if (stSel[s.id]?.checked === false && s.enrollment_id) {
          const r = await fetch(`/api/enrollments/${s.enrollment_id}`, { method: "DELETE" });
          if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "تعذر الإزالة"); }
        }
      }
      setStMsg("تم حفظ الإسنادات");
      setStCourse(null);
      window.location.reload();
    } catch (e) {
      setStMsg(e instanceof Error ? e.message : "تعذر الحفظ");
    } finally {
      setStBusy(false);
    }
  }

  const courseGroups = stCourse ? allGroups.filter((g) => g.course_id === stCourse.id) : [];

  return (
    <Shell title="الدورات" subtitle="البرامج التدريبية والمحتوى">
      <div className="space-y-6">
        <PageStatsCards mode="courses" />

        <CrudPage
          title="دورة"
          endpoint="/api/courses"
          columns={[
            { key: "name", label: "الدورة" },
            { key: "category", label: "التصنيف" },
            { key: "teacher_names", label: "المعلمون" },
            { key: "duration_hours", label: "الساعات" },
            { key: "price", label: "السعر" },
            { key: "status", label: "الحالة" },
          ]}
          fields={[
            { key: "name", label: "اسم الدورة", required: true },
            { key: "category", label: "التصنيف", type: "select", options: [
              { value: "قدرات كمي", label: "قدرات كمي" },
              { value: "قدرات لفظي", label: "قدرات لفظي" },
              { value: "تحصيلي", label: "تحصيلي" },
              { value: "أخرى", label: "أخرى" },
            ] },
            { key: "duration_hours", label: "عدد الساعات", type: "number" },
            { key: "price", label: "السعر", type: "number" },
            { key: "description", label: "الوصف", type: "textarea" },
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "active", label: "نشطة" },
                { value: "draft", label: "مسودة" },
                { value: "archived", label: "مؤرشفة" },
              ],
            },
          ]}
          rowActions={(row) => [
            { label: "إسناد معلمين", onClick: () => openTeachers(row) },
            { label: "إسناد طلاب", onClick: () => openStudents(row) },
          ]}
          deleteDialog={() => ({
            notice: "تنبيه: حذف الدورة يحذف معها (cascade) مجموعاتها وتسجيلات الطلاب فيها وأسئلة الدورة وإسنادات المعلمين. لا يمكن التراجع.",
          })}
        />

        {tcCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTcCourse(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-extrabold text-slate-800">إسناد معلمين — {tcCourse.name}</h2>
                <p className="text-xs text-slate-500 mt-1">حسابات دور teacher في مركزك فقط.</p>
              </div>
              <div className="p-5 max-h-96 overflow-y-auto space-y-1.5">
                {teachersList.length === 0 && <p className="text-sm text-slate-500">لا حسابات معلمين — أنشئها من صفحة المستخدمين.</p>}
                {teachersList.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tcSel[t.id] || false}
                      onChange={(e) => setTcSel((p) => ({ ...p, [t.id]: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span>{t.name}</span>
                    {tcAssigned.includes(t.id) && <span className="mr-auto text-[10px] text-emerald-600 font-bold">مُسند حالياً</span>}
                  </label>
                ))}
              </div>
              {tcMsg && <div className="px-5 pb-2 text-xs text-red-600">{tcMsg}</div>}
              <div className="p-5 pt-0 flex justify-end gap-2">
                <button className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl" onClick={() => setTcCourse(null)}>إلغاء</button>
                <button className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50" disabled={tcBusy} onClick={saveTeachers}>
                  {tcBusy ? "جارٍ الحفظ..." : "حفظ الإسنادات"}
                </button>
              </div>
            </div>
          </div>
        )}

        {stCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setStCourse(null)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-extrabold text-slate-800">إسناد طلاب — {stCourse.name}</h2>
                <label className="block text-xs font-bold text-slate-600 mt-3">
                  اختر المجموعة
                  <select value={stGroupId} onChange={(e) => loadGroupStudents(e.target.value)} className="w-full mt-1">
                    <option value="">— اختر —</option>
                    {courseGroups.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                  </select>
                </label>
              </div>
              <div className="p-5 max-h-80 overflow-y-auto space-y-1.5">
                {!stGroupId && <p className="text-sm text-slate-500">اختر مجموعة لعرض الطلاب.</p>}
                {stGroupId && !stData && <p className="text-sm text-slate-500">جاري التحميل...</p>}
                {stData && stData.current.length === 0 && stData.available.length === 0 && (
                  <p className="text-sm text-slate-500">لا طلاب في المركز بعد.</p>
                )}
                {stData && stData.current.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stSel[s.id]?.checked || false}
                      onChange={(e) => setStSel((p) => ({ ...p, [s.id]: { checked: e.target.checked, enrollmentId: s.enrollment_id } }))}
                      className="w-4 h-4"
                    />
                    <span>{s.name} <span className="text-xs text-slate-400">({s.student_no})</span></span>
                    <span className="mr-auto text-[10px] text-emerald-600 font-bold">مسجل حالياً</span>
                  </label>
                ))}
                {stData && stData.available.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stSel[s.id]?.checked || false}
                      onChange={(e) => setStSel((p) => ({ ...p, [s.id]: { checked: e.target.checked } }))}
                      className="w-4 h-4"
                    />
                    <span>{s.name} <span className="text-xs text-slate-400">({s.student_no})</span></span>
                    <span className="mr-auto text-[10px] text-slate-400">{s.type === 'online' ? 'أونلاين' : 'سنتر'}</span>
                  </label>
                ))}
              </div>
              {stMsg && <div className="px-5 pb-2 text-xs text-red-600">{stMsg}</div>}
              <div className="p-5 pt-0 flex justify-end gap-2">
                <button className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl" onClick={() => setStCourse(null)}>إلغاء</button>
                <button className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50" disabled={stBusy || !stGroupId} onClick={saveStudents}>
                  {stBusy ? "جارٍ الحفظ..." : "حفظ الإسنادات"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
