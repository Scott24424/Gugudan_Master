import { generateVerticalProblem } from '../../src/utils/verticalMathEngine';

describe('verticalMathEngine', () => {
  describe('Specific Pedagogical Test Cases', () => {
    test('800 x 3 produces exact sequence [0, 0, 2, 4] with left-to-right final digits', () => {
      const plan = generateVerticalProblem('3x1', { top: 800, bottom: 3 });
      expect(plan.answer).toBe(2400);

      const stepValues = plan.steps.map((s) => s.expectedValue);
      // ones: 0, tens: 0, thousands: 2, hundreds: 4
      expect(stepValues).toEqual([0, 0, 2, 4]);
      expect(plan.steps[0].column).toBe('ones');
      expect(plan.steps[1].column).toBe('tens');
      expect(plan.steps[2].column).toBe('thousands');
      expect(plan.steps[3].column).toBe('hundreds');
    });

    test('47 x 6 produces carry 4, ones 2, then left-to-right hundreds 2, tens 8', () => {
      const plan = generateVerticalProblem('2x1', { top: 47, bottom: 6 });
      expect(plan.answer).toBe(282);

      const stepValues = plan.steps.map((s) => s.expectedValue);
      // carry: 4, ones: 2, hundreds: 2, tens: 8
      expect(stepValues).toEqual([4, 2, 2, 8]);
      expect(plan.steps[0].targetType).toBe('carry');
      expect(plan.steps[0].expectedValue).toBe(4);
      expect(plan.steps[1].expectedValue).toBe(2);
      expect(plan.steps[2].expectedValue).toBe(2);
      expect(plan.steps[3].expectedValue).toBe(8);
    });

    test('34 x 28 produces accurate row 1, row 2, and row 3 sum steps', () => {
      const plan = generateVerticalProblem('2x2', { top: 34, bottom: 28 });
      expect(plan.answer).toBe(952);

      // Row 1: 34 * 8 = 272 (carry 3, ones 2, hundreds 2, tens 7)
      // Row 2: 34 * 2 = 68 (tens 8, hundreds 6)
      // Row 3: 272 + 680 = 952 (sum ones 2, add carry 1, sum tens 5, sum hundreds 9)
      const stepValues = plan.steps.map((s) => s.expectedValue);
      expect(stepValues).toEqual([3, 2, 2, 7, 8, 6, 2, 1, 5, 9]);
    });

    test('92 x 27 produces exact addition sequence: 4+0=4, 4+4=8, 6+8=carry 1, 4, 1+carry 1=2', () => {
      const plan = generateVerticalProblem('2x2', { top: 92, bottom: 27 });
      expect(plan.answer).toBe(2484);

      // Row 1: 92 * 7 = 644 (carry 1, ones 4, hundreds 6, tens 4)
      // Row 2: 92 * 2 = 184 (tens 4, thousands 1, hundreds 8)
      // Row 3: 644 + 1840 = 2484:
      //   4 + 0 = 4 (sum_ones)
      //   4 + 4 = 8 (sum_tens)
      //   6 + 8 = 14 (add_carry_thousands 1, sum_hundreds 4)
      //   1 + 1 = 2 (sum_thousands 2)
      const stepValues = plan.steps.map((s) => s.expectedValue);
      expect(stepValues).toEqual([1, 4, 6, 4, 4, 1, 8, 4, 8, 1, 4, 2]);

      const sumSteps = plan.steps.filter((s) => s.row === 3 || s.id.startsWith('add_carry_'));
      expect(sumSteps.map((s) => ({ id: s.id, val: s.expectedValue }))).toEqual([
        { id: 'sum_ones', val: 4 },
        { id: 'sum_tens', val: 8 },
        { id: 'add_carry_thousands', val: 1 },
        { id: 'sum_hundreds', val: 4 },
        { id: 'sum_thousands', val: 2 },
      ]);
    });
  });

  describe('Randomized Generative Tests (50 iterations each)', () => {
    test('2x1 problems produce valid single-digit steps matching mathematical result', () => {
      for (let i = 0; i < 50; i++) {
        const plan = generateVerticalProblem('2x1');
        expect(plan.topNumber).toBeGreaterThanOrEqual(10);
        expect(plan.topNumber).toBeLessThanOrEqual(99);
        expect(plan.bottomNumber).toBeGreaterThanOrEqual(2);
        expect(plan.bottomNumber).toBeLessThanOrEqual(9);
        expect(plan.answer).toBe(plan.topNumber * plan.bottomNumber);

        // Every step value must be a single digit 0-9
        for (const step of plan.steps) {
          expect(step.expectedValue).toBeGreaterThanOrEqual(0);
          expect(step.expectedValue).toBeLessThanOrEqual(9);
        }

        // Check reconstructed partial product
        const onesStep = plan.steps.find((s) => s.id === 'res_ones_r1');
        const tensStep = plan.steps.find((s) => s.id === 'res_tens_r1');
        const hundredsStep = plan.steps.find((s) => s.id === 'res_hundreds_r1');

        const ones = onesStep?.expectedValue ?? 0;
        const tens = tensStep?.expectedValue ?? 0;
        const hundreds = hundredsStep?.expectedValue ?? 0;

        const reconstructed = hundreds * 100 + tens * 10 + ones;
        expect(reconstructed).toBe(plan.answer);
      }
    });

    test('3x1 problems produce valid single-digit steps matching mathematical result', () => {
      for (let i = 0; i < 50; i++) {
        const plan = generateVerticalProblem('3x1');
        expect(plan.topNumber).toBeGreaterThanOrEqual(100);
        expect(plan.topNumber).toBeLessThanOrEqual(999);
        expect(plan.bottomNumber).toBeGreaterThanOrEqual(2);
        expect(plan.bottomNumber).toBeLessThanOrEqual(9);
        expect(plan.answer).toBe(plan.topNumber * plan.bottomNumber);

        for (const step of plan.steps) {
          expect(step.expectedValue).toBeGreaterThanOrEqual(0);
          expect(step.expectedValue).toBeLessThanOrEqual(9);
        }

        const ones = plan.steps.find((s) => s.id === 'res_ones_r1')?.expectedValue ?? 0;
        const tens = plan.steps.find((s) => s.id === 'res_tens_r1')?.expectedValue ?? 0;
        const hundreds = plan.steps.find((s) => s.id === 'res_hundreds_r1')?.expectedValue ?? 0;
        const thousands = plan.steps.find((s) => s.id === 'res_thousands_r1')?.expectedValue ?? 0;

        const reconstructed = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
        expect(reconstructed).toBe(plan.answer);
      }
    });

    test('2x2 problems produce valid single-digit steps matching mathematical result', () => {
      for (let i = 0; i < 50; i++) {
        const plan = generateVerticalProblem('2x2');
        expect(plan.topNumber).toBeGreaterThanOrEqual(10);
        expect(plan.topNumber).toBeLessThanOrEqual(99);
        expect(plan.bottomNumber).toBeGreaterThanOrEqual(10);
        expect(plan.bottomNumber).toBeLessThanOrEqual(99);
        expect(plan.answer).toBe(plan.topNumber * plan.bottomNumber);

        for (const step of plan.steps) {
          expect(step.expectedValue).toBeGreaterThanOrEqual(0);
          expect(step.expectedValue).toBeLessThanOrEqual(9);
        }

        const sumOnes = plan.steps.find((s) => s.id === 'sum_ones')?.expectedValue ?? 0;
        const sumTens = plan.steps.find((s) => s.id === 'sum_tens')?.expectedValue ?? 0;
        const sumHundreds = plan.steps.find((s) => s.id === 'sum_hundreds')?.expectedValue ?? 0;
        const sumThousands = plan.steps.find((s) => s.id === 'sum_thousands')?.expectedValue ?? 0;

        const reconstructed = sumThousands * 1000 + sumHundreds * 100 + sumTens * 10 + sumOnes;
        expect(reconstructed).toBe(plan.answer);
      }
    });
  });
});
