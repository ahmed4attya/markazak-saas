'use client';

import { FormEvent, useEffect, useState } from 'react';

type Certificate = {
  number: string;
  issued_at: string;
  grade?: string | null;
  status: string;
  verify_token?: string;
  student_name: string;
  student_no?: string;
  course_name: string;
  center_name: string;
};

export default function Verify() {
  const [number, setNumber] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialNumber = params.get('number') || '';

    if (initialNumber) {
      setNumber(initialNumber);
      verifyCertificate(initialNumber);
    }
  }, []);

  async function verifyCertificate(value?: string) {
    const certificateNumber = (value ?? number).trim();

    setCertificate(null);
    setError('');

    if (!certificateNumber) {
      setError('أدخل رقم الشهادة أولاً');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/certificates/verify?number=${encodeURIComponent(
          certificateNumber
        )}`,
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(
          data.error || 'لم يتم العثور على شهادة بهذا الرقم'
        );
        return;
      }

      setCertificate(data.certificate);

      const url = new URL(window.location.href);
      url.searchParams.set('number', certificateNumber);
      window.history.replaceState({}, '', url.toString());
    } catch {
      setError('تعذر الاتصال بخدمة التحقق');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    verifyCertificate();
  }

  function formatDate(value: string) {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  function resetVerification() {
    setNumber('');
    setCertificate(null);
    setError('');

    const url = new URL(window.location.href);
    url.searchParams.delete('number');
    window.history.replaceState({}, '', url.toString());
  }

  return (
    <main className="verify">
      <div className="verifyCard">

        <div className="brand big">
          <span>م</span>
        </div>

        <h1>التحقق من الشهادة</h1>

        <p>
          أدخل رقم الشهادة للتحقق من صحة إصدارها وبياناتها.
        </p>

        {!certificate && (
          <form onSubmit={handleSubmit}>
            <input
              value={number}
              onChange={(event) =>
                setNumber(event.target.value)
              }
              placeholder="CERT-2026-00001"
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
              aria-label="رقم الشهادة"
            />

            <button
              type="submit"
              className="primary"
              disabled={loading}
            >
              {loading
                ? 'جاري التحقق...'
                : 'تحقق من الشهادة'}
            </button>
          </form>
        )}

        {loading && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 10,
            }}
          >
            جاري التحقق من الشهادة...
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 10,
              border: '1px solid #ef4444',
            }}
          >
            <strong>تعذر التحقق</strong>

            <p style={{ marginBottom: 0 }}>
              {error}
            </p>

            <button
              type="button"
              className="ghost"
              onClick={resetVerification}
              style={{ marginTop: 14 }}
            >
              محاولة أخرى
            </button>
          </div>
        )}

        {certificate && !loading && (
          <div
            style={{
              marginTop: 24,
              textAlign: 'right',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                marginBottom: 20,
                borderRadius: 12,
                border: '1px solid #22c55e',
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  marginBottom: 6,
                }}
              >
                ✓
              </div>

              <strong>
                الشهادة صحيحة
              </strong>

              <p
                style={{
                  marginBottom: 0,
                  marginTop: 6,
                }}
              >
                تم العثور على شهادة صادرة من المركز.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 12,
              }}
            >
              <div>
                <small>رقم الشهادة</small>
                <strong
                  style={{
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  {certificate.number}
                </strong>
              </div>

              <div>
                <small>اسم المتدرب</small>
                <strong
                  style={{
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  {certificate.student_name}
                </strong>
              </div>

              {certificate.student_no && (
                <div>
                  <small>رقم المتدرب</small>
                  <strong
                    style={{
                      display: 'block',
                      marginTop: 4,
                    }}
                  >
                    {certificate.student_no}
                  </strong>
                </div>
              )}

              <div>
                <small>الدورة</small>
                <strong
                  style={{
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  {certificate.course_name}
                </strong>
              </div>

              <div>
                <small>تاريخ الإصدار</small>
                <strong
                  style={{
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  {formatDate(certificate.issued_at)}
                </strong>
              </div>

              <div>
                <small>التقدير</small>
                <strong
                  style={{
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  {certificate.grade || '-'}
                </strong>
              </div>

              <div>
                <small>المركز</small>
                <strong
                  style={{
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  {certificate.center_name}
                </strong>
              </div>

              <div>
                <small>حالة الشهادة</small>
                <strong
                  style={{
                    display: 'block',
                    marginTop: 4,
                  }}
                >
                  صادرة وموثقة
                </strong>
              </div>

              {certificate.verify_token && (
                <div>
                  <small>رمز التحقق</small>
                  <strong
                    style={{
                      display: 'block',
                      marginTop: 4,
                      wordBreak: 'break-all',
                      fontSize: 13,
                    }}
                  >
                    {certificate.verify_token}
                  </strong>
                </div>
              )}
            </div>

            <button
              type="button"
              className="ghost"
              onClick={resetVerification}
              style={{
                width: '100%',
                marginTop: 24,
              }}
            >
              التحقق من شهادة أخرى
            </button>
          </div>
        )}

        <small
          style={{
            display: 'block',
            marginTop: 24,
          }}
        >
          خدمة تحقق عامة — لا تتطلب تسجيل الدخول
        </small>

      </div>
    </main>
  );
}
