import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { query, safeError } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  if (!isAdmin(s.role)) {
    return NextResponse.json(
      { error: 'الصلاحية دي للإدارة بس' },
      { status: 403 }
    );
  }

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    return NextResponse.json(
      { error: 'خدمة الدفع غير مفعّلة حاليًا' },
      { status: 503 }
    );
  }

  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const planCode = String(body.plan_code || '').trim();
  const interval = body.interval === 'yearly' ? 'yearly' : 'monthly';

  if (!planCode) {
    return NextResponse.json({ error: 'حدد الخطة' }, { status: 400 });
  }

  const planResult = await query(
    `select code, name, monthly_price, yearly_price
     from plans
     where code = $1 and active = true`,
    [planCode]
  );

  const plan = planResult.rows[0];

  if (!plan) {
    return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });
  }

  const amount =
    interval === 'yearly'
      ? Number(plan.yearly_price)
      : Number(plan.monthly_price);

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'سعر الخطة غير صالح لهذه الفترة' },
      { status: 400 }
    );
  }

  const tenantResult = await query(
    `select name from tenants where id = $1`,
    [s.tenantId]
  );

  const tenantName = tenantResult.rows[0]?.name || 'مركز تدريبي';

  const subResult = await query(
    `select stripe_customer_id from subscriptions where tenant_id = $1`,
    [s.tenantId]
  );

  const stripe = new Stripe(key);

  let customerId = subResult.rows[0]?.stripe_customer_id as
    | string
    | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: s.email,
      name: tenantName,
      metadata: { tenant_id: s.tenantId },
    });

    customerId = customer.id;

    await query(
      `insert into subscriptions (tenant_id, stripe_customer_id, plan, status)
       values ($1, $2, $3, 'incomplete')
       on conflict (tenant_id) do update set
         stripe_customer_id = excluded.stripe_customer_id`,
      [s.tenantId, customerId, planCode]
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'sar',
            unit_amount: Math.round(amount * 100),
            recurring: {
              interval: interval === 'yearly' ? 'year' : 'month',
            },
            product_data: {
              name: `اشتراك ${plan.name}`,
            },
          },
        },
      ],
      metadata: { tenant_id: s.tenantId, plan_code: planCode },
      subscription_data: {
        metadata: { tenant_id: s.tenantId, plan_code: planCode },
      },
      success_url: `${appUrl}/plans?checkout=success`,
      cancel_url: `${appUrl}/plans?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: safeError(error, 'تعذر بدء عملية الدفع') },
      { status: 500 }
    );
  }
}
