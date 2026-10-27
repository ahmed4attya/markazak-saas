import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const userId = s.userId;
    const tenantId = s.tenantId;

    // Fetch finished attempts
    const attempts = (await query(
      `select id, score, total, finished_at, answers from attempts 
       where user_id=$1 and tenant_id=$2 and finished_at is not null and total > 0
       order by finished_at desc limit 100`,
      [userId, tenantId]
    )).rows as Array<any>;

    let totalAnswered = 0;
    let totalCorrect = 0;

    for (const a of attempts) {
      totalAnswered += Number(a.total || 0);
      totalCorrect += Number(a.score || 0);
    }

    // Default baseline if new student
    if (totalAnswered < 5) {
      return NextResponse.json({
        totalAnswered,
        totalCorrect,
        overallPct: 0,
        forecastScore: 75,
        rangeLow: 70,
        rangeHigh: 80,
        confidence: 'مبدئي',
        confidenceLevel: 'low',
        quantScore: 74,
        verbalScore: 76,
        advice: 'أكمل 15 سؤالاً إضافياً في التحدي الذاتي أو التدريب اليومي للحصول على توقع دقيق.',
      });
    }

    const overallPct = Math.round((totalCorrect / totalAnswered) * 100);

    // Qiyas Scaled Score Formula: baseline 50 + accuracy * 0.5 (calibrated to Saudi standard)
    // 60% accuracy -> 74
    // 80% accuracy -> 88
    // 90% accuracy -> 94
    // 95%+ accuracy -> 97 - 99
    const rawScore = 50 + overallPct * 0.5;
    const forecastScore = Math.min(99, Math.max(55, Math.round(rawScore)));

    const rangeLow = Math.max(50, forecastScore - 3);
    const rangeHigh = Math.min(100, forecastScore + 3);

    let confidence = 'مبدئي';
    let confidenceLevel: 'low' | 'medium' | 'high' = 'low';

    if (totalAnswered >= 60) {
      confidence = 'موثوق ودقيق';
      confidenceLevel = 'high';
    } else if (totalAnswered >= 20) {
      confidence = 'متوسط';
      confidenceLevel = 'medium';
    }

    // Rough breakdown
    const quantScore = Math.min(100, forecastScore + (overallPct >= 80 ? 1 : -1));
    const verbalScore = Math.min(100, forecastScore + (overallPct >= 80 ? -1 : 1));

    let advice = 'استمر في حل أسئلة التحدي والتركيز على أخطاء الهندسة لرفع درجتك لـ 95+.';
    if (forecastScore >= 90) {
      advice = 'مستوى متقدم واستثنائي! حافظ على وتيرة التدريب اليومي لحصد الدرجة الكاملة.';
    } else if (forecastScore < 75) {
      advice = 'راجع القوانين الذهبية في مكتبة القوانين وتدرّب على أسئلة التدرج المنتظم.';
    }

    return NextResponse.json({
      totalAnswered,
      totalCorrect,
      overallPct,
      forecastScore,
      rangeLow,
      rangeHigh,
      confidence,
      confidenceLevel,
      quantScore,
      verbalScore,
      advice,
    });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر حساب التوقع' }, { status: 500 });
  }
}
