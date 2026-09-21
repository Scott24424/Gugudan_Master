export interface Problem {
  expression: string;
  answer: number;
}

export function generateProblem(category: string): Problem {
  if (category === 'gugudan') {
    const a = Math.floor(Math.random() * 8) + 2; // 2~9
    const b = Math.floor(Math.random() * 9) + 1; // 1~9
    return { expression: `${a} \\times ${b}`, answer: a * b };
  }
  return { expression: '0 \\times 0', answer: 0 };
}
