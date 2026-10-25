'use client';

import Shell from '@/components/Shell';
import Link from 'next/link';
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

function PlansGrid({
  plans,
  subscription,
  subscribing,
  onChoose,
}: {
  plans: Plan[];
  subscription: Subscription | null;
  subscribing: string | null;
  onChoose: (code: string) => void;
}) {
  return (
    <div className="plans">
      {plans.map(plan => {
        const current = subscription?.plan === plan.code;
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
                onClick={() => onChoose(plan.code)}
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
  );
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [anon, setAnon] = useState(false);

  async function choose(planCode: string) {
    if (anon) {
      window.location.href = '/login';
      return;
    }

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
        setAnon(!j.subscription);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        جاري تحميل الخطط...
      </div>
    );
  }

  if (anon) {
    return (
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 24 }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Link href="/" style={{ fontWeight: 700 }}>
            منصة الخوارزمي
          </Link>
          <Link href="/login">تسجيل الدخول</Link>
        </header>

        {error && <div className="error">{error}</div>}

        <h1 style={{ marginBottom: 16 }}>الباقات والأسعار</h1>
        <p style={{ marginBottom: 24, opacity: 0.8 }}>
          اختر الباقة المناسبة لمركزك — لتفعيل الاشتراك سجّل الدخول أولاً.
        </p>

        <PlansGrid
          plans={plans}
          subscription={null}
          subscribing={subscribing}
          onChoose={choose}
        />
      </div>
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

      <PlansGrid
        plans={plans}
        subscription={subscription}
        subscribing={subscribing}
        onChoose={choose}
      />
    </Shell>
  );
}