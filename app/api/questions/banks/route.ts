import { NextResponse } from 'next/server';
import { query, safeError } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!isAdminRole(s.role) && s.role !== 'teacher') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    const sql = `
      select 
        coalesce(nullif(trim(subject), ''), 'عام') as name,
        domain,
        count(*)::int as count
      from questions
      where tenant_id = $1
      group by domain, coalesce(nullif(trim(subject), ''), 'عام')
      order by count desc
    `;
    const rows = (await query(sql, [s.tenantId])).rows;

    const emojiMap: Record<string, string> = {
      'التأسيس المتين': '⭐',
      'الأكثر وروداً': '🔥',
      'بنك التميّز': '💎',
      'بنك إتقان الأقسام': '📚',
      'اختبارات المحاكاة الورقية': '🎯',
      'تدريبات الأقسام': '🧩',
      'مسار البداية': '🚀',
      'الحساب والمقارنات': '⚖️',
      'الجبر': '🔢',
      'الهندسة والقياس': '📐',
      'تحصيلي أحياء': '🧬',
      'تحصيلي رياضيات': '📈',
      'الاستنتاج القرائي': '📖',
      'الخطأ السياقي': '✍️',
      'التناظر اللفظي': '🔄',
      'إكمال الجمل': '📝',
      'تجميعات الأقسام اللفظية (300 قسم)': '📜',
      'التحليل الإحصائي': '📊',
    };

    const banks = rows.map((r: any) => ({
      id: r.name,
      name: `${emojiMap[r.name] || '📁'} ${r.name}`,
      rawName: r.name,
      domain: r.domain,
      count: r.count,
    }));

    return NextResponse.json(banks);
  } catch (e) {
    return NextResponse.json({ error: safeError(e, 'تعذر جلب البنوك') }, { status: 500 });
  }
}
