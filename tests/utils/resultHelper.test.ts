import { calculateScore, getFeedbackMessage, QuizHistoryItem } from '../../src/utils/resultHelper';

describe('resultHelper', () => {
  describe('calculateScore', () => {
    it('returns 0 for empty history', () => {
      expect(calculateScore([])).toBe(0);
    });

    it('returns 100 for 10 all correct answers', () => {
      const history: QuizHistoryItem[] = Array.from({ length: 10 }, (_, i) => ({
        expression: `${i + 1} \\times 2`,
        userAns: (i + 1) * 2,
        realAns: (i + 1) * 2,
        isCorrect: true,
      }));
      expect(calculateScore(history)).toBe(100);
    });

    it('returns 70 when 7 answers are correct and 3 are wrong', () => {
      const history: QuizHistoryItem[] = [
        ...Array.from({ length: 7 }, () => ({
          expression: '2 \\times 2',
          userAns: 4,
          realAns: 4,
          isCorrect: true,
        })),
        ...Array.from({ length: 3 }, () => ({
          expression: '3 \\times 3',
          userAns: 8,
          realAns: 9,
          isCorrect: false,
        })),
      ];
      expect(calculateScore(history)).toBe(70);
    });

    it('returns 0 when all answers are wrong', () => {
      const history: QuizHistoryItem[] = Array.from({ length: 10 }, () => ({
        expression: '5 \\times 5',
        userAns: 0,
        realAns: 25,
        isCorrect: false,
      }));
      expect(calculateScore(history)).toBe(0);
    });
  });

  describe('getFeedbackMessage', () => {
    it('returns perfect message for 100 score', () => {
      const fb = getFeedbackMessage(100);
      expect(fb.title).toContain('100점');
      expect(fb.emoji).toBe('🏆');
    });

    it('returns high score message for 80-99 score', () => {
      const fb80 = getFeedbackMessage(80);
      expect(fb80.title).toContain('대단해요');
      expect(fb80.emoji).toBe('🥇');

      const fb90 = getFeedbackMessage(90);
      expect(fb90.title).toContain('대단해요');
    });

    it('returns medium score message for 60-79 score', () => {
      const fb60 = getFeedbackMessage(60);
      expect(fb60.title).toContain('잘했어요');
      expect(fb60.emoji).toBe('🥈');

      const fb70 = getFeedbackMessage(70);
      expect(fb70.title).toContain('잘했어요');
    });

    it('returns encourage message for < 60 score', () => {
      const fb50 = getFeedbackMessage(50);
      expect(fb50.title).toContain('수고했어요');
      expect(fb50.emoji).toBe('🎯');

      const fb0 = getFeedbackMessage(0);
      expect(fb0.title).toContain('수고했어요');
    });
  });
});
