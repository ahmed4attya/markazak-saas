import Shell from "@/components/Shell";
import CrudPage from "@/components/CrudPage";
import AttendanceSummaryCards from "@/components/AttendanceSummaryCards";
import PageStatsCards from "@/components/PageStatsCards";

export default function Students() {
  return (
    <Shell title="الطلاب" subtitle="ملفات الطلاب والتسجيلات والمتابعة">
      <div className="space-y-6">
        <AttendanceSummaryCards title="حضور الطلاب" />

        <div className="space-y-6">
          <PageStatsCards mode="students" />

          <CrudPage
            title="طالب"
            subtitle="إدارة بيانات الطلاب والتسجيلات والمتابعة"
            endpoint="/api/students"
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
                label: "رقم الطالب",
                required: true,
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
          />
        </div>
      </div>
    </Shell>
  );
}
