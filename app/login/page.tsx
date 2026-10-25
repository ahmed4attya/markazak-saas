'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  BookOpen,
  Mail,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Home,
  Lock,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type LoginTab = 'password' | 'otp';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-white" dir="rtl">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LoginTab>('password');

  // Password state
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP state
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [method, setMethod] = useState<'email' | 'totp'>('email');
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check query params for notifications
  useEffect(() => {
    const authMsg = searchParams.get('auth');
    const authErr = searchParams.get('authError');
    if (authMsg) setMessage(authMsg);
    if (authErr) setError(authErr);
    if (authMsg || authErr) {
      const clean = new URL(window.location.href);
      clean.searchParams.delete('auth');
      clean.searchParams.delete('authError');
      window.history.replaceState({}, '', clean.toString());
    }
  }, [searchParams]);

  // Check Google OAuth status
  useEffect(() => {
    fetch('/api/auth/google/status')
      .then((r) => r.json())
      .then((data) => setGoogleEnabled(data.enabled === true))
      .catch(() => setGoogleEnabled(false));
  }, []);

  // Cooldown countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const finalizeSession = (data: { role?: string; user?: { role?: string } }) => {
    const role = data.user?.role || data.role || '';
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      router.push(redirectParam);
      return;
    }
    const destination =
      role === 'student' || role === 'guardian' ? '/portal' : '/dashboard';
    router.push(destination);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !password) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
      });
      const data = await res.json();
      if (res.ok && (data.ok || data.success)) {
        finalizeSession(data);
      } else {
        setError(data.error || 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || cooldown > 0) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && (data.ok || data.success)) {
        setMessage(data.message || 'تم إرسال رمز الدخول بنجاح! تحقق من بريدك الإلكتروني');
        setStep('code');
        setCooldown(60);
      } else {
        setError(data.error || 'تعذر إرسال رمز التحقق');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !email) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, method }),
      });
      const data = await res.json();
      if (res.ok && (data.ok || data.success)) {
        finalizeSession(data);
      } else {
        setError(data.error || 'رمز التحقق غير صحيح');
      }
    } catch {
      setError('حدث خطأ أثناء التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t: LoginTab) => {
    setTab(t);
    setError(null);
    setMessage(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-4 py-8 bg-[#0b0f17] text-slate-100"
      dir="rtl"
    >
      {/* Top action bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
        >
          <Home className="w-4 h-4" />
          <span>الرئيسية</span>
        </Link>
        <span className="text-xs text-slate-500">بوابة الدخول الموحد</span>
      </div>

      <div className="w-full max-w-md mx-auto space-y-5 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20 mb-2 ring-4 ring-blue-500/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            <span className="text-amber-400">مركزك</span> | Markazak SaaS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            تسجيل دخول آمن — بكلمة المرور أو حساب Google أو رمز التحقق
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#131b2a] rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Dual Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => switchTab('password')}
              className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'password'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>كلمة المرور</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('otp')}
              className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                tab === 'otp'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>رمز التحقق OTP</span>
            </button>
          </div>

          {tab === 'password' ? (
            <>
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => {
                  setGoogleLoading(true);
                  window.location.assign('/api/auth/google');
                }}
                disabled={googleLoading || googleEnabled === false}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold rounded-xl text-sm shadow-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
              >
                {googleLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                <span>المتابعة بحساب Google</span>
              </button>
              {googleEnabled === false && (
                <p className="text-[10px] text-slate-400 text-center -mt-2">
                  الدخول بجوجل غير مُعد على هذا الخادم — استخدم كلمة المرور أو رمز التحقق
                </p>
              )}

              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="h-px flex-1 bg-slate-800" />
                أو بكلمة المرور
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              {/* Password Form */}
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      dir="ltr"
                      placeholder="teacher@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-start pl-10 pr-3.5 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      كلمة المرور
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      dir="ltr"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-start pl-10 pr-3.5 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الدخول...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* OTP Form */}
              {step === 'email' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      أدخل بريدك الإلكتروني لاستلام رمز الدخول السريع
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        dir="ltr"
                        placeholder="teacher@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-start pl-10 pr-3.5 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || cooldown > 0}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري إرسال الرمز...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>
                          {cooldown > 0 ? `انتظر (${cooldown} ث)` : 'إرسال رمز الدخول OTP'}
                        </span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      تم إرسال الرمز إلى: <strong className="text-slate-200" dir="ltr">{email}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      تغيير
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      رمز التحقق (6 أرقام)
                    </label>
                    <input
                      type="text"
                      required
                      dir="ltr"
                      maxLength={6}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest text-xl font-mono py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length < 6}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري التحقق...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>تأكيد وتسجيل الدخول</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setMethod(method === 'email' ? 'totp' : 'email')}
                      className="text-slate-400 hover:text-white hover:underline cursor-pointer"
                    >
                      {method === 'email' ? 'استخدام كود TOTP' : 'طلب رمز جديد عبر البريد'}
                    </button>
                    {method === 'email' && (
                      <button
                        type="button"
                        disabled={cooldown > 0}
                        onClick={() => handleRequestOtp()}
                        className="text-blue-400 hover:underline disabled:opacity-40 cursor-pointer"
                      >
                        {cooldown > 0 ? `إعادة الإرسال بعد (${cooldown} ث)` : 'إعادة إرسال الرمز'}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Link to Register */}
        <div className="text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>أنت معلم أو مركز تدريب جديد؟ قدّم طلب انضمام</span>
          </Link>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>تشفير Argon2id وجلسات JWT مؤمنة ومقاومة هجمات التخمين والتوقيت</span>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="text-center text-xs text-slate-500 py-2">
        منصة مركزك © {new Date().getFullYear()} — المنصة الذكية لإدارة مراكز التدريب والقدرات
      </div>
    </div>
  );
}
