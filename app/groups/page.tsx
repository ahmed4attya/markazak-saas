'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import CrudPage from '@/components/CrudPage';

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
          fetch('/api/courses'),
          fetch('/api/teachers'),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(
            data.map((item: any) => ({
              value: item.id,
              label: item.name,
            }))
          );
        }

        if (teachersRes.ok) {
          const data = await teachersRes.json();
          setTeachers(
            data.map((item: any) => ({
              value: item.id,
              label:
                item.name ||
                [item.first_name, item.last_name].filter(Boolean).join(' ') ||
                item.email ||
                item.id,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load group options:', error);
      }
    }

    loadOptions();
  }, []);

  return (
    <Shell
      title="المجموعات والجداول"
      subtitle="تشغيل الدورات والمواعيد"
    >
      <div className="pageIntroCards">
        <div className="contextCard"><b>المجموعات</b><span>تنظيم الطلاب والمدربين والجداول في مكان واحد</span></div>
        <div className="contextCard"><b>تشغيل مباشر</b><span>التعديل والحذف والحالة مرتبطة ببيانات النظام الفعلية</span></div>
      </div>
      <CrudPage
        title="مجموعة"
        endpoint="/api/groups"
        columns={[
          { key: 'name', label: 'المجموعة' },
          { key: 'course_name', label: 'الدورة' },
          { key: 'teacher_name', label: 'المدرب' },
          { key: 'student_count', label: 'الطلاب' },
          { key: 'capacity', label: 'السعة' },
          { key: 'status', label: 'الحالة' },
        ]}
        fields={[
          {
            key: 'name',
            label: 'اسم المجموعة',
            required: true,
          },
          {
            key: 'course_id',
            label: 'الدورة',
            type: 'select',
            required: true,
            options: courses,
          },
          {
            key: 'teacher_id',
            label: 'المدرب',
            type: 'select',
            options: teachers,
          },
          {
            key: 'capacity',
            label: 'السعة',
            type: 'number',
          },
          {
            key: 'room',
            label: 'القاعة',
          },
          {
            key: 'start_date',
            label: 'تاريخ البداية',
            type: 'date',
          },
          {
            key: 'end_date',
            label: 'تاريخ النهاية',
            type: 'date',
          },
          {
            key: 'status',
            label: 'الحالة',
            type: 'select',
            options: [
              { value: 'scheduled', label: 'مجدولة' },
              { value: 'active', label: 'نشطة' },
              { value: 'completed', label: 'مكتملة' },
            ],
          },
        ]}
      />
    </Shell>
  );
}