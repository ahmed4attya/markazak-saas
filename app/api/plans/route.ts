import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const [plans, subscription] = await Promise.all([
      query(`
        SELECT
          id,
          code,
          name,
          monthly_price,
          yearly_price,
          limits,
          features,
          active
        FROM plans
        WHERE active = true
        ORDER BY monthly_price ASC
      `),

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
    ]);

    return NextResponse.json({
      plans: plans.rows,
      subscription:
        subscription.rows[0] || {
          plan: 'starter',
          status: 'trialing',
          current_period_end: null,
        },
    });
  } catch (error) {
    console.error('Plans GET error:', error);

    return NextResponse.json(
      { error: 'تعذر تحميل الخطط' },
      { status: 500 }
    );
  }
}
