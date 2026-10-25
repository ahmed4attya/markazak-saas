// app/api/tenants/route.ts - Multi-Tenant SaaS Management API
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().trim().min(2, 'اسم المركز لا يقل عن حرفين').max(160),
  adminName: z.string().trim().min(2, 'اسم المدير مطلوب').max(160),
  email: z.string().trim().toLowerCase().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب ألا تقل عن 8 خانات'),
  phone: z.string().trim().optional(),
  plan: z.enum(['starter', 'pro', 'enterprise']).default('pro'),
  addDemo: z.boolean().default(true),
});

function slugify(text: string) {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0621-\u064A-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '') || 'center-' + Math.floor(1000 + Math.random() * 9000)
  );
}

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: 'غير مصرح — مخصص لمالك وإدارة المنصة' }, { status: 403 });
  }

  try {
    // 1. Fetch tenants list with stats and owner info
    const tenantsRes = await query(`
      select
        t.id,
        t.name,
        t.slug,
        t.logo_url,
        t.plan,
        t.status,
        t.created_at,
        (select count(*)::int from students s where s.tenant_id = t.id) as students_count,
        (select count(*)::int from courses c where c.tenant_id = t.id) as courses_count,
        (select u.name from users u where u.tenant_id = t.id and u.role in ('owner', 'admin') order by u.created_at asc limit 1) as owner_name,
        (select u.email from users u where u.tenant_id = t.id and u.role in ('owner', 'admin') order by u.created_at asc limit 1) as owner_email,
        (select u.phone from users u where u.tenant_id = t.id and u.role in ('owner', 'admin') order by u.created_at asc limit 1) as owner_phone
      from tenants t
      order by t.created_at desc
    `);

    // 2. Fetch pending registration requests
    const reqsRes = await query(`
      select id, name, email, phone, center_name, role, status, created_at
      from registration_requests
      order by created_at desc
      limit 30
    `);

    return NextResponse.json({
      ok: true,
      tenants: tenantsRes.rows,
      registrationRequests: reqsRes.rows,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
    return NextResponse.json({ error: 'تعذر جلب بيانات المراكز: ' + msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: 'غير مصرح — مخصص لمالك وإدارة المنصة' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createTenantSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'البيانات المدخلة غير صحيحة' },
        { status: 400 }
      );
    }

    const { name, adminName, email, password, phone, plan, addDemo } = parsed.data;

    // Check if email exists
    const emailCheck = await query('select id from users where lower(email) = lower($1) limit 1', [email]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً في النظام' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (true) {
      const slugCheck = await query('select id from tenants where slug = $1 limit 1', [finalSlug]);
      if (slugCheck.rows.length === 0) break;
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // 1. Create Tenant
    const tenantRes = await query<{ id: string; name: string; slug: string; plan: string }>(
      `insert into tenants (name, slug, plan, status)
       values ($1, $2, $3, 'active')
       returning id, name, slug, plan`,
      [name, finalSlug, plan]
    );
    const tenant = tenantRes.rows[0];

    // 2. Hash password & Create Owner User
    const passwordHash = await bcrypt.hash(password, 12);
    const userRes = await query<{ id: string; name: string; email: string; role: string }>(
      `insert into users (tenant_id, email, name, phone, password_hash, role, active)
       values ($1, $2, $3, $4, $5, 'owner', true)
       returning id, name, email, role`,
      [tenant.id, email, adminName, phone || null, passwordHash]
    );
    const user = userRes.rows[0];

    // 3. Optionally add starter demo data
    if (addDemo) {
      const courseRes = await query<{ id: string }>(
        `insert into courses (tenant_id, name, code, category, price, status, description)
         values ($1, 'دورة التأسيس الشامل للقدرات (كمي ولفظي)', 'QUD-DEMO', 'قدرات عامة', 500, 'active', 'دورة تأسيسية متكاملة للطلاب.')
         returning id`,
        [tenant.id]
      );
      const courseId = courseRes.rows[0]?.id;

      const groupRes = await query<{ id: string }>(
        `insert into groups (tenant_id, course_id, name, capacity, mode, status)
         values ($1, $2, 'مجموعة التميز - مسائي', 25, 'onsite', 'active')
         returning id`,
        [tenant.id, courseId]
      );
      const groupId = groupRes.rows[0]?.id;

      const s1 = await query<{ id: string }>(
        `insert into students (tenant_id, student_no, name, phone, status)
         values ($1, 'STU-001', 'أحمد بن محمد السالم (طالب تجريبي)', '0551112233', 'active')
         returning id`,
        [tenant.id]
      );
      const s2 = await query<{ id: string }>(
        `insert into students (tenant_id, student_no, name, phone, status)
         values ($1, 'STU-002', 'سارة فهد الشمري (طالبة تجريبية)', '0554445566', 'active')
         returning id`,
        [tenant.id]
      );

      if (groupId && s1.rows[0]?.id) {
        await query(
          `insert into enrollments (tenant_id, group_id, student_id, status, price)
           values ($1, $2, $3, 'active', 500) on conflict do nothing`,
          [tenant.id, groupId, s1.rows[0].id]
        );
      }
      if (groupId && s2.rows[0]?.id) {
        await query(
          `insert into enrollments (tenant_id, group_id, student_id, status, price)
           values ($1, $2, $3, 'active', 500) on conflict do nothing`,
          [tenant.id, groupId, s2.rows[0].id]
        );
      }

      await query(
        `insert into questions (tenant_id, course_id, domain, subject, skill, difficulty, kind, text, options, correct_index, explanation)
         values ($1, $2, 'قدرات كمي', 'الحساب', 'التناسب الطردي', 3, 'mcq',
                 'إذا كانت تكلفة ٥ كتب هي ٧٥ ريال، فما تكلفة ٨ كتب من نفس النوع؟',
                 '["100 ريال", "120 ريال", "140 ريال", "150 ريال"]'::jsonb,
                 1,
                 'سعر الكتاب الواحد = 75 ÷ 5 = 15 ريال. تكلفة 8 كتب = 8 × 15 = 120 ريال.')`,
        [tenant.id, courseId]
      );
    }

    // 4. Welcome notification for the new tenant owner
    await query(
      `insert into notifications (tenant_id, user_id, title, body)
       values ($1, $2, 'مرحباً بك في منصتك الخاصة!', 'تم إعداد وتهيئة نظام المركز بنجاح. يمكنك الآن تخصيص الشعار والاسم من الإعدادات وإضافة الكادر التدريبي والطلاب.')`,
      [tenant.id, user.id]
    );

    // 5. In-app notification for Platform Owner
    await query(
      `insert into notifications (tenant_id, user_id, title, body)
       values ($1, $2, 'تم إنشاء مركز SaaS جديد بنجاح', $3)`,
      [
        session.tenantId,
        session.userId,
        `تم تدشين مركز (${tenant.name}) برئاسة (${user.name}) بالبريد: ${user.email}`,
      ]
    );

    // 6. Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: session.userId,
      action: 'tenant.created',
      entity: 'tenant',
      entityId: tenant.id,
      metadata: { name: tenant.name, slug: tenant.slug, ownerEmail: user.email },
    });

    return NextResponse.json({
      ok: true,
      tenant,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      credentials: {
        loginUrl: 'https://markazak-saas.vercel.app/login',
        email: user.email,
        password,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'فشل إنشاء المركز';
    return NextResponse.json({ error: 'تعذر إنشاء المركز: ' + msg }, { status: 500 });
  }
}
