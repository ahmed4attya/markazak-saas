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
        const [coursesRes, teachersRes] =
          await Promise.all([
            fetch('/api/courses', {
              cache: 'no-store',
            }),
            fetch('/api/teachers', {
              cache: 'no-store',
            }),
          ]);

        if (coursesRes.ok) {
          const data =
            await coursesRes.json();

          setCourses(
            Array.isArray(data)
              ? data.map((item: any) => ({
                  value: item.id,
                  label: item.name,
                }))
              : []
          );
        }

        if (teachersRes.ok) {
          const data =
            await teachersRes.json();

          setTeachers(
            Array.isArray(data)
              ? data.map((item: any) => ({
                  value: item.id,
                  label:
                    item.name ||
                    [
                      item.first_name,
                      item.last_name,
                    ]
                      .filter(Boolean)
                      .join(' ') ||
                    item.email ||
                    item.id,
                }))
              : []
          );
        }
      } catch (error) {
        console.error(
          'Failed to load group options:',
          error
        );
      }
    }

    loadOptions();
  }, []);

  return (
    <Shell
      title="المجموعات والجداول"
      subtitle="تشغيل الدورات وتنظيم المواعيد والمجموعات"
    >
      <CrudPage
        title="مجموعة"
        subtitle="إدارة المجموعة والدورة والمدرس والجدول"
        endpoint="/api/groups"
        columns={[
          {
            key: 'name',
            label: 'المجموعة',
          },
          {
            key: 'course_name',
            label: 'الدورة',
          },
          {
            key: 'teacher_name',
            label: 'المدرس',
          },
          {
            key: 'student_count',
            label: 'الطلاب',
          },
          {
            key: 'capacity',
            label: 'السعة',
          },
          {
            key: 'status',
            label: 'الحالة',
          },
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
            label: 'المدرس',
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
              {
                value: 'scheduled',
                label: 'مجدولة',
              },
              {
                value: 'active',
                label: 'نشطة',
              },
              {
                value: 'completed',
                label: 'مكتملة',
              },
            ],
          },
        ]}
      />
    </Shell>
  );
}
