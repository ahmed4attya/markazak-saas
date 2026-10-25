'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import {
  Building2,
  Plus,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Search,
  KeyRound,
  Mail,
  Phone,
  UserCheck,
  AlertCircle,
  Inbox,
  ArrowUpRight,
  Eye,
  Check,
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  status: string;
  created_at: string;
  students_count: number;
  courses_count: number;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
}

interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  center_name: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tenants' | 'requests'>('tenants');
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [centerName, setCenterName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [addDemo, setAddDemo] = useState(true);

  // Success Card Modal
  const [createdTenantData, setCreatedTenantData] = useState<{
    tenantName: string;
    email: string;
    password: string;
    loginUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tenants');
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('تعذر تحميل بيانات المراكز');
      }
      const data = await res.json();
      setTenants(data.tenants || []);
      setRequests(data.registrationRequests || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%';
    let pass = 'Mkz@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!centerName.trim() || !adminName.trim() || !email.trim()) {
      setFormError('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    if (password.length < 8) {
      setFormError('كلمة المرور يجب ألا تقل عن 8 خانات');
      return;
    }

    setCreating(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: centerName.trim(),
          adminName: adminName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          plan,
          addDemo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'تعذر إنشاء المركز');
      }

      // Success
      setCreatedTenantData({
        tenantName: centerName.trim(),
        email: email.trim(),
        password,
        loginUrl: 'https://markazak-saas.vercel.app/login',
      });

      // Reset Form & Close Modal
      setModalOpen(false);
      setCenterName('');
      setAdminName('');
      setEmail('');
      setPhone('');
      setPassword('');

      // Refresh table
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setCreating(false);
    }
  };

  const convertRequestToTenant = (req: RegistrationRequest) => {
    setCenterName(req.center_name || `مركز ${req.name}`);
    setAdminName(req.name);
    setEmail(req.email);
    setPhone(req.phone || '');
    generateStrongPassword();
    setPlan('pro');
    setAddDemo(true);
    setModalOpen(true);
  };

  const copyCredentials = () => {
    if (!createdTenantData) return;
    const text = `أهلاً بك أستاذنا الفاضل،
يسعدنا تفعيل نسختك المخصصة من منصة الخوارزمي لإدارة التدريب والقدرات (SaaS):

🏢 اسم المركز: ${createdTenantData.tenantName}
🌐 رابط تسجيل الدخول: ${createdTenantData.loginUrl}
📧 البريد الإلكتروني: ${createdTenantData.email}
🔑 كلمة المرور: ${createdTenantData.password}

✨ يمكنك تسجيل الدخول فوراً وبدء تخصيص هوية مركزك وتجربة كافة الخصائص.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.owner_name && t.owner_name.toLowerCase().includes(search.toLowerCase())) ||
      (t.owner_email && t.owner_email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalStudents = tenants.reduce((acc, t) => acc + (Number(t.students_count) || 0), 0);
  const totalCourses = tenants.reduce((acc, t) => acc + (Number(t.courses_count) || 0), 0);
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <Shell
      title="إدارة المراكز والشركاء (SaaS Tenants)"
      subtitle="إدارة وتدشين مراكز التدريب المعزولة ومتابعة الاشتراكات وطلبات الانضمام"
    >
      <div className="space-y-6">
        {/* Top Action & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                generateStrongPassword();
                setModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition cursor-pointer"
            >
              <Plus size={18} />
              <span>إنشاء مركز تدريب جديد (Tenant)</span>
            </button>

            <button
              type="button"
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-soft)] hover:text-[color:var(--text)] transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3.5 top-3 text-[color:var(--muted)]" size={16} />
            <input
              type="text"
              placeholder="بحث بالمركز، المدير، البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-[color:var(--surface)] border border-[color:var(--border)] text-sm text-[color:var(--text)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bento-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[color:var(--muted)]">إجمالي المراكز المشتركة</p>
              <p className="text-2xl font-black text-[color:var(--text)] mt-1">{tenants.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Building2 size={20} />
            </div>
          </div>

          <div className="bento-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[color:var(--muted)]">إجمالي الطلاب في النظام</p>
              <p className="text-2xl font-black text-[color:var(--text)] mt-1">{totalStudents}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users size={20} />
            </div>
          </div>

          <div className="bento-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[color:var(--muted)]">إجمالي الدورات التدريبية</p>
              <p className="text-2xl font-black text-[color:var(--text)] mt-1">{totalCourses}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen size={20} />
            </div>
          </div>

          <div className="bento-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[color:var(--muted)]">طلبات التسجيل الجديدة</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{pendingRequests.length}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Inbox size={20} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[color:var(--border)] gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tenants')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'tenants'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[color:var(--muted)] hover:text-[color:var(--text)]'
            }`}
          >
            <Building2 size={16} />
            <span>المراكز التدريبية المعزولة ({tenants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[color:var(--muted)] hover:text-[color:var(--text)]'
            }`}
          >
            <Inbox size={16} />
            <span>طلبات الانضمام الواردة</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Tenants List */}
        {activeTab === 'tenants' && (
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)]/40 text-[color:var(--muted)]">
                    <th className="py-3 px-4 font-semibold">اسم المركز / الهوية</th>
                    <th className="py-3 px-4 font-semibold">المدير المسؤول</th>
                    <th className="py-3 px-4 font-semibold">الخطة</th>
                    <th className="py-3 px-4 font-semibold">الطلاب</th>
                    <th className="py-3 px-4 font-semibold">الدورات</th>
                    <th className="py-3 px-4 font-semibold">تاريخ التدشين</th>
                    <th className="py-3 px-4 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[color:var(--muted)] text-sm">
                        لا توجد مراكز مطابقة
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-[color:var(--surface-2)]/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[color:var(--text)]">{t.name}</div>
                          <span className="text-[11px] font-mono text-[color:var(--muted-dim)]">
                            slug: {t.slug}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[color:var(--text)]">{t.owner_name || '—'}</div>
                          <div className="text-xs text-[color:var(--muted)] flex items-center gap-1.5 mt-0.5">
                            <Mail size={12} />
                            <span>{t.owner_email || '—'}</span>
                          </div>
                          {t.owner_phone && (
                            <div className="text-xs text-[color:var(--muted)] flex items-center gap-1.5 mt-0.5">
                              <Phone size={12} />
                              <span>{t.owner_phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {t.plan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[color:var(--text)]">
                          {t.students_count} طالب
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[color:var(--text)]">
                          {t.courses_count} دورة
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[color:var(--muted)]">
                          {new Date(t.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={12} />
                            <span>نشط</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <div className="bento-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)]/40 text-[color:var(--muted)]">
                    <th className="py-3 px-4 font-semibold">مقدم الطلب</th>
                    <th className="py-3 px-4 font-semibold">اسم المركز المقترح</th>
                    <th className="py-3 px-4 font-semibold">البريد الإلكتروني</th>
                    <th className="py-3 px-4 font-semibold">رقم الجوال</th>
                    <th className="py-3 px-4 font-semibold">تاريخ الطلب</th>
                    <th className="py-3 px-4 font-semibold">الحالة</th>
                    <th className="py-3 px-4 font-semibold text-center">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[color:var(--muted)] text-sm">
                        لا توجد طلبات تسجيل حالياً
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="hover:bg-[color:var(--surface-2)]/50 transition">
                        <td className="py-3.5 px-4 font-bold text-[color:var(--text)]">{r.name}</td>
                        <td className="py-3.5 px-4 text-[color:var(--text-soft)]">
                          {r.center_name || 'غير محدد'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-blue-400">{r.email}</td>
                        <td className="py-3.5 px-4 text-xs text-[color:var(--muted)]">{r.phone || '—'}</td>
                        <td className="py-3.5 px-4 text-xs text-[color:var(--muted)]">
                          {new Date(r.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                              r.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400'
                                : r.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {r.status === 'pending' ? 'قيد الانتظار' : r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {r.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => convertRequestToTenant(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold border border-blue-500/30 transition cursor-pointer"
                            >
                              <Sparkles size={14} />
                              <span>تحويل لمركز مستقل</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create New Tenant */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-2xl p-6 text-right space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3">
                <div className="flex items-center gap-2 text-[color:var(--text)]">
                  <Building2 className="text-blue-500" size={22} />
                  <h3 className="text-lg font-bold">تدشين مركز تدريب جديد (SaaS Tenant)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-[color:var(--muted)] hover:text-[color:var(--text)] p-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-soft)] mb-1">
                    اسم مركز التدريب أو الأكاديمية *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أكاديمية التفوق للقدرات"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm text-[color:var(--text)] focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[color:var(--text-soft)] mb-1">
                      اسم المدير المسؤول *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أ. محمد العتيبي"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm text-[color:var(--text)] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[color:var(--text-soft)] mb-1">
                      رقم الجوال
                    </label>
                    <input
                      type="tel"
                      placeholder="05xxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm text-[color:var(--text)] focus:outline-none focus:border-blue-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[color:var(--text-soft)] mb-1">
                    البريد الإلكتروني لتسجيل الدخول *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@academy.sa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm text-[color:var(--text)] focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[color:var(--text-soft)]">
                      كلمة المرور المؤقتة *
                    </label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      توليد كلمة مرور قوية ⚡
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm font-mono text-[color:var(--text)] focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-[color:var(--text-soft)] mb-1">
                      الخطة
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm text-[color:var(--text)] focus:outline-none focus:border-blue-500"
                    >
                      <option value="starter">Starter (باقة البداية)</option>
                      <option value="pro">Pro (باقة المحترفين - تجريبية)</option>
                      <option value="enterprise">Enterprise (المراكز الكبرى)</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={addDemo}
                        onChange={(e) => setAddDemo(e.target.checked)}
                        className="rounded border-[color:var(--border)] text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs font-medium text-[color:var(--text)]">
                        تضمين بيانات تجريبية جاهزة (دورة، طلاب، أسئلة)
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[color:var(--border)]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-[color:var(--muted)] hover:text-[color:var(--text)] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {creating ? 'جاري إنشاء المركز...' : 'تأكيد وإنشاء المركز'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Modal: Credentials Card */}
        {createdTenantData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-blue-500/40 shadow-2xl p-6 text-right space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={26} />
                </div>
                <h3 className="text-lg font-black text-white">تم إنشاء المركز التجريبي بنجاح!</h3>
                <p className="text-xs text-slate-400">
                  تم إعداد نظام معزول لـ <b>{createdTenantData.tenantName}</b> وجاهز للاستخدام فوراً.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400 font-sans">الرابط المباشر:</span>
                  <a
                    href={createdTenantData.loginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>markazak-saas.vercel.app/login</span>
                    <ArrowUpRight size={12} />
                  </a>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <span className="text-slate-400 font-sans">البريد الإلكتروني:</span>
                  <span className="text-white select-all">{createdTenantData.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans">كلمة المرور:</span>
                  <span className="text-amber-400 font-bold select-all">{createdTenantData.password}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-emerald-300" />
                      <span>تم نسخ بطاقة الدخول بنجاح!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>نسخ بطاقة العميل (جاهزة للواتساب)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCreatedTenantData(null)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
