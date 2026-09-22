export interface QuizHistoryItem {
  expression: string;
  userAns: number;
  realAns: number;
  isCorrect: boolean;
}

/**
 * Calculates total score based on history (each correct answer is 10 points).
 */
export function calculateScore(history: QuizHistoryItem[]): number {
  if (!history || history.length === 0) return 0;
  const correctCount = history.filter(item => item.isCorrect).length;
  return correctCount * 10;
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
