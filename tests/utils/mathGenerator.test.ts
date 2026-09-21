import { generateProblem } from '../../src/utils/mathGenerator';

describe('Math Generator', () => {
  it('should generate valid multiplication table problem', () => {
    const result = generateProblem('gugudan');
    expect(result.expression).toMatch(/^[2-9] \\times [1-9]$/);
    expect(typeof result.answer).toBe('number');
  });

  it('should generate correct answer matching the expression numbers across multiple runs', () => {
    for (let i = 0; i < 100; i++) {
      const result = generateProblem('gugudan');
      const match = result.expression.match(/^([2-9]) \\times ([1-9])$/);
      expect(match).not.toBeNull();
      if (match && match[1] && match[2]) {
        const a = parseInt(match[1], 10);
        const b = parseInt(match[2], 10);
        expect(result.answer).toBe(a * b);
      }
    }
  });

  it('should return default problem for unknown category', () => {
    const result = generateProblem('unknown');
    expect(result.expression).toBe('0 \\times 0');
    expect(result.answer).toBe(0);
  });
});
