import Shell from "@/components/Shell";
import CrudPage from "@/components/CrudPage";
import PageStatsCards from "@/components/PageStatsCards";
export default function Courses() {
  return (
    <Shell title="الدورات" subtitle="البرامج التدريبية والمحتوى">
      <div className="space-y-6">
        <PageStatsCards mode="courses" />

        <CrudPage
          title="دورة"
          endpoint="/api/courses"
          columns={[
            { key: "category", label: "التصنيف" },

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
        />
      </div>
    </Shell>
  );
}
