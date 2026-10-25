import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, isAdmin } from '@/lib/auth';

const DEFAULTS = {
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

function normalize(data: any) {
  return {
    ...DEFAULTS,
    ...(data || {}),
  };
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  const result = await query(
    `
      select
        t.name,
        t.logo_url,
        t.timezone,
        t.currency,
        t.locale,
        t.plan,
        t.status,
        coalesce(s.data, '{}'::jsonb) as settings
      from tenants t
      left join settings s on s.tenant_id = t.id
      where t.id = $1
      limit 1
    `,
    [session.tenantId]
  );

  if (!result.rows.length) {
    return NextResponse.json(
      { error: 'المركز غير موجود' },
      { status: 404 }
    );
  }

  const row = result.rows[0];

  return NextResponse.json({
    ...normalize(row.settings),
    center_name: row.settings?.center_name || row.name || '',
    logo_url: row.settings?.logo_url || row.logo_url || '',
    timezone: row.settings?.timezone || row.timezone || 'Asia/Riyadh',
    currency: row.settings?.currency || row.currency || 'SAR',
    language:
      row.settings?.language ||
      (row.locale || 'ar-SA').split('-')[0],
    plan: row.plan,
    tenant_status: row.status,
    integrations: {
      stripe: Boolean(
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_WEBHOOK_SECRET
      ),
      posthog: Boolean(
        process.env.NEXT_PUBLIC_POSTHOG_KEY ||
        process.env.POSTHOG_API_KEY
      ),
      ai: Boolean(
        process.env.AI_API_URL &&
        process.env.AI_API_KEY
      ),
    },
  });
}

export async function PUT(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  if (!isAdmin(session.role)) {
    return NextResponse.json(
      { error: 'الصلاحية دي للإدارة بس' },
      { status: 403 }
    );
  }

  const body = await req.json();

  const data = {
    center_name: String(body.center_name || '').trim(),
    phone: String(body.phone || '').trim(),
    email: String(body.email || '').trim(),
    address: String(body.address || '').trim(),
    logo_url: String(body.logo_url || '').trim(),
    currency: ['SAR', 'EGP', 'AED', 'USD'].includes(body.currency)
      ? body.currency
      : 'SAR',
    timezone: String(body.timezone || 'Asia/Riyadh'),
    language: ['ar', 'en'].includes(body.language)
      ? body.language
      : 'ar',
    invoice_prefix:
      String(body.invoice_prefix || 'INV').trim().slice(0, 30),
    certificate_prefix:
      String(body.certificate_prefix || 'CERT').trim().slice(0, 30),
    notifications_enabled:
      body.notifications_enabled !== false,
  };

  await query(
    `
      insert into settings (
        tenant_id,
        data,
        updated_at
      )
      values ($1, $2::jsonb, now())
      on conflict (tenant_id)
      do update set
        data = excluded.data,
        updated_at = now()
    `,
    [
      session.tenantId,
      JSON.stringify(data),
    ]
  );

  await query(
    `
      update tenants
      set
        name = $2,
        logo_url = $3,
        timezone = $4,
        currency = $5,
        locale = $6,
        updated_at = now()
      where id = $1
    `,
    [
      session.tenantId,
      data.center_name || 'مركز تدريبي',
      data.logo_url || null,
      data.timezone,
      data.currency,
      `${data.language}-${data.language === 'ar' ? 'SA' : 'US'}`,
    ]
  );

  return NextResponse.json({
    success: true,
    settings: data,
  });
}
