'use client';

import { FormEvent, useEffect, useState } from 'react';
import Shell from '@/components/Shell';

type Student = {
  id: string;
  student_no?: string;
  name: string;
};

type Course = {
  id: string;
  name: string;
  category?: string;
};

type Certificate = {
  id: string;
  number: string;
  issued_at: string;
  grade?: string | null;
  status: string;
  verify_token: string;
  student_id: string;
  student_name: string;
  student_no?: string;
  course_id: string;
  course_name: string;
};

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [studentId, setStudentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [grade, setGrade] = useState('');

  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [certRes, studentRes, courseRes] = await Promise.all([
        fetch('/api/certificates', { cache: 'no-store' }),
        fetch('/api/students', { cache: 'no-store' }),
        fetch('/api/courses', { cache: 'no-store' }),
      ]);

      if (!certRes.ok) {
        throw new Error('تعذر تحميل الشهادات');
      }

      if (!studentRes.ok) {
        throw new Error('تعذر تحميل الطلاب');
      }

      if (!courseRes.ok) {
        throw new Error('تعذر تحميل الدورات');
      }

      const certData = await certRes.json();
      const studentData = await studentRes.json();
      const courseData = await courseRes.json();

      setCertificates(Array.isArray(certData) ? certData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setCourses(Array.isArray(courseData) ? courseData : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تحميل البيانات'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function issueCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!studentId || !courseId) {
      setError('اختر الطالب والدورة أولاً');
      return;
    }

    setIssuing(true);

    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          course_id: courseId,
          grade: grade.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            data.error || 'تم إصدار شهادة لهذا الطالب في هذه الدورة مسبقًا'
          );
        }

        throw new Error(data.error || 'تعذر إصدار الشهادة');
      }

      const certificate = data.certificate as Certificate;

      setCertificates((current) => [
        certificate,
        ...current.filter((item) => item.id !== certificate.id),
      ]);

      setStudentId('');
      setCourseId('');
      setGrade('');

      setSuccess(
        `تم إصدار الشهادة بنجاح: ${certificate.number}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر إصدار الشهادة'
      );
    } finally {
      setIssuing(false);
    }
  }

  function formatDate(value: string) {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  function openVerification(number: string) {
    window.open(
      `/verify?number=${encodeURIComponent(number)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  return (
    <Shell
      title="الشهادات"
      subtitle="إصدار وإدارة والتحقق من شهادات إتمام التدريب"
    >
      <div style={{ display: 'grid', gap: 24 }}>

        <div className="featureGrid">
          <div className="featureCard">
            <span className="featureIcon">
              ✓
            </span>

            <h3>إصدار شهادة</h3>

            <p>
              إصدار شهادة رقمية مرتبطة بالطالب والدورة مع رقم فريد للتحقق.
            </p>

            <span className="ghost">
              {certificates.length} شهادة صادرة
            </span>
          </div>

          <div className="featureCard">
            <span className="featureIcon">
              ⌁
            </span>

            <h3>التحقق العام</h3>

            <p>
              التحقق من صحة الشهادة من خلال رقم الشهادة دون تسجيل دخول.
            </p>

            <a className="ghost" href="/verify">
              فتح صفحة التحقق
            </a>
          </div>

          <div className="featureCard">
            <span className="featureIcon">
              PDF
            </span>

            <h3>الشهادات الرقمية</h3>

            <p>
              كل شهادة تحتوي على رقم فريد ورمز تحقق يمكن استخدامه للتحقق.
            </p>

            <span className="ghost">
              جاهز للتحقق
            </span>
          </div>
        </div>

        <section className="panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>إصدار شهادة جديدة</h2>
              <p style={{ marginTop: 6 }}>
                اختر الطالب والدورة ثم أصدر الشهادة.
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: 16,
                borderRadius: 10,
                border: '1px solid #ef4444',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: 16,
                borderRadius: 10,
                border: '1px solid #22c55e',
              }}
            >
              {success}
            </div>
          )}

          <form
            onSubmit={issueCertificate}
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <label>
              <span>الطالب</span>

              <select
                value={studentId}
                onChange={(event) =>
                  setStudentId(event.target.value)
                }
                disabled={issuing || loading}
                required
              >
                <option value="">اختر الطالب</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_no
                      ? `${student.student_no} - ${student.name}`
                      : student.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>الدورة</span>

              <select
                value={courseId}
                onChange={(event) =>
                  setCourseId(event.target.value)
                }
                disabled={issuing || loading}
                required
              >
                <option value="">اختر الدورة</option>

                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>التقدير</span>

              <input
                type="text"
                value={grade}
                onChange={(event) =>
                  setGrade(event.target.value)
                }
                placeholder="مثال: ممتاز"
                disabled={issuing}
              />
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'end',
              }}
            >
              <button
                type="submit"
                className="primary"
                disabled={issuing || loading}
                style={{
                  width: '100%',
                  minHeight: 44,
                }}
              >
                {issuing ? 'جاري الإصدار...' : 'إصدار الشهادة'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>الشهادات الصادرة</h2>

              <p style={{ marginTop: 6 }}>
                قائمة الشهادات المسجلة في المركز.
              </p>
            </div>

            <button
              type="button"
              className="ghost"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : 'تحديث'}
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 24 }}>
              جاري تحميل الشهادات...
            </div>
          ) : certificates.length === 0 ? (
            <div style={{ padding: 24 }}>
              لا توجد شهادات صادرة حتى الآن.
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 850,
                }}
              >
                <thead>
                  <tr>
                    <th>رقم الشهادة</th>
                    <th>الطالب</th>
                    <th>الدورة</th>
                    <th>تاريخ الإصدار</th>
                    <th>التقدير</th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {certificates.map((certificate) => (
                    <tr key={certificate.id}>
                      <td>
                        <strong>
                          {certificate.number}
                        </strong>
                      </td>

                      <td>
                        <div>
                          {certificate.student_name}
                        </div>

                        {certificate.student_no && (
                          <small>
                            {certificate.student_no}
                          </small>
                        )}
                      </td>

                      <td>
                        {certificate.course_name}
                      </td>

                      <td>
                        {formatDate(
                          certificate.issued_at
                        )}
                      </td>

                      <td>
                        {certificate.grade || '-'}
                      </td>

                      <td>
                        {certificate.status === 'issued'
                          ? 'صادرة'
                          : certificate.status}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            openVerification(
                              certificate.number
                            )
                          }
                        >
                          تحقق
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </Shell>
  );
}
