import { generateProblem } from '../../src/utils/mathGenerator';

describe('Math Generator', () => {
  describe('gugudan (구구단)', () => {
    it('should generate valid multiplication table problem within 2~9 and 1~9', () => {
      for (let i = 0; i < 50; i++) {
        const result = generateProblem('gugudan');
        const match = result.expression.match(/^([2-9]) \\times ([1-9])$/);
        expect(match).not.toBeNull();
        if (match && match[1] && match[2]) {
          const a = parseInt(match[1], 10);
          const b = parseInt(match[2], 10);
          expect(a).toBeGreaterThanOrEqual(2);
          expect(a).toBeLessThanOrEqual(9);
          expect(b).toBeGreaterThanOrEqual(1);
          expect(b).toBeLessThanOrEqual(9);
          expect(result.answer).toBe(a * b);
        }
      }
    });
  });

  describe('2x1 (두자리 × 한자리)', () => {
    it('should generate valid 2-digit by 1-digit problems (10~99 × 2~9)', () => {
      for (let i = 0; i < 50; i++) {
        const result = generateProblem('2x1');
        const match = result.expression.match(/^([1-9][0-9]) \\times ([2-9])$/);
        expect(match).not.toBeNull();
        if (match && match[1] && match[2]) {
          const a = parseInt(match[1], 10);
          const b = parseInt(match[2], 10);
          expect(a).toBeGreaterThanOrEqual(10);
          expect(a).toBeLessThanOrEqual(99);
          expect(b).toBeGreaterThanOrEqual(2);
          expect(b).toBeLessThanOrEqual(9);
          expect(result.answer).toBe(a * b);
        }
      }
    });
  });

  describe('3x1 (세자리 × 한자리)', () => {
    it('should generate valid 3-digit by 1-digit problems (100~999 × 2~9)', () => {
      for (let i = 0; i < 50; i++) {
        const result = generateProblem('3x1');
        const match = result.expression.match(/^([1-9][0-9]{2}) \\times ([2-9])$/);
        expect(match).not.toBeNull();
        if (match && match[1] && match[2]) {
          const a = parseInt(match[1], 10);
          const b = parseInt(match[2], 10);
          expect(a).toBeGreaterThanOrEqual(100);
          expect(a).toBeLessThanOrEqual(999);
          expect(b).toBeGreaterThanOrEqual(2);
          expect(b).toBeLessThanOrEqual(9);
          expect(result.answer).toBe(a * b);
        }
      }
    });
  });

  describe('2x2 (두자리 × 두자리)', () => {
    it('should generate valid 2-digit by 2-digit problems (10~99 × 10~99)', () => {
      for (let i = 0; i < 50; i++) {
        const result = generateProblem('2x2');
        const match = result.expression.match(/^([1-9][0-9]) \\times ([1-9][0-9])$/);
        expect(match).not.toBeNull();
        if (match && match[1] && match[2]) {
          const a = parseInt(match[1], 10);
          const b = parseInt(match[2], 10);
          expect(a).toBeGreaterThanOrEqual(10);
          expect(a).toBeLessThanOrEqual(99);
          expect(b).toBeGreaterThanOrEqual(10);
          expect(b).toBeLessThanOrEqual(99);
          expect(result.answer).toBe(a * b);
        }
      }
    });
  });

  describe('unknown category fallback', () => {
    it('should return default problem for unknown category', () => {
      const result = generateProblem('unknown');
      expect(result.expression).toBe('0 \\times 0');
      expect(result.answer).toBe(0);
    });
  });
});
