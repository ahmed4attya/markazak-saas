"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import CrudPage from "@/components/CrudPage";
import PageStatsCards from "@/components/PageStatsCards";

export default function Teachers() {
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setUserRole(data.role);
      })
      .catch(() => {});
  }, []);

  const isTeacher = userRole === "teacher";

  return (
    <Shell title="المدربون" subtitle="إدارة المدربين والتخصصات والبيانات">
      <div className="space-y-6">
        <div className="space-y-6">
          <PageStatsCards mode="teachers" />

          <CrudPage
            title="مدرب"
            subtitle="إدارة بيانات المدربين والتخصصات"
            endpoint="/api/teachers"
            canCreate={!isTeacher}
            canEdit={!isTeacher}
            canDelete={!isTeacher}
            filters={[
              {
                key: "status",
                label: "الحالة",
                options: [
                  { value: "active", label: "نشط" },
                  { value: "inactive", label: "غير نشط" },
                ],
              },
              {
                key: "specialty",
                label: "التخصص",
                options: [
                  { value: "كمي", label: "قدرات كمي" },
                  { value: "لفظي", label: "قدرات لفظي" },
                  { value: "رياضيات", label: "رياضيات" },
                  { value: "فيزياء", label: "فيزياء" },
                  { value: "كيمياء", label: "كيمياء" },
                  { value: "أحياء", label: "أحياء" },
                  { value: "إنجليزي", label: "لغة إنجليزية" },
                  { value: "تحصيلي", label: "تحصيلي" },
                ],
              },
            ]}
            columns={[
              { key: "name", label: "الاسم" },
              { key: "specialty", label: "التخصص" },
              { key: "phone", label: "الهاتف" },
              { key: "email", label: "البريد" },
              { key: "status", label: "الحالة" },
            ]}
            fields={[
              {
                key: "name",
                label: "اسم المدرب",
                required: true,
              },
              {
                key: "specialty",
                label: "التخصص",
              },
              {
                key: "phone",
                label: "الهاتف",
              },
              {
                key: "email",
                label: "البريد",
                type: "email",
              },
              {
                key: "status",
                label: "الحالة",
                type: "select",
                options: [
                  { value: "active", label: "نشط" },
                  { value: "inactive", label: "غير نشط" },
                ],
              },
            ]}
          />
        </div>
      </div>
    </Shell>
  );
}
