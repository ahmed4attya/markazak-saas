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
      </div>
    </Shell>
  );
}
