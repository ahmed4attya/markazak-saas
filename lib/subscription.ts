import { query } from './db';

export interface SubscriptionStatus {
  status: 'active' | 'trialing' | 'grace_period' | 'expired';
  plan: string;
  isGracePeriod: boolean;
  isExpired: boolean;
  daysRemainingInGrace: number;
  currentPeriodEnd: Date | null;
}

const GRACE_PERIOD_DAYS = 7;

export async function getSubscriptionStatus(tenantId: string): Promise<SubscriptionStatus> {
  const r = await query<{
    plan: string;
    status: string;
    current_period_end: Date | null;
  }>(
    `select coalesce(s.plan, t.plan, 'starter') as plan,
            coalesce(s.status, 'active') as status,
            s.current_period_end
     from tenants t
     left join subscriptions s on s.tenant_id = t.id
     where t.id = $1`,
    [tenantId]
  );

  const row = r.rows[0];
  const plan = row?.plan || 'starter';
  const rawStatus = (row?.status || 'active').toLowerCase();
  const periodEnd = row?.current_period_end ? new Date(row.current_period_end) : null;

  if (!periodEnd || periodEnd.getTime() > Date.now()) {
    const isCanceled = rawStatus === 'canceled';
    return {
      status: isCanceled ? 'expired' : (rawStatus as 'active' | 'trialing' | 'grace_period' | 'expired'),
      plan,
      isGracePeriod: false,
      isExpired: isCanceled,
      daysRemainingInGrace: 0,
      currentPeriodEnd: periodEnd,
    };
  }

  const msSinceExpiry = Date.now() - periodEnd.getTime();
  const daysSinceExpiry = msSinceExpiry / (1000 * 60 * 60 * 24);

  if (daysSinceExpiry <= GRACE_PERIOD_DAYS) {
    const daysRemaining = Math.max(1, Math.ceil(GRACE_PERIOD_DAYS - daysSinceExpiry));
    return {
      status: 'grace_period',
      plan,
      isGracePeriod: true,
      isExpired: false,
      daysRemainingInGrace: daysRemaining,
      currentPeriodEnd: periodEnd,
    };
  }

  return {
    status: 'expired',
    plan,
    isGracePeriod: false,
    isExpired: true,
    daysRemainingInGrace: 0,
    currentPeriodEnd: periodEnd,
  };
}

export async function assertSubscriptionActive(tenantId: string): Promise<SubscriptionStatus> {
  const sub = await getSubscriptionStatus(tenantId);
  if (sub.isExpired) {
    const err = new Error('انتهت فترة اشتراك المركز وتجاوزت فترة السماح (7 أيام). يرجى تجديد الاشتراك للمتابعة.');
    (err as unknown as { status: number }).status = 402;
    (err as unknown as { code: string }).code = 'SUBSCRIPTION_EXPIRED';
    throw err;
  }
  return sub;
}
