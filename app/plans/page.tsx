'use client';

import Shell from '@/components/Shell';
import { useEffect, useState } from 'react';

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  limits: Record<string, any>;
  features: any[];
};

type Subscription = {
  plan: string;
  status: string;
  current_period_end?: string | null;
};

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState<string | null>(null);

  async function subscribe(planCode: string) {
    setError('');
    setSubscribing(planCode);

    try {
      const r = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan_code: planCode, interval: 'monthly' }),
      });

      const j = await r.json();

      if (!r.ok) {
        throw new Error(j.error || 'تعذر بدء عملية الدفع');
      }

      if (j.url) {
        window.location.href = j.url;
        return;
      }

      throw new Error('تعذر بدء عملية الدفع');
    } catch (e: any) {
      setError(e.message);
      setSubscribing(null);
    }
  }

  useEffect(() => {
    fetch('/api/plans', { cache: 'no-store' })
      .then(async r => {
        const j = await r.json();

        if (!r.ok) {
          throw new Error(j.error || 'تعذر تحميل الخطط');
        }

        setPlans(j.plans || []);
        setSubscription(j.subscription || null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Shell title="الاشتراك والفوترة" subtitle="الخطة والاشتراك الحالي">
        <div className="panel">جاري تحميل الخطط...</div>
      </Shell>
    );
  }

  return (
    <Shell title="الاشتراك والفوترة" subtitle="الخطة والاشتراك الحالي">
      {error && <div className="error">{error}</div>}

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>الاشتراك الحالي</h3>

        <div className="integration">
          <b>الخطة</b>
          <span>{subscription?.plan || 'starter'}</span>
        </div>

        <div className="integration">
          <b>الحالة</b>
          <span>{subscription?.status || 'trialing'}</span>
        </div>

        <div className="integration">
          <b>ينتهي في</b>
          <span>
            {subscription?.current_period_end
              ? new Date(subscription.current_period_end).toLocaleDateString('ar-SA')
              : 'غير محدد'}
          </span>
        </div>
      </div>

      <div className="plans">
        {plans.map(plan => {
          const current =
            subscription?.plan === plan.code;

          const features = Array.isArray(plan.features)
            ? plan.features
            : [];

          return (
            <div
              className={current ? 'planCard featured' : 'planCard'}
              key={plan.id}
            >
              {current && <span>الخطة الحالية</span>}

              <h2>{plan.name}</h2>

              <strong>
                {Number(plan.monthly_price).toLocaleString('ar-SA')}
                <small> ر.س / شهر</small>
              </strong>

              <p>
                السنوي:{' '}
                {Number(plan.yearly_price).toLocaleString('ar-SA')} ر.س
              </p>

              {features.length > 0 && (
                <ul>
                  {features.map((feature, i) => (
                    <li key={i}>
                      {typeof feature === 'string'
                        ? feature
                        : feature?.name || JSON.stringify(feature)}
                    </li>
                  ))}
                </ul>
              )}

              {current ? (
                <button className="primary" disabled>
                  الخطة الحالية
                </button>
              ) : (
                <button
                  className="ghost"
                  disabled={subscribing === plan.code}
                  onClick={() => subscribe(plan.code)}
                >
                  {subscribing === plan.code
                    ? 'جاري التحويل...'
                    : 'اختيار الخطة'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
