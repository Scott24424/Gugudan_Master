# Multiplication App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초등학생 3학년을 위한 캐릭터 성장형 구구단/곱셈 학습 웹 앱 구축

**Architecture:** Next.js (App Router) 클라이언트 사이드 렌더링 + Supabase Auth/DB 연동

**Tech Stack:** Next.js, React, TailwindCSS, Supabase, Jest(Testing)

**Spec:** docs/superpowers/specs/2026-09-21-multiplication-app-design.md

## Global Constraints
- Node.js 18+ 지원
- Next.js 14 App Router 사용
- CSS는 TailwindCSS만 사용
- 모든 코드는 TypeScript strict 모드 적용

---

### Task 1: 수학 문제 출제 로직 구현 (Problem Generator)

**Files:**
- Create: `src/utils/mathGenerator.ts`
- Test: `tests/utils/mathGenerator.test.ts`

**Interfaces:**
- Produces: `generateProblem(category: string): { expression: string, answer: number }`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/utils/mathGenerator.test.ts
import { generateProblem } from '../../src/utils/mathGenerator';

describe('Math Generator', () => {
  it('should generate valid multiplication table problem', () => {
    const result = generateProblem('gugudan');
    expect(result.expression).toMatch(/^[2-9] \\times [1-9]$/);
    expect(typeof result.answer).toBe('number');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/utils/mathGenerator.test.ts`
Expected: FAIL with "generateProblem is not defined"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/utils/mathGenerator.ts
export function generateProblem(category: string) {
  if (category === 'gugudan') {
    const a = Math.floor(Math.random() * 8) + 2; // 2~9
    const b = Math.floor(Math.random() * 9) + 1; // 1~9
    return { expression: `${a} \\times ${b}`, answer: a * b };
  }
  return { expression: '0 \\times 0', answer: 0 };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/utils/mathGenerator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/utils/mathGenerator.test.ts src/utils/mathGenerator.ts
git commit -m "feat: implement gugudan math generator"
```

### Task 2: 캐릭터 성장(경험치) 계산 로직 구현

**Files:**
- Create: `src/utils/gamification.ts`
- Test: `tests/utils/gamification.test.ts`

**Interfaces:**
- Produces: `calculateEarnedExp(category: string): number`
- Produces: `getCharacterStage(level: number): string`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/utils/gamification.test.ts
import { calculateEarnedExp, getCharacterStage } from '../../src/utils/gamification';

describe('Gamification Logic', () => {
  it('calculates correct exp for gugudan', () => {
    expect(calculateEarnedExp('gugudan')).toBe(10);
  });
  it('returns correct character stage for level 5', () => {
    expect(getCharacterStage(5)).toBe('baby_monster');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test tests/utils/gamification.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/utils/gamification.ts
export function calculateEarnedExp(category: string): number {
  switch (category) {
    case 'gugudan': return 10;
    case '2x1': return 20;
    case '3x1': return 30;
    case '2x2': return 40;
    default: return 0;
  }
}

export function getCharacterStage(level: number): string {
  if (level >= 20) return 'dragon';
  if (level >= 10) return 'cool_monster';
  if (level >= 5) return 'baby_monster';
  return 'egg';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test tests/utils/gamification.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/utils/gamification.test.ts src/utils/gamification.ts
git commit -m "feat: add gamification exp and level logic"
```

### Task 3: Supabase DB 클라이언트 설정

**Files:**
- Create: `src/lib/supabaseClient.ts`

**Interfaces:**
- Consumes: Environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Produces: `supabase` instance

- [ ] **Step 1: Install Dependencies**
Run: `npm install @supabase/supabase-js`

- [ ] **Step 2: Write implementation**

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabaseClient.ts package.json
git commit -m "chore: setup supabase client"
```
