'use client';

import { useEffect, useMemo, useState } from 'react';
import Shell from '@/components/Shell';

type ReportData = {
  summary: any;
  students: any;
  teachers: any;
  courses: any;
  groups: any;
  attendance: any;
  finance: any;
  teacherPerformance: any[];
  coursePerformance: any[];
  invoices: any[];
  payments: any[];
};

const money = (value: any) =>
  Number(value || 0).toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const number = (value: any) =>
  Number(value || 0).toLocaleString('ar-SA');

function Card({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,.08)',
        background: 'rgba(255,255,255,.03)',
      }}
    >
      <div style={{ opacity: 0.7, fontSize: 13 }}>{title}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginTop: 8,
        }}
      >
        {value}
      </div>

      {detail && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            opacity: 0.6,
          }}
        >
          {detail}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2
        style={{
          marginBottom: 14,
          fontSize: 20,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,.08)',
          overflow: 'hidden',
          background: 'rgba(255,255,255,.025)',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: 650,
        }}
      >
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  textAlign: 'right',
                  padding: '14px 16px',
                  borderBottom:
                    '1px solid rgba(255,255,255,.08)',
                  whiteSpace: 'nowrap',
                  fontSize: 13,
                  opacity: 0.75,
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <tr>
      {children}
    </tr>
  );
}

