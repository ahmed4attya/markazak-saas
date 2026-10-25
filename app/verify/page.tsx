"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Hash,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

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
  const [number, setNumber] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialNumber = params.get("number") || "";

    if (initialNumber) {
      setNumber(initialNumber);
      void verifyCertificate(initialNumber);
    }
  }, []);

  async function verifyCertificate(value?: string) {
    const certificateNumber = (value ?? number).trim();

    setCertificate(null);
    setError("");

    if (!certificateNumber) {
      setError("أدخل رقم الشهادة أولاً");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/certificates/verify?number=${encodeURIComponent(
          certificateNumber,
        )}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || "لم يتم العثور على شهادة بهذا الرقم");
        return;
      }

      setCertificate(data.certificate);

      const url = new URL(window.location.href);
      url.searchParams.set("number", certificateNumber);
      window.history.replaceState({}, "", url.toString());
    } catch {
      setError("تعذر الاتصال بخدمة التحقق");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void verifyCertificate();
  }

  function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function resetVerification() {
    setNumber("");
    setCertificate(null);
    setError("");

    const url = new URL(window.location.href);
    url.searchParams.delete("number");
    window.history.replaceState({}, "", url.toString());
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50 px-4 py-8 lg:px-8 lg:py-12"
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-100">
            <Award size={30} />
          </div>

          <h1 className="text-2xl font-black text-slate-900 lg:text-3xl">
            التحقق من صحة الشهادة
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            أدخل رقم الشهادة للتحقق من صحة إصدارها وبياناتها المسجلة لدى المركز.
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 lg:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Search size={19} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">البحث عن شهادة</h2>
                <p className="mt-1 text-xs text-slate-500">
                  استخدم رقم الشهادة المطبوع على الوثيقة.
                </p>
              </div>
            </div>
          </div>

          {!certificate && (
            <form onSubmit={handleSubmit} className="p-5 lg:p-6">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                رقم الشهادة
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Hash
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                    placeholder="CERT-2026-00001"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={loading}
                    aria-label="رقم الشهادة"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={17} />
                      تحقق من الشهادة
                    </>
                  )}
                </button>
              </div>

              {loading && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm font-medium text-blue-700">
                  جاري التحقق من بيانات الشهادة...
                </div>
              )}

              {error && !loading && (
                <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <ShieldCheck size={18} />
                    </div>

                    <div>
                      <p className="font-bold text-red-700">تعذر التحقق</p>
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={resetVerification}
                    className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    محاولة أخرى
                  </button>
                </div>
              )}
            </form>
          )}

          {certificate && !loading && (
            <div className="p-5 lg:p-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={30} />
                </div>

                <h2 className="mt-3 text-xl font-black text-emerald-800">
                  الشهادة صحيحة
                </h2>

                <p className="mt-1 text-sm text-emerald-700">
                  تم العثور على شهادة صادرة من المركز.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={Hash}
                  label="رقم الشهادة"
                  value={certificate.number}
                />

                <InfoCard
                  icon={UserRound}
                  label="اسم المتدرب"
                  value={certificate.student_name}
                />

                {certificate.student_no && (
                  <InfoCard
                    icon={Hash}
                    label="رقم المتدرب"
                    value={certificate.student_no}
                  />
                )}

                <InfoCard
                  icon={GraduationCap}
                  label="الدورة"
                  value={certificate.course_name}
                />

                <InfoCard
                  icon={CalendarDays}
                  label="تاريخ الإصدار"
                  value={formatDate(certificate.issued_at)}
                />

                <InfoCard
                  icon={Award}
                  label="التقدير"
                  value={certificate.grade || "-"}
                />

                <InfoCard
                  icon={ShieldCheck}
                  label="المركز"
                  value={certificate.center_name}
                />

                <InfoCard
                  icon={BadgeCheck}
                  label="حالة الشهادة"
                  value="صادرة وموثقة"
                  valueClass="text-emerald-700"
                />
              </div>

              {certificate.verify_token && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">رمز التحقق</p>
                  <p className="mt-2 break-all font-mono text-xs text-slate-700">
                    {certificate.verify_token}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={resetVerification}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Search size={17} />
                التحقق من شهادة أخرى
              </button>
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 text-center">
            <p className="text-xs text-slate-400">
              خدمة تحقق عامة — لا تتطلب تسجيل الدخول
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  valueClass = "text-slate-800",
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">{label}</p>

          <p className={`mt-1 break-words text-sm font-bold ${valueClass}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
