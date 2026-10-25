import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getSubscriptionStatus } from '@/lib/subscription';

const PLANS_SQL = `
  SELECT id, code, name, monthly_price, yearly_price, limits, features, active
  FROM plans
  WHERE active = true
  ORDER BY monthly_price ASC
`;

export async function GET() {
  const session = await getSession();

  try {
    if (!session) {
      const anonPlans = await query(PLANS_SQL);
      return NextResponse.json({
        plans: anonPlans.rows,
        subscription: null,
      });
    }

    const [plans, subscription, statusDetails] = await Promise.all([
      query(PLANS_SQL),
      query(
        `
        SELECT
          id,
          plan,
          status,
          stripe_customer_id,
          stripe_subscription_id,
          current_period_end,
          created_at
        FROM subscriptions
        WHERE tenant_id = $1
        LIMIT 1
        `,
        [session.tenantId]
      ),
      getSubscriptionStatus(session.tenantId),
    ]);

    return NextResponse.json({
      plans: plans.rows,
      subscription:
        subscription.rows[0] || {
          plan: 'starter',
          status: 'trialing',
          current_period_end: null,
        },
      statusDetails,
    });
  } catch (error) {
    console.error('Plans GET error:', error);

    return NextResponse.json(
      { error: 'تعذر تحميل الخطط' },
      { status: 500 }
    );
  }
}