function Cell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: '13px 16px',
        borderBottom:
          '1px solid rgba(255,255,255,.05)',
        fontSize: 13,
      }}
    >
      {children}
    </td>
  );
}

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  const escape = (value: any) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escape).join(','),
    ...data.map((row) =>
      headers.map((key) => escape(row[key])).join(',')
    ),
  ].join('\r\n');

  const blob = new Blob(
    ['\uFEFF' + csv],
    { type: 'text/csv;charset=utf-8;' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadReports() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reports', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'تعذر تحميل التقارير'
        );
      }

      setData(result);
    } catch (err: any) {
      setError(
        err?.message || 'تعذر تحميل التقارير'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const attendance = data?.attendance || {};

  const reportDate = useMemo(
    () =>
      new Intl.DateTimeFormat('ar-SA', {
        dateStyle: 'long',
      }).format(new Date()),
    []
  );

  if (loading) {
    return (
      <Shell
        title="التقارير"
        subtitle="مؤشرات تشغيلية ومالية حقيقية"
      >
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          جاري تحميل التقارير...
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell
        title="التقارير"
        subtitle="مؤشرات تشغيلية ومالية حقيقية"
      >
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            border: '1px solid #ef4444',
          }}
        >
          <strong>تعذر تحميل التقارير</strong>
          <p>{error}</p>

          <button
            className="primary"
            onClick={loadReports}
          >
            إعادة المحاولة
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title="التقارير"
      subtitle={`آخر تحديث: ${reportDate}`}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <button
          className="primary"
          onClick={loadReports}
        >
          تحديث التقارير
        </button>

        <button
          className="ghost"
          onClick={() =>
            exportCSV(
              data.teacherPerformance,
              'teachers-report.csv'
            )
          }
        >
          تصدير تقرير المدربين
        </button>

        <button
          className="ghost"
          onClick={() =>
            exportCSV(
              data.coursePerformance,
              'courses-report.csv'
            )
          }
        >
          تصدير تقرير الدورات
        </button>

        <button
          className="ghost"
          onClick={() =>
            exportCSV(
              data.invoices,
              'invoices-report.csv'
            )
          }
        >
          تصدير الفواتير
        </button>
      </div>

      <Section title="ملخص المركز">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(180px,1fr))',
            gap: 12,
            padding: 16,
          }}
        >
          <Card
            title="الطلاب"
            value={number(data.summary.students)}
            detail={`${number(data.students.active)} نشط`}
          />

          <Card
            title="المدربون"
            value={number(data.summary.teachers)}
            detail={`${number(data.teachers.active)} نشط`}
          />

          <Card
            title="الدورات"
            value={number(data.summary.courses)}
            detail={`${number(data.courses.active)} نشطة`}
          />

          <Card
            title="المجموعات"
            value={number(data.summary.groups)}
            detail={`${number(data.groups.active)} نشطة`}
          />

          <Card
            title="المتدربون المسجلون"
            value={number(data.summary.enrollments)}
          />

          <Card
            title="الإيرادات المحصلة"
            value={`${money(data.summary.revenue)} ر.س`}
          />

          <Card
            title="المبالغ المستحقة"
            value={`${money(data.summary.outstanding)} ر.س`}
          />

          <Card
            title="نسبة الحضور"
            value={`${data.summary.attendance_rate || 0}%`}
            detail={`${number(attendance.present)} حضور`}
          />
        </div>
      </Section>

      <Section title="تقرير الطلاب">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(180px,1fr))',
            gap: 12,
            padding: 16,
          }}
        >
          <Card
            title="إجمالي الطلاب"
            value={number(data.students.total)}
          />

          <Card
            title="نشط"
            value={number(data.students.active)}
          />

          <Card
            title="غير نشط"
            value={number(data.students.inactive)}
          />

          <Card
            title="متخرج"
            value={number(data.students.graduated)}
          />

          <Card
            title="موقوف"
            value={number(data.students.suspended)}
          />
        </div>
      </Section>

      <Section title="تقرير الحضور">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(180px,1fr))',
            gap: 12,
            padding: 16,
          }}
        >
          <Card
            title="إجمالي السجلات"
            value={number(attendance.total)}
          />

          <Card
            title="حضور"
            value={number(attendance.present)}
            detail={`${attendance.attendance_rate || 0}%`}
          />

          <Card
            title="غياب"
            value={number(attendance.absent)}
            detail={`${attendance.absence_rate || 0}%`}
          />

          <Card
            title="تأخر"
            value={number(attendance.late)}
            detail={`${attendance.late_rate || 0}%`}
          />

          <Card
            title="معذور"
            value={number(attendance.excused)}
            detail={`${attendance.excused_rate || 0}%`}
          />
        </div>
      </Section>

      <Section title="التقرير المالي">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(180px,1fr))',
            gap: 12,
            padding: 16,
          }}
        >
          <Card
            title="عدد الفواتير"
            value={number(data.finance.invoices)}
          />

          <Card
            title="إجمالي الفواتير"
            value={`${money(data.finance.invoiced)} ر.س`}
          />

          <Card
            title="المدفوعات"
            value={`${money(data.finance.payments_total)} ر.س`}
          />

          <Card
            title="فواتير مدفوعة"
            value={`${money(data.finance.paid_invoices)} ر.س`}
          />

          <Card
            title="فواتير غير مدفوعة"
            value={`${money(data.finance.unpaid_invoices)} ر.س`}
          />

          <Card
            title="فواتير جزئية"
            value={`${money(data.finance.partial_invoices)} ر.س`}
          />
        </div>
      </Section>

      <Section title="تقرير المدربين">
        {data.teacherPerformance.length === 0 ? (
          <div style={{ padding: 24 }}>
            لا توجد بيانات للمدربين.
          </div>
        ) : (
          <Table
            headers={[
              'المدرب',
              'التخصص',
              'الحالة',
              'المجموعات',
              'الطلاب',
            ]}
          >
            {data.teacherPerformance.map((teacher) => (
              <Row key={teacher.id}>
                <Cell>{teacher.name}</Cell>
                <Cell>{teacher.specialty || '-'}</Cell>
                <Cell>{teacher.status}</Cell>
                <Cell>{number(teacher.groups_count)}</Cell>
                <Cell>{number(teacher.students_count)}</Cell>
              </Row>
            ))}
          </Table>
        )}
      </Section>

      <Section title="تقرير الدورات">
        {data.coursePerformance.length === 0 ? (
          <div style={{ padding: 24 }}>
            لا توجد بيانات للدورات.
          </div>
        ) : (
          <Table
            headers={[
              'الدورة',
              'التصنيف',
              'الحالة',
              'المجموعات',
              'الطلاب',
              'السعر',
              'قيمة التسجيلات',
            ]}
          >
            {data.coursePerformance.map((course) => (
              <Row key={course.id}>
                <Cell>{course.name}</Cell>
                <Cell>{course.category || '-'}</Cell>
                <Cell>{course.status}</Cell>
                <Cell>{number(course.groups_count)}</Cell>
                <Cell>{number(course.students_count)}</Cell>
                <Cell>{money(course.price)} ر.س</Cell>
                <Cell>
                  {money(course.enrollment_value)} ر.س
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Section>

      <Section title="آخر الفواتير">
        {data.invoices.length === 0 ? (
          <div style={{ padding: 24 }}>
            لا توجد فواتير.
          </div>
        ) : (
          <Table
            headers={[
              'رقم الفاتورة',
              'الطالب',
              'المبلغ',
              'المدفوع',
              'المتبقي',
              'الحالة',
              'الاستحقاق',
            ]}
          >
            {data.invoices.map((invoice) => {
              const amount = Number(invoice.amount || 0);
              const paid = Number(invoice.paid || 0);

              return (
                <Row key={invoice.id}>
                  <Cell>{invoice.number || '-'}</Cell>
                  <Cell>{invoice.student_name}</Cell>
                  <Cell>{money(amount)} ر.س</Cell>
                  <Cell>{money(paid)} ر.س</Cell>
                  <Cell>
                    {money(Math.max(amount - paid, 0))} ر.س
                  </Cell>
                  <Cell>{invoice.status}</Cell>
                  <Cell>
                    {invoice.due_date
                      ? new Intl.DateTimeFormat('ar-SA').format(
                          new Date(invoice.due_date)
                        )
                      : '-'}
                  </Cell>
                </Row>
              );
            })}
          </Table>
        )}
      </Section>

      <Section title="آخر المدفوعات">
        {data.payments.length === 0 ? (
          <div style={{ padding: 24 }}>
            لا توجد مدفوعات.
          </div>
        ) : (
          <Table
            headers={[
              'الطالب',
              'الفاتورة',
              'المبلغ',
              'طريقة الدفع',
              'المرجع',
            ]}
          >
            {data.payments.map((payment) => (
              <Row key={payment.id}>
                <Cell>{payment.student_name}</Cell>
                <Cell>
                  {payment.invoice_number || '-'}
                </Cell>
                <Cell>
                  {money(payment.amount)} ر.س
                </Cell>
                <Cell>{payment.method || '-'}</Cell>
                <Cell>
                  {payment.reference || '-'}
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Section>
    </Shell>
  );
}