'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserPlus,
  Mail,
  KeyRound,
  Building,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Home,
  Check,
} from 'lucide-react';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-white" dir="rtl">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [centerName, setCenterName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'teacher' | 'staff'>('teacher');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const gEmail = searchParams.get('googleEmail');
    const gName = searchParams.get('googleName');
    const authErr = searchParams.get('authError');
    if (gEmail) setEmail(gEmail);
    if (gName) setName(gName);
    if (authErr) setError(authErr);
  }, [searchParams]);

  const passwordLengthValid = password.length >= 8;
  const passwordMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('يرجى إدخال الاسم الكامل');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }
    if (password.length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 خانات');
      return;
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          centerName: centerName.trim() || undefined,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'تعذر إرسال طلب التسجيل');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-4 py-8 bg-[#0b0f17] text-slate-100"
      dir="rtl"
    >
      {/* Top action bar */}
      <div className="max-w-lg w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
        <span className="text-xs text-slate-500">منصة مركزك | بوابة الانضمام</span>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
        >
          <span>لديك حساب؟ تسجيل الدخول</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="w-full max-w-lg mx-auto space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20 mb-1 ring-4 ring-blue-500/20">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            طلب تسجيل جديد
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            انضم إلى <span className="text-amber-400 font-bold">منصة مركزك</span> لإدارة التدريب والقدرات الذكية
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#131b2a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">تم استلام طلبك بنجاح!</h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  طلب انضمامك مسجل الآن وقيد المراجعة والاعتماد من قبل إدارة المنصة.
                  أرسلنا رسالة تأكيد إلى بريدك الإلكتروني <span className="text-blue-400 font-mono" dir="ltr">{email}</span>.
                </p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                ⚡ ستصلك رسالة تفعيل فور مراجعة الطلب لتتمكن من تسجيل الدخول والبدء مباشرة.
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition cursor-pointer"
                >
                  العودة لصفحة تسجيل الدخول
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  الاسم الكامل <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="أحمد محمد علي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Center Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  اسم المركز / الأكاديمية (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مركز التميز للقدرات والتدريب"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    البريد الإلكتروني <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="teacher@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    رقم الجوال
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      dir="ltr"
                      placeholder="05XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  نوع الحساب المطلوب
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'teacher'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>معلم / مدرب قدرات</span>
                    {role === 'teacher' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === 'staff'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>إداري / مشرف مركز</span>
                    {role === 'staff' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    كلمة المرور (8 خانات فأكثر) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      dir="ltr"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    تأكيد كلمة المرور <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      dir="ltr"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Password checks */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span className={`inline-flex items-center gap-1 ${passwordLengthValid ? 'text-emerald-400' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordLengthValid ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  8 خانات كحد أدنى
                </span>
                <span className={`inline-flex items-center gap-1 ${passwordMatch ? 'text-emerald-400' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordMatch ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  تطابق كلمتي المرور
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الطلب...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>إرسال طلب الانضمام للمراجعة</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>تخضع جميع الحسابات لبروتوكول التحقق الأمني ومصادقة الإدارة المعتمدة</span>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="text-center text-xs text-slate-500 py-2">
        منصة مركزك © {new Date().getFullYear()} — المنصة الذكية لإدارة مراكز التدريب والقدرات
      </div>
    </div>
  );
}
