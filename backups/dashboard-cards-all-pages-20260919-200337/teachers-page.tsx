'use client';

import Shell from '@/components/Shell';
import CrudPage from '@/components/CrudPage';

export default function Teachers() {
  return (
    <Shell
      title="المدرسون"
      subtitle="إدارة المدرسين والتخصصات"
    >
      <CrudPage
        title="مدرس"
        subtitle="إدارة بيانات المدرسين وحالتهم"
        endpoint="/api/teachers"
        columns={[
          { key: 'name', label: 'الاسم' },
          { key: 'specialty', label: 'التخصص' },
          { key: 'phone', label: 'الهاتف' },
          { key: 'email', label: 'البريد' },
          { key: 'status', label: 'الحالة' },
        ]}
        fields={[
          {
            key: 'name',
            label: 'اسم المدرس',
            required: true,
          },
          {
            key: 'specialty',
            label: 'التخصص',
          },
          {
            key: 'phone',
            label: 'الهاتف',
          },
          {
            key: 'email',
            label: 'البريد',
            type: 'email',
          },
          {
            key: 'status',
            label: 'الحالة',
            type: 'select',
            options: [
              { value: 'active', label: 'نشط' },
              { value: 'inactive', label: 'غير نشط' },
            ],
          },
        ]}
      />
    </Shell>
  );
}
