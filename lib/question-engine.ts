export interface BaseQuestion {
  id: string;
  text: string;
  domain: string;
  course_id?: string | null;
  subject?: string | null;
  topic?: string | null;
  skill?: string | null;
  difficulty?: number;
  options?: string[];
  correct_index?: number;
  explanation?: string | null;
  image_url?: string | null;
  passage?: string | null;
}

export interface ScoredQuestion<T extends BaseQuestion = BaseQuestion> {
  question: T;
  score: number;
  isRecommended: boolean;
  isUsed: boolean;
  reasons: string[];
}

/**
 * Evaluates and scores a question based on pedagogical quality, completeness, and freshness.
 */
export function evaluateQuestion<T extends BaseQuestion>(
  q: T,
  usedIdsSet: Set<string>
): ScoredQuestion<T> {
  const isUsed = usedIdsSet.has(q.id);
  let score = 0;
  const reasons: string[] = [];

  // Freshness (not used in prior exams or assignments)
  if (!isUsed) {
    score += 50;
    reasons.push('غير مكرر');
  }

  // Completeness of explanation
  if (q.explanation && q.explanation.trim().length > 10) {
    score += 25;
    reasons.push('شرح نموذجي');
  }

  // 4 clear options
  const validOpts = Array.isArray(q.options) ? q.options.filter((o) => typeof o === 'string' && o.trim().length > 0) : [];
  if (validOpts.length >= 4) {
    score += 15;
  }

  // Balanced difficulty (3 = ideal center)
  const diff = Number(q.difficulty) || 3;
  if (diff === 3) {
    score += 10;
    reasons.push('صعوبة متوازنة');
  } else if (diff === 2 || diff === 4) {
    score += 5;
  }

  // Verified visual / reading attachment
  if (q.image_url && q.image_url.trim().length > 0) {
    score += 10;
    reasons.push('رسم هندسي');
  } else if (q.passage && q.passage.trim().length > 0) {
    score += 10;
    reasons.push('قطعة استيعاب');
  }

  const isRecommended = score >= 65 && !isUsed;

  return {
    question: q,
    score,
    isRecommended,
    isUsed,
    reasons,
  };
}

/**
 * Intelligent Auto-Selector: picks balanced, top-scoring questions while strictly excluding used ones.
 */
export function autoSelectQuestions<T extends BaseQuestion>(
  pool: T[],
  count: number,
  usedIdsSet: Set<string>,
  options: {
    excludeUsed?: boolean;
    prioritizeRecommended?: boolean;
    excludeIds?: string[];
  } = {}
): T[] {
  const { excludeUsed = true, prioritizeRecommended = true, excludeIds = [] } = options;
  const excludedSet = new Set<string>([...excludeIds]);
  if (excludeUsed) {
    usedIdsSet.forEach((id) => excludedSet.add(id));
  }

  // Filter out excluded
  let eligible = pool.filter((q) => !excludedSet.has(q.id));

  // If pool runs dry because of exclusion, fallback to unused if possible or remaining pool
  if (eligible.length < count && pool.length >= count) {
    const fallbackEligible = pool.filter((q) => !excludeIds.includes(q.id));
    if (fallbackEligible.length >= count) {
      eligible = fallbackEligible;
    }
  }

  if (eligible.length <= count) {
    return eligible;
  }

  if (prioritizeRecommended) {
    const scored = eligible.map((q) => evaluateQuestion(q, usedIdsSet));
    // Sort primarily by score with a degree of randomized jitter for variety
    scored.sort((a, b) => {
      const jitterA = a.score + (Math.random() * 15);
      const jitterB = b.score + (Math.random() * 15);
      return jitterB - jitterA;
    });
    return scored.slice(0, count).map((s) => s.question);
  }

  // Uniform shuffle
  return [...eligible].sort(() => 0.5 - Math.random()).slice(0, count);
}

const ARABIC_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

/**
 * Formats question list into clean Arabic assignment text with options and headers.
 */
export function formatAssignmentQuestions(questions: BaseQuestion[]): string {
  return questions
    .map((q, i) => {
      let optsText = '';
      if (Array.isArray(q.options) && q.options.length > 0) {
        optsText = '\n' + q.options
          .map((opt, oi) => `   (${ARABIC_LETTERS[oi] || oi + 1}) ${opt}`)
          .join('   ');
      }
      const label = q.topic || q.subject || q.skill || '';
      const badge = label ? ` [${label}]` : '';
      return `【السؤال ${i + 1}】${badge}:\n${q.text || 'انظر الشكل المرفق للإجابة عن السؤال'}${optsText}`;
    })
    .join('\n\n────────────────────\n\n');
}
