'use client';

import Shell from '@/components/Shell';
import { useEffect, useState } from 'react';

type SettingsData = {
  center_name: string;
  phone: string;
  email: string;
  address: string;
  logo_url: string;
  currency: string;
  timezone: string;
  language: string;
  invoice_prefix: string;
  certificate_prefix: string;
  notifications_enabled: boolean;
  plan?: string;
  tenant_status?: string;
  integrations?: {
    stripe: boolean;
    posthog: boolean;
    ai: boolean;
  };
};

const defaults: SettingsData = {
  center_name: '',
  phone: '',
  email: '',
  address: '',
  logo_url: '',
  currency: 'SAR',
  timezone: 'Asia/Riyadh',
  language: 'ar',
  invoice_prefix: 'INV',
  certificate_prefix: 'CERT',
  notifications_enabled: true,
};

export default function Settings() {
  const [form, setForm] = useState<SettingsData>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const r = await fetch('/api/settings', { cache: 'no-store' });
      const j = await r.json();

      if (!r.ok) throw new Error(j.error || 'تعذر تحميل الإعدادات');

      setForm({ ...defaults, ...j });
    } catch (e: any) {
      setError(e.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(key: keyof SettingsData, value: any) {
    setForm(prev => ({ ...prev, [key]: value }));
    setMessage('');
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });

      const j = await r.json();

      if (!r.ok) throw new Error(j.error || 'تعذر حفظ الإعدادات');

      setMessage('تم حفظ الإعدادات بنجاح');
      await load();
    } catch (e: any) {
      setError(e.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Shell title="الإعدادات" subtitle="إدارة إعدادات المركز والنظام">
        <div className="panel">جاري تحميل الإعدادات...</div>
      </Shell>
    );
  }

  return (
    <Shell title="الإعدادات" subtitle="إدارة إعدادات المركز والنظام">
      <form onSubmit={save}>
        <div className="settingsGrid">

          <div className="panel">
            <h3>بيانات المركز</h3>

            <div className="formGrid">
              <label>
                اسم المركز
                <input
                  value={form.center_name}
                  onChange={e => update('center_name', e.target.value)}
                  required
                />
              </label>

              <label>
                الهاتف
                <input
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                />
              </label>

              <label>
                البريد الإلكتروني
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
              </label>

              <label>
                الشعار
                <input
                  value={form.logo_url}
                  onChange={e => update('logo_url', e.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label>
                العملة
                <select
                  value={form.currency}
                  onChange={e => update('currency', e.target.value)}
                >
                  <option value="SAR">ريال سعودي</option>
                  <option value="EGP">جنيه مصري</option>
                  <option value="AED">درهم إماراتي</option>
                  <option value="USD">دولار أمريكي</option>
                </select>
              </label>

              <label>
                المنطقة الزمنية
                <select
                  value={form.timezone}
                  onChange={e => update('timezone', e.target.value)}
                >
                  <option value="Asia/Riyadh">الرياض</option>
                  <option value="Africa/Cairo">القاهرة</option>
                  <option value="Asia/Dubai">دبي</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>

              <label>
                اللغة
                <select
                  value={form.language}
                  onChange={e => update('language', e.target.value)}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </label>

              <label>
                العنوان
                <textarea
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                  rows={3}
                />
              </label>
            </div>
          </div>

          <div className="panel">
            <h3>ترقيم المستندات</h3>

            <div className="formGrid">
              <label>
                بادئة الفواتير
                <input
                  value={form.invoice_prefix}
                  onChange={e => update('invoice_prefix', e.target.value)}
                />
              </label>

              <label>
                بادئة الشهادات
                <input
                  value={form.certificate_prefix}
                  onChange={e => update('certificate_prefix', e.target.value)}
                />
              </label>
            </div>

            <label className="checkboxRow">
              <input
                type="checkbox"
                checked={form.notifications_enabled}
                onChange={e =>
                  update('notifications_enabled', e.target.checked)
                }
              />
              تفعيل الإشعارات
            </label>
          </div>

          <div className="panel">
            <h3>حالة الحساب</h3>

            <div className="integration">
              <b>الخطة</b>
              <span>{form.plan || 'starter'}</span>
            </div>

            <div className="integration">
              <b>الحالة</b>
              <span>{form.tenant_status || 'active'}</span>
            </div>
          </div>

          <div className="panel">
            <h3>التكاملات</h3>

            <div className="integration">
              <b>Stripe</b>
              <span>
                {form.integrations?.stripe
                  ? 'متصل'
                  : 'غير مهيأ'}
              </span>
            </div>

            <div className="integration">
              <b>PostHog</b>
              <span>
                {form.integrations?.posthog
                  ? 'متصل'
                  : 'غير مهيأ'}
              </span>
            </div>

            <div className="integration">
              <b>AI Provider</b>
              <span>
                {form.integrations?.ai
                  ? 'متصل'
                  : 'الوضع الداخلي'}
              </span>
            </div>

            <p className="muted">
              مفاتيح الخدمات الحساسة تتم قراءتها من متغيرات البيئة على الخادم.
            </p>
          </div>
        </div>

        {message && <div className="success">{message}</div>}
        {error && <div className="error">{error}</div>}

        <div style={{ marginTop: 20 }}>
          <button className="primary" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </Shell>
  );
}
