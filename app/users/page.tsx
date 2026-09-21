'use client';

import Shell from '@/components/Shell';
import { useEffect, useState } from 'react';

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
];

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff',
  });

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
        body: JSON.stringify(form),
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
      });

      setShowForm(false);
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    } finally {
      setSaving(false);
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
                minLength={6}
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
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {roles.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <button className="primary" disabled={saving}>
                {saving ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
              </button>
            </div>
          </form>
        )}

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
                {users.map(user => (
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
                      <button
                        className="ghost"
                        onClick={() => toggleUser(user)}
                      >
                        {user.active ? 'تعطيل' : 'تفعيل'}
                      </button>
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
