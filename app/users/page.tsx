'use client';

import Shell from '@/components/Shell';
import { useEffect, useState, useMemo } from 'react';
import { Search, RotateCcw } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  last_login_at?: string;
};

const roles = [
  ['admin', 'مدير النظام'],
  ['manager', 'مدير'],
  ['staff', 'موظف'],
  ['teacher', 'مدرب'],
  ['accountant', 'محاسب'],
  ['student', 'طالب (بوابة)'],
  ['guardian', 'ولي أمر (بوابة)'],
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatus === 'active' && !u.active) return false;
      if (filterStatus === 'inactive' && u.active) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const roleLabel = (roles.find((r) => r[0] === u.role)?.[1] || '').toLowerCase();
        const match =
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.phone || '').toLowerCase().includes(q) ||
          roleLabel.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [users, filterRole, filterStatus, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery.trim() || filterRole || filterStatus);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
    studentId: '',
  });
  const [students, setStudents] = useState<{ id: string; name: string; student_no: string }[]>([]);

  useEffect(() => {
    if (form.role !== 'student' && form.role !== 'guardian') return;
    fetch('/api/students', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : []))
      .then(d => { if (Array.isArray(d)) setStudents(d); })
      .catch(() => {});
  }, [form.role]);

  async function load() {
    setLoading(true);

    try {
      const r = await fetch('/api/users', { cache: 'no-store' });
      const j = await r.json();

      if (!r.ok) throw new Error(j.error || 'تعذر تحميل المستخدمين');

      setUsers(j);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError('');

    try {
      const r = await fetch('/api/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, studentId: form.role === 'student' || form.role === 'guardian' ? form.studentId : undefined }),
      });

      const j = await r.json();

      if (!r.ok) throw new Error(j.error || 'تعذر إنشاء المستخدم');

      setUsers(prev => [j, ...prev]);

      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'staff',
        studentId: '',
      });

      setShowForm(false);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetUserPassword(user: User) {
    const newPwd = window.prompt(`أدخل كلمة المرور الجديدة لـ (${user.name}):`, '12345678');
    if (!newPwd || newPwd.trim().length < 6) {
      if (newPwd !== null) alert('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: user.id, newPassword: newPwd.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تغيير كلمة المرور');
      alert(`تم تحديث كلمة المرور لـ (${user.name}) بنجاح.`);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  }

  async function toggleUser(user: User) {
    setError('');

    try {
      const r = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          active: !user.active,
        }),
      });

      const j = await r.json();

      if (!r.ok) throw new Error(j.error || 'تعذر تحديث المستخدم');

      setUsers(prev =>
        prev.map(x => x.id === user.id ? j : x)
      );
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    }
  }

  return (
    <Shell title="المستخدمون والصلاحيات" subtitle="إدارة فريق المركز وحسابات الدخول">
      <div className="panel">
        <div className="panelHead">
          <div>
            <h3>فريق المركز</h3>
            <p className="muted">
              {users.length} مستخدم
            </p>
          </div>

          <button
            className="primary"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? 'إلغاء' : 'إضافة مستخدم'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {showForm && (
          <form
            onSubmit={createUser}
            className="formGrid"
            style={{ marginBottom: 24 }}
          >
            <label>
              الاسم
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label>
              البريد الإلكتروني
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label>
              كلمة المرور
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>

            <label>
              الهاتف
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </label>

            <label>
              الدور
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value, studentId: '' })}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {(form.role === 'student' || form.role === 'guardian') && (
              <label>
                ربط بسجل الطالب
                <select
                  value={form.studentId}
                  onChange={e => setForm({ ...form, studentId: e.target.value })}
                  required
                >
                  <option value="">— اختر الطالب —</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.student_no})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div>
              <button className="primary" disabled={saving}>
                {saving ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </button>
            </div>
          </form>
        )}

        {/* Smart Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative group min-w-[200px] flex-1 sm:flex-initial">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
                className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs outline-none"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold cursor-pointer"
            >
              <option value="">كل الأدوار</option>
              {roles.map(([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold cursor-pointer"
            >
              <option value="">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterRole('');
                  setFilterStatus('');
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-bold">
            عرض {filteredUsers.length} من أصل {users.length}
          </span>
        </div>

        {loading ? (
          <p>جاري التحميل...</p>
        ) : users.length === 0 ? (
          <p>لا يوجد مستخدمون.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dataTable">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد</th>
                  <th>الدور</th>
                  <th>الهاتف</th>
                  <th>الحالة</th>
                  <th>آخر دخول</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {roles.find(x => x[0] === user.role)?.[1] || user.role}
                    </td>
                    <td>{user.phone || '—'}</td>
                    <td>
                      {user.active ? 'نشط' : 'معطل'}
                    </td>
                    <td>
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString('ar-SA')
                        : 'لم يدخل بعد'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="ghost"
                          style={{ color: '#3b82f6', fontSize: '11px', whiteSpace: 'nowrap' }}
                          onClick={() => handleResetUserPassword(user)}
                        >
                          تغيير كلمة المرور
                        </button>
                        <button
                          type="button"
                          className="ghost"
                          style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                          onClick={() => toggleUser(user)}
                        >
                          {user.active ? 'تعطيل' : 'تفعيل'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
