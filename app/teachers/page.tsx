import Shell from "@/components/Shell";
import CrudPage from "@/components/CrudPage";
import PageStatsCards from "@/components/PageStatsCards";

export default function Teachers() {
  return (
    <Shell title="المدربون" subtitle="إدارة المدربين والتخصصات والبيانات">
      <div className="space-y-6">
        <div className="space-y-6">
          <PageStatsCards mode="teachers" />

          <CrudPage
            title="مدرب"
            subtitle="إدارة بيانات المدربين والتخصصات"
            endpoint="/api/teachers"
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
