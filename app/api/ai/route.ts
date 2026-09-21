import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getContext(tenantId: string) {
  const [
    students,
    teachers,
    courses,
    groups,
    enrollments,
    attendance,
    finance,
    recentInvoices,
  ] = await Promise.all([
    query(
      `select count(*)::int count from students where tenant_id=$1`,
      [tenantId]
    ),
    query(
      `select count(*)::int count from teachers where tenant_id=$1 and status='active'`,
      [tenantId]
    ),
    query(
      `select count(*)::int count from courses where tenant_id=$1`,
      [tenantId]
    ),
    query(
      `select count(*)::int count from groups where tenant_id=$1`,
      [tenantId]
    ),
    query(
      `select count(*)::int count from enrollments where tenant_id=$1 and status='active'`,
      [tenantId]
    ),
    query(
      `
        select
          count(*)::int total,
          count(*) filter(where status='present')::int present,
          count(*) filter(where status='absent')::int absent,
          count(*) filter(where status='late')::int late,
          count(*) filter(where status='excused')::int excused
        from attendance
        where tenant_id=$1
      `,
      [tenantId]
    ),
    query(
      `
        select
          coalesce((select sum(amount) from payments where tenant_id=$1),0)::numeric paid,
          coalesce((select sum(amount) from invoices where tenant_id=$1),0)::numeric invoiced,
          coalesce((
            select sum(i.amount - coalesce(p.paid,0))
            from invoices i
            left join (
              select invoice_id,sum(amount) paid
              from payments
              where tenant_id=$1
              group by invoice_id
            ) p on p.invoice_id=i.id
            where i.tenant_id=$1
          ),0)::numeric outstanding
      `,
      [tenantId]
    ),
    query(
      `
        select number, amount, status, created_at
        from invoices
        where tenant_id=$1
        order by created_at desc
        limit 10
      `,
      [tenantId]
    ),
  ]);

  const a = attendance.rows[0];

  return {
    students: students.rows[0].count,
    teachers: teachers.rows[0].count,
    courses: courses.rows[0].count,
    groups: groups.rows[0].count,
    enrollments: enrollments.rows[0].count,
    attendance: {
      total: a.total,
      present: a.present,
      absent: a.absent,
      late: a.late,
      excused: a.excused,
      rate: a.total
        ? Math.round((a.present / a.total) * 100)
        : 0,
    },
    finance: {
      paid: Number(finance.rows[0].paid),
      invoiced: Number(finance.rows[0].invoiced),
      outstanding: Number(finance.rows[0].outstanding),
    },
    recentInvoices: recentInvoices.rows,
  };
}

function internalAnswer(prompt: string, ctx: any) {
  const p = prompt.toLowerCase();

  if (
    p.includes('حضور') ||
    p.includes('attendance')
  ) {
    return [
      'تحليل الحضور',
      '',
      `إجمالي سجلات الحضور: ${ctx.attendance.total}`,
      `الحضور: ${ctx.attendance.present}`,
      `الغياب: ${ctx.attendance.absent}`,
      `التأخر: ${ctx.attendance.late}`,
      `المعذور: ${ctx.attendance.excused}`,
      `نسبة الحضور: ${ctx.attendance.rate}%`,
    ].join('\n');
  }

  if (
    p.includes('مال') ||
    p.includes('إيراد') ||
    p.includes('تحصيل') ||
    p.includes('فاتور')
  ) {
    return [
      'التحليل المالي',
      '',
      `إجمالي الفواتير: ${ctx.finance.invoiced.toLocaleString('ar-SA')} ر.س`,
      `المحصل: ${ctx.finance.paid.toLocaleString('ar-SA')} ر.س`,
      `المستحق: ${ctx.finance.outstanding.toLocaleString('ar-SA')} ر.س`,
    ].join('\n');
  }

  return [
    'ملخص المركز',
    '',
    `الطلاب: ${ctx.students}`,
    `المدربون النشطون: ${ctx.teachers}`,
    `الدورات: ${ctx.courses}`,
    `المجموعات: ${ctx.groups}`,
    `المتدربون المسجلون: ${ctx.enrollments}`,
    `نسبة الحضور: ${ctx.attendance.rate}%`,
    `المحصل: ${ctx.finance.paid.toLocaleString('ar-SA')} ر.س`,
    `المستحق: ${ctx.finance.outstanding.toLocaleString('ar-SA')} ر.س`,
    '',
    'يمكنك سؤالي عن الحضور أو الطلاب أو الدورات أو الإيرادات أو الفواتير.',
  ].join('\n');
}

export async function POST(req: Request) {
  const s = await getSession();

  if (!s) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const prompt = String(body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json(
        { error: 'اكتب سؤالك أولاً' },
        { status: 400 }
      );
    }

    const context = await getContext(s.tenantId);

    if (
      process.env.AI_API_URL &&
      process.env.AI_API_KEY
    ) {
      const response = await fetch(process.env.AI_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'أنت مساعد إداري لمركز تدريبي. استخدم البيانات المقدمة فقط. قدم تحليلاً عملياً واضحاً باللغة العربية.',
            },
            {
              role: 'user',
              content: `
بيانات المركز:
${JSON.stringify(context, null, 2)}

سؤال المستخدم:
${prompt}
              `,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const answer =
          data?.choices?.[0]?.message?.content ||
          data?.answer ||
          data?.output_text;

        if (answer) {
          return NextResponse.json({
            answer,
            source: 'external-ai',
            context,
          });
        }
      }
    }

    return NextResponse.json({
      answer: internalAnswer(prompt, context),
      source: 'internal',
      context,
    });
  } catch (error) {
    console.error('AI error:', error);

    return NextResponse.json(
      { error: 'تعذر تنفيذ تحليل الذكاء الاصطناعي' },
      { status: 500 }
    );
  }
}
