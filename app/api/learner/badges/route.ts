import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'starter' | 'speed' | 'mastery' | 'streak' | 'excellence';
  pointsReward: number;
  unlocked: boolean;
  progress: number; // 0 - 100
  currentValue: number;
  targetValue: number;
  unit: string;
}

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (s.role !== 'student' && s.role !== 'guardian') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  try {
    const userId = s.userId;
    const tenantId = s.tenantId;

    // 1. Fetch user stats
    const userRes = await query('select points, streak from users where id=$1 and tenant_id=$2', [userId, tenantId]);
    const user = userRes.rows[0] as any || {};
    const points = Number(user.points || 0);
    const streak = Number(user.streak || 0);

    // 2. Fetch attempts stats
    const attemptsRes = await query(
      `select count(*)::int as attempts_count,
              coalesce(sum(total), 0)::int as questions_answered,
              coalesce(sum(score), 0)::int as questions_correct,
              coalesce(max(case when total >= 5 then (score::float / total) * 100 else 0 end), 0)::int as best_pct
       from attempts 
       where user_id=$1 and tenant_id=$2 and finished_at is not null`,
      [userId, tenantId]
    );
    const stats = attemptsRes.rows[0] as any || {};
    const attemptsCount = Number(stats.attempts_count || 0);
    const questionsAnswered = Number(stats.questions_answered || 0);
    const questionsCorrect = Number(stats.questions_correct || 0);
    const bestPct = Number(stats.best_pct || 0);

    // 3. Define Badges with dynamic evaluation
    const badges: BadgeDefinition[] = [
      {
        id: 'first_step',
        title: 'خطوة البداية 🚀',
        description: 'إكمال أول اختبار أو تدريب في المنصة',
        icon: '🌱',
        category: 'starter',
        pointsReward: 50,
        unlocked: attemptsCount >= 1,
        progress: Math.min(100, Math.round((attemptsCount / 1) * 100)),
        currentValue: attemptsCount,
        targetValue: 1,
        unit: 'تدريب',
      },
      {
        id: 'century_club',
        title: 'نادي المئة 🎯',
        description: 'حل 100 سؤال من بنك أسئلة قياس',
        icon: '💯',
        category: 'mastery',
        pointsReward: 150,
        unlocked: questionsAnswered >= 100,
        progress: Math.min(100, Math.round((questionsAnswered / 100) * 100)),
        currentValue: questionsAnswered,
        targetValue: 100,
        unit: 'سؤال',
      },
      {
        id: 'week_flame',
        title: 'شعلة الأسبوع 🔥',
        description: 'المحافظة على سلسلة دراسة متواصلة لمدة 7 أيام',
        icon: '🔥',
        category: 'streak',
        pointsReward: 200,
        unlocked: streak >= 7,
        progress: Math.min(100, Math.round((streak / 7) * 100)),
        currentValue: streak,
        targetValue: 7,
        unit: 'أيام',
      },
      {
        id: 'speed_sniper',
        title: 'قناص الثواني ⚡',
        description: 'إنجاز 3 تحديات ذاتية بنجاح وسرعة فائقة',
        icon: '⚡',
        category: 'speed',
        pointsReward: 100,
        unlocked: attemptsCount >= 3,
        progress: Math.min(100, Math.round((attemptsCount / 3) * 100)),
        currentValue: attemptsCount,
        targetValue: 3,
        unit: 'تحديات',
      },
      {
        id: 'qiyas_champion',
        title: 'بطل الخوارزمي 🏆',
        description: 'تحقيق نسبة 90%+ في اختبار شامل',
        icon: '👑',
        category: 'excellence',
        pointsReward: 300,
        unlocked: bestPct >= 90,
        progress: Math.min(100, Math.round((bestPct / 90) * 100)),
        currentValue: bestPct,
        targetValue: 90,
        unit: '%',
      },
      {
        id: 'mistake_vanquisher',
        title: 'صائد الأخطاء 🛡️',
        description: 'حل 20 سؤالاً إضافياً لتثبيت نقاط الضعف',
        icon: '🛡️',
        category: 'mastery',
        pointsReward: 120,
        unlocked: questionsCorrect >= 20,
        progress: Math.min(100, Math.round((questionsCorrect / 20) * 100)),
        currentValue: questionsCorrect,
        targetValue: 20,
        unit: 'إجابة صحيحة',
      },
    ];

    const unlockedCount = badges.filter((b) => b.unlocked).length;

    return NextResponse.json({
      badges,
      unlockedCount,
      totalCount: badges.length,
      points,
      streak,
    });
  } catch (e) {
    return NextResponse.json({ error: 'تعذر جلب الأوسمة' }, { status: 500 });
  }
}
