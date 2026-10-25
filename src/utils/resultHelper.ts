export interface QuizHistoryItem {
  expression: string;
  userAns: number;
  realAns: number;
  isCorrect: boolean;
}

/**
 * Calculates total score on a 0-100 scale based on history.
 * 왜 비율 계산을 사용하는가: 기본 10문제 세션에서는 1문제당 10점과 동일하게 동작하면서도,
 * 오답 노트 재도전(예: 틀린 3문제만 복습) 시에도 100점 만점 기준의 정확한 성취도를 산출하기 위함.
 */
export function calculateScore(history: QuizHistoryItem[]): number {
  if (!history || history.length === 0) return 0;
  const correctCount = history.filter((item) => item.isCorrect).length;
  return Math.round((correctCount / history.length) * 100);
}

export interface FeedbackMessage {
  title: string;
  subtitle: string;
  emoji: string;
}

/**
 * Returns encouragement title, subtitle and emoji based on final score.
 */
export function getFeedbackMessage(score: number): FeedbackMessage {
  if (score >= 100) {
    return {
      title: '완벽해요! 100점 만점!',
      subtitle: '곱셈의 달인이 나타났어요! 👑✨',
      emoji: '🏆',
    };
  }
  if (score >= 80) {
    return {
      title: '대단해요! 훌륭한 실력이에요!',
      subtitle: '조금만 더 연습하면 만점에 닿을 수 있어요! 🌟',
      emoji: '🥇',
    };
  }
  if (score >= 60) {
    return {
      title: '잘했어요! 멋진 도전이에요!',
      subtitle: '꾸준히 연습하면 더 잘할 수 있어요! 💪',
      emoji: '🥈',
    };
  }
  return {
    title: '수고했어요! 한 번 더 도전해 볼까요?',
    subtitle: '실수는 성장의 기회예요! 다시 해봐요! 🌱',
    emoji: '🎯',
  };
}

export interface SessionRecordSummary {
  category: string;
  total_questions: number;
  correct_count: number;
  earned_exp: number;
}

export interface CategoryAccuracyStat {
  category: string;
  sessionCount: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  perfectCount: number;
}

export interface LearningAnalytics {
  totalSessions: number;
  averageAccuracy: number;
  perfectSessions: number;
  totalEarnedExp: number;
  byCategory: Record<string, CategoryAccuracyStat>;
  recommendedCategory: string | null;
  recommendationMessage: string;
}

const ALL_CATEGORIES = ['gugudan', '2x1', '3x1', '2x2'] as const;

const CATEGORY_KO_NAMES: Record<string, string> = {
  gugudan: '구구단',
  '2x1': '두자리 × 한자리',
  '3x1': '세자리 × 한자리',
  '2x2': '두자리 × 두자리',
};

/**
 * 사용자의 누적 학습 세션 데이터를 분석하여 카테고리별 정답률과 맞춤형 학습 추천 코멘트를 생성합니다.
 */
export function analyzeLearningSessions(sessions: SessionRecordSummary[]): LearningAnalytics {
  const byCategory: Record<string, CategoryAccuracyStat> = {};
  for (const cat of ALL_CATEGORIES) {
    byCategory[cat] = {
      category: cat,
      sessionCount: 0,
      totalQuestions: 0,
      correctCount: 0,
      accuracy: 0,
      perfectCount: 0,
    };
  }

  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      averageAccuracy: 0,
      perfectSessions: 0,
      totalEarnedExp: 0,
      byCategory,
      recommendedCategory: 'gugudan',
      recommendationMessage: '먼저 구구단 워밍업으로 첫 마스터 기록을 만들어 볼까요?',
    };
  }

  let totalQuestionsAll = 0;
  let totalCorrectAll = 0;
  let perfectSessions = 0;
  let totalEarnedExp = 0;

  for (const s of sessions) {
    const q = Math.max(0, s.total_questions || 0);
    const c = Math.max(0, s.correct_count || 0);
    totalQuestionsAll += q;
    totalCorrectAll += c;
    totalEarnedExp += Math.max(0, s.earned_exp || 0);
    if (q > 0 && c === q) {
      perfectSessions += 1;
    }

    if (!byCategory[s.category]) {
      byCategory[s.category] = {
        category: s.category,
        sessionCount: 0,
        totalQuestions: 0,
        correctCount: 0,
        accuracy: 0,
        perfectCount: 0,
      };
    }
    const stat = byCategory[s.category];
    stat.sessionCount += 1;
    stat.totalQuestions += q;
    stat.correctCount += c;
    if (q > 0 && c === q) {
      stat.perfectCount += 1;
    }
  }

  for (const key of Object.keys(byCategory)) {
    const stat = byCategory[key];
    stat.accuracy =
      stat.totalQuestions > 0 ? Math.round((stat.correctCount / stat.totalQuestions) * 100) : 0;
  }

  const averageAccuracy =
    totalQuestionsAll > 0 ? Math.round((totalCorrectAll / totalQuestionsAll) * 100) : 0;

  // 추천 로직: 1) 한 번도 안 풀어본 카테고리 -> 2) 정답률이 가장 낮은 카테고리 -> 3) 모두 90% 이상이면 가장 높은 난이도 격려
  const untried = ALL_CATEGORIES.find((cat) => byCategory[cat].sessionCount === 0);
  if (untried) {
    const label = CATEGORY_KO_NAMES[untried] || untried;
    return {
      totalSessions: sessions.length,
      averageAccuracy,
      perfectSessions,
      totalEarnedExp,
      byCategory,
      recommendedCategory: untried,
      recommendationMessage: `아직 '${label}'에 도전하지 않았어요! 새로운 영역을 정복해 볼까요?`,
    };
  }

  const triedStats = ALL_CATEGORIES.map((cat) => byCategory[cat]);
  triedStats.sort((a, b) => a.accuracy - b.accuracy);
  const weakest = triedStats[0];

  if (weakest.accuracy < 90) {
    const label = CATEGORY_KO_NAMES[weakest.category] || weakest.category;
    return {
      totalSessions: sessions.length,
      averageAccuracy,
      perfectSessions,
      totalEarnedExp,
      byCategory,
      recommendedCategory: weakest.category,
      recommendationMessage: `'${label}' 정답률이 ${weakest.accuracy}%예요! 조금만 더 연습하면 마스터할 수 있어요! 💪`,
    };
  }

  return {
    totalSessions: sessions.length,
    averageAccuracy,
    perfectSessions,
    totalEarnedExp,
    byCategory,
    recommendedCategory: '2x2',
    recommendationMessage: '모든 영역에서 90% 이상의 놀라운 실력을 보여주고 있어요! 진정한 곱셈 마스터! 👑',
  };
}
