export interface Problem {
  expression: string;
  answer: number;
}

export type GugudanMode = 'standard' | 'missing' | 'mixed';

export interface GugudanOptions {
  /** 선택된 단 목록 (2~9). 비어 있거나 생략 시 2~9단 전체에서 출제 */
  selectedDans?: number[];
  /** 문제 유형: 기본 곱셈(A × B), 빈칸 채우기(A × □ = C), 혼합 */
  mode?: GugudanMode;
}

export interface ExtendedProblem extends Problem {
  a: number;
  b: number;
  product: number;
  questionType: 'standard' | 'missing_right' | 'missing_left';
  fullEquation: string;
}

const ALL_DANS = [2, 3, 4, 5, 6, 7, 8, 9];

/**
 * 구구단 맞춤 옵션(단 선택, 빈칸 채우기 역연산 모드 등)을 지원하는 문제 생성기.
 * 왜 필요한가: 단순 암산을 넘어 특정 취약 단 집중 학습과 역연산(나눗셈 기초) 사고력을 기르기 위함.
 */
export function generateGugudanProblem(options?: GugudanOptions): ExtendedProblem {
  const validDans = (options?.selectedDans ?? []).filter(
    (d) => Number.isInteger(d) && d >= 2 && d <= 9
  );
  const danPool = validDans.length > 0 ? validDans : ALL_DANS;

  const a = danPool[Math.floor(Math.random() * danPool.length)];
  const b = Math.floor(Math.random() * 9) + 1; // 1~9
  const product = a * b;
  const mode = options?.mode ?? 'standard';

  let questionType: 'standard' | 'missing_right' | 'missing_left' = 'standard';
  if (mode === 'missing') {
    questionType = 'missing_right';
  } else if (mode === 'mixed') {
    questionType = Math.random() < 0.5 ? 'standard' : 'missing_right';
  }

  if (questionType === 'missing_right') {
    return {
      expression: `${a} \\times □ = ${product}`,
      answer: b,
      a,
      b,
      product,
      questionType,
      fullEquation: `${a} × [${b}] = ${product}`,
    };
  }

  return {
    expression: `${a} \\times ${b}`,
    answer: product,
    a,
    b,
    product,
    questionType: 'standard',
    fullEquation: `${a} × ${b} = ${product}`,
  };
}

export function generateProblem(category: string): Problem {
  if (category === 'gugudan') {
    const { expression, answer } = generateGugudanProblem({ mode: 'standard' });
    return { expression, answer };
  }

  if (category === '2x1') {
    const a = Math.floor(Math.random() * 90) + 10; // 10~99
    const b = Math.floor(Math.random() * 8) + 2; // 2~9
    return { expression: `${a} \\times ${b}`, answer: a * b };
  }

  if (category === '3x1') {
    const a = Math.floor(Math.random() * 900) + 100; // 100~999
    const b = Math.floor(Math.random() * 8) + 2; // 2~9
    return { expression: `${a} \\times ${b}`, answer: a * b };
  }

  if (category === '2x2') {
    const a = Math.floor(Math.random() * 90) + 10; // 10~99
    const b = Math.floor(Math.random() * 90) + 10; // 10~99
    return { expression: `${a} \\times ${b}`, answer: a * b };
  }

  return { expression: '0 \\times 0', answer: 0 };
}
