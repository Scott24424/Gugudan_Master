export type PlaceColumn = 'thousands' | 'hundreds' | 'tens' | 'ones';

export interface VerticalStep {
  id: string;
  targetType: 'carry' | 'partial' | 'sum';
  row: number; // 0: carry, 1: row1 partial, 2: row2 partial, 3: final sum
  column: PlaceColumn;
  expectedValue: number; // 0-9
  label?: string;
}

export interface VerticalProblemPlan {
  category: '2x1' | '3x1' | '2x2';
  topNumber: number;
  bottomNumber: number;
  expression: string;
  answer: number;
  steps: VerticalStep[];
}

/**
 * Generates an interactive step-by-step vertical multiplication plan.
 */
export function generateVerticalProblem(
  category: string,
  fixedOperands?: { top: number; bottom: number }
): VerticalProblemPlan {
  let topNumber = 0;
  let bottomNumber = 0;

  if (fixedOperands) {
    topNumber = fixedOperands.top;
    bottomNumber = fixedOperands.bottom;
  } else {
    if (category === '2x1') {
      topNumber = Math.floor(Math.random() * 90) + 10; // 10~99
      bottomNumber = Math.floor(Math.random() * 8) + 2; // 2~9
    } else if (category === '3x1') {
      topNumber = Math.floor(Math.random() * 900) + 100; // 100~999
      bottomNumber = Math.floor(Math.random() * 8) + 2; // 2~9
    } else if (category === '2x2') {
      topNumber = Math.floor(Math.random() * 90) + 10; // 10~99
      bottomNumber = Math.floor(Math.random() * 90) + 10; // 10~99
    } else {
      // Fallback
      topNumber = 12;
      bottomNumber = 3;
    }
  }

  const answer = topNumber * bottomNumber;
  const expression = `${topNumber} \\times ${bottomNumber}`;
  const steps: VerticalStep[] = [];

  if (category === '2x1') {
    const topOnes = topNumber % 10;
    const topTens = Math.floor(topNumber / 10);
    const bottom = bottomNumber;

    // 1. Ones digit multiplication
    const prod1 = topOnes * bottom;
    const carryTens = Math.floor(prod1 / 10);
    const onesVal = prod1 % 10;

    if (carryTens > 0) {
      steps.push({
        id: 'carry_tens_r1',
        targetType: 'carry',
        row: 0,
        column: 'tens',
        expectedValue: carryTens,
      });
    }
    steps.push({
      id: 'res_ones_r1',
      targetType: 'partial',
      row: 1,
      column: 'ones',
      expectedValue: onesVal,
    });

    // 2. Tens digit multiplication (final highest place)
    const prod2 = topTens * bottom + carryTens;
    if (prod2 >= 10) {
      const hundredsVal = Math.floor(prod2 / 10);
      const tensVal = prod2 % 10;
      // Entered left to right for 2-digit final result
      steps.push({
        id: 'res_hundreds_r1',
        targetType: 'partial',
        row: 1,
        column: 'hundreds',
        expectedValue: hundredsVal,
      });
      steps.push({
        id: 'res_tens_r1',
        targetType: 'partial',
        row: 1,
        column: 'tens',
        expectedValue: tensVal,
      });
    } else {
      steps.push({
        id: 'res_tens_r1',
        targetType: 'partial',
        row: 1,
        column: 'tens',
        expectedValue: prod2,
      });
    }
  } else if (category === '3x1') {
    const topOnes = topNumber % 10;
    const topTens = Math.floor((topNumber % 100) / 10);
    const topHundreds = Math.floor(topNumber / 100);
    const bottom = bottomNumber;

    // 1. Ones digit
    const prod1 = topOnes * bottom;
    const carryTens = Math.floor(prod1 / 10);
    const onesVal = prod1 % 10;

    if (carryTens > 0) {
      steps.push({
        id: 'carry_tens_r1',
        targetType: 'carry',
        row: 0,
        column: 'tens',
        expectedValue: carryTens,
      });
    }
    steps.push({
      id: 'res_ones_r1',
      targetType: 'partial',
      row: 1,
      column: 'ones',
      expectedValue: onesVal,
    });

    // 2. Tens digit
    const prod2 = topTens * bottom + carryTens;
    const carryHundreds = Math.floor(prod2 / 10);
    const tensVal = prod2 % 10;

    if (carryHundreds > 0) {
      steps.push({
        id: 'carry_hundreds_r1',
        targetType: 'carry',
        row: 0,
        column: 'hundreds',
        expectedValue: carryHundreds,
      });
    }
    steps.push({
      id: 'res_tens_r1',
      targetType: 'partial',
      row: 1,
      column: 'tens',
      expectedValue: tensVal,
    });

    // 3. Hundreds digit (final highest place)
    const prod3 = topHundreds * bottom + carryHundreds;
    if (prod3 >= 10) {
      const thousandsVal = Math.floor(prod3 / 10);
      const hundredsVal = prod3 % 10;
      // Entered left to right for 2-digit final result
      steps.push({
        id: 'res_thousands_r1',
        targetType: 'partial',
        row: 1,
        column: 'thousands',
        expectedValue: thousandsVal,
      });
      steps.push({
        id: 'res_hundreds_r1',
        targetType: 'partial',
        row: 1,
        column: 'hundreds',
        expectedValue: hundredsVal,
      });
    } else {
      steps.push({
        id: 'res_hundreds_r1',
        targetType: 'partial',
        row: 1,
        column: 'hundreds',
        expectedValue: prod3,
      });
    }
  } else {
    // 2x2
    const topOnes = topNumber % 10;
    const topTens = Math.floor(topNumber / 10);
    const bottomOnes = bottomNumber % 10;
    const bottomTens = Math.floor(bottomNumber / 10);

    // Row 1: Multiply top by bottomOnes
    const prod1 = topOnes * bottomOnes;
    const carry1_tens = Math.floor(prod1 / 10);
    const r1_ones = prod1 % 10;

    if (carry1_tens > 0) {
      steps.push({
        id: 'carry1_tens',
        targetType: 'carry',
        row: 0,
        column: 'tens',
        expectedValue: carry1_tens,
      });
    }
    steps.push({
      id: 'row1_ones',
      targetType: 'partial',
      row: 1,
      column: 'ones',
      expectedValue: r1_ones,
    });

    const prod2 = topTens * bottomOnes + carry1_tens;
    if (prod2 >= 10) {
      steps.push({
        id: 'row1_hundreds',
        targetType: 'partial',
        row: 1,
        column: 'hundreds',
        expectedValue: Math.floor(prod2 / 10),
      });
      steps.push({
        id: 'row1_tens',
        targetType: 'partial',
        row: 1,
        column: 'tens',
        expectedValue: prod2 % 10,
      });
    } else {
      steps.push({
        id: 'row1_tens',
        targetType: 'partial',
        row: 1,
        column: 'tens',
        expectedValue: prod2,
      });
    }

    // Row 2: Multiply top by bottomTens (shifted by tens)
    const prod3 = topOnes * bottomTens;
    const carry2_tens = Math.floor(prod3 / 10);
    const r2_tens = prod3 % 10;

    if (carry2_tens > 0) {
      steps.push({
        id: 'carry2_tens',
        targetType: 'carry',
        row: 0,
        column: 'hundreds',
        expectedValue: carry2_tens,
      });
    }
    steps.push({
      id: 'row2_tens',
      targetType: 'partial',
      row: 2,
      column: 'tens',
      expectedValue: r2_tens,
    });

    const prod4 = topTens * bottomTens + carry2_tens;
    if (prod4 >= 10) {
      steps.push({
        id: 'row2_thousands',
        targetType: 'partial',
        row: 2,
        column: 'thousands',
        expectedValue: Math.floor(prod4 / 10),
      });
      steps.push({
        id: 'row2_hundreds',
        targetType: 'partial',
        row: 2,
        column: 'hundreds',
        expectedValue: prod4 % 10,
      });
    } else {
      steps.push({
        id: 'row2_hundreds',
        targetType: 'partial',
        row: 2,
        column: 'hundreds',
        expectedValue: prod4,
      });
    }

    // Row 3: Vertical Addition of Row 1 + (Row 2 * 10) = answer
    const valRow1 = topNumber * bottomOnes;
    const valRow2 = topNumber * bottomTens * 10;
    const sum = valRow1 + valRow2;

    const add_r1_ones = valRow1 % 10;
    const add_r2_ones = 0;
    const add_r1_tens = Math.floor(valRow1 / 10) % 10;
    const add_r2_tens = Math.floor(valRow2 / 10) % 10;
    const add_r1_hundreds = Math.floor(valRow1 / 100) % 10;
    const add_r2_hundreds = Math.floor(valRow2 / 100) % 10;
    const add_r1_thousands = Math.floor(valRow1 / 1000) % 10;
    const add_r2_thousands = Math.floor(valRow2 / 1000) % 10;

    // 1. Ones column (e.g. 4 + 0 = 4)
    const onesSum = add_r1_ones + add_r2_ones;
    const addCarryTens = Math.floor(onesSum / 10);
    if (addCarryTens > 0) {
      steps.push({
        id: 'add_carry_tens',
        targetType: 'carry',
        row: 2.5,
        column: 'tens',
        expectedValue: addCarryTens,
      });
    }
    steps.push({
      id: 'sum_ones',
      targetType: 'sum',
      row: 3,
      column: 'ones',
      expectedValue: onesSum % 10,
    });

    // 2. Tens column (e.g. 4 + 4 = 8, or 7 + 8 = carry 1, 5)
    const tensSum = add_r1_tens + add_r2_tens + addCarryTens;
    const addCarryHundreds = Math.floor(tensSum / 10);
    if (addCarryHundreds > 0) {
      steps.push({
        id: 'add_carry_hundreds',
        targetType: 'carry',
        row: 2.5,
        column: 'hundreds',
        expectedValue: addCarryHundreds,
      });
    }
    steps.push({
      id: 'sum_tens',
      targetType: 'sum',
      row: 3,
      column: 'tens',
      expectedValue: tensSum % 10,
    });

    // 3. Hundreds column (e.g. 6 + 8 = carry 1, 4)
    const hundredsSum = add_r1_hundreds + add_r2_hundreds + addCarryHundreds;
    const addCarryThousands = Math.floor(hundredsSum / 10);
    if (addCarryThousands > 0) {
      steps.push({
        id: 'add_carry_thousands',
        targetType: 'carry',
        row: 2.5,
        column: 'thousands',
        expectedValue: addCarryThousands,
      });
    }
    steps.push({
      id: 'sum_hundreds',
      targetType: 'sum',
      row: 3,
      column: 'hundreds',
      expectedValue: hundredsSum % 10,
    });

    // 4. Thousands column (e.g. 1 + carry 1 = 2)
    const thousandsSum = add_r1_thousands + add_r2_thousands + addCarryThousands;
    if (sum >= 1000) {
      steps.push({
        id: 'sum_thousands',
        targetType: 'sum',
        row: 3,
        column: 'thousands',
        expectedValue: thousandsSum,
      });
    }
  }

  return {
    category: category as '2x1' | '3x1' | '2x2',
    topNumber,
    bottomNumber,
    expression,
    answer,
    steps,
  };
}
