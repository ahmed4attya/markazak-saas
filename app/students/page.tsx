"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import CrudPage from "@/components/CrudPage";
import PageStatsCards from "@/components/PageStatsCards";

export default function Students() {
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
    <Shell title="الطلاب" subtitle="ملفات الطلاب والتسجيلات والمتابعة">
      <div className="space-y-6">
        <div className="space-y-6">
          <PageStatsCards mode="students" />

          <CrudPage
            title="طالب"
            subtitle="إدارة بيانات الطلاب والتسجيلات والمتابعة"
            endpoint="/api/students"
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
                  { value: "graduated", label: "متخرج" },
                  { value: "suspended", label: "موقوف" },
                ],
              },
              {
                key: "type",
                label: "النوع",
                options: [
                  { value: "center", label: "سنتر (حضوري)" },
                  { value: "online", label: "أونلاين" },
                ],
              },
            ]}
            columns={[
              { key: "student_no", label: "الرقم" },
              { key: "name", label: "الاسم" },
              { key: "type", label: "النوع" },
              { key: "phone", label: "الهاتف" },
              { key: "email", label: "البريد الإلكتروني" },
              { key: "status", label: "الحالة" },
            ]}
            fields={[
              {
                key: "student_no",
                label: "رقم الطالب (يُنشأ تلقائياً في حال تركه فارغاً)",
                required: false,
              },
              {
                key: "name",
                label: "اسم الطالب",
                required: true,
              },
              {
                key: "phone",
                label: "الهاتف",
              },
              {
                key: "email",
                label: "البريد الإلكتروني",
                type: "email",
              },
              {
                key: "identity_no",
                label: "رقم الهوية",
              },
              {
                key: "type",
                label: "النوع",
                type: "select",
                options: [
                  { value: "center", label: "سنتر" },
                  { value: "online", label: "أونلاين" },
                ],
              },
              {
                key: "status",
                label: "الحالة",
                type: "select",
                options: [
                  { value: "active", label: "نشط" },
                  { value: "inactive", label: "غير نشط" },
                  { value: "graduated", label: "متخرج" },
                  { value: "suspended", label: "موقوف" },
                ],
              },
            ]}
            deleteDialog={(row) => ({
              notice:
                "تنبيه: الحذف يزيل تسجيلات الطالب في المجموعات (enrollments) ولا يمكن التراجع." +
                (row.user_id || row.guardian_user_id ? " الطالب مرتبط بحساب دخول." : ""),
              checkboxLabel: row.user_id || row.guardian_user_id
                ? "حذف حساب الدخول المرتبط أيضاً (لن يستطيع الدخول بعد الآن)"
                : undefined,
              checkboxParam: row.user_id || row.guardian_user_id ? "deleteUser" : undefined,
            })}
          />
        </div>
      </div>
    </Shell>
  );
}
