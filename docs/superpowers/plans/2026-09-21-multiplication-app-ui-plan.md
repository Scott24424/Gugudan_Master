# Multiplication App UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React frontend with Next.js, Tailwind CSS, and Framer Motion, featuring a gamified, beautiful UI tailored for 3rd graders.

**Architecture:** Next.js App Router manual setup. A main `QuizScreen` client component will manage state (current problem, exp, level) using the pure functions built in previous tasks. It will feature a numeric input form, level progress bar, and animated feedback.

**Tech Stack:** Next.js 14, React, TailwindCSS, Framer Motion, lucide-react, Playwright.

**Spec:** docs/superpowers/specs/2026-09-21-multiplication-app-design.md

## Global Constraints
- Node.js 18+ 지원
- Next.js 14 App Router 사용
- CSS는 TailwindCSS만 사용
- 모든 코드는 TypeScript strict 모드 적용
- `ui-ux-pro-max-skill` 수준의 유려하고 귀여운 디자인 (초등학생 타겟)

---

### Task 1: Frontend Infrastructure & Tailwind Setup

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `tailwind.config.ts`, `postcss.config.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: Node.js environment
- Produces: Base Next.js app structure

- [ ] **Step 1: Install Dependencies**
Run: `npm install next react react-dom framer-motion lucide-react`
Run: `npm install -D tailwindcss postcss autoprefixer`

- [ ] **Step 2: Add Next.js Scripts**
Modify `package.json` to add the following to `"scripts"`:
`"dev": "next dev", "build": "next build", "start": "next start"`

- [ ] **Step 3: Setup Tailwind**
Create `postcss.config.js`:
```javascript
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```
Create `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
}
export default config
```

- [ ] **Step 4: App Router Setup**
Create `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `src/app/layout.tsx`:
```typescript
import './globals.css'
export const metadata = { title: 'Math App', description: 'Fun math for kids' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-sky-50 text-slate-800 font-sans antialiased">{children}</body>
    </html>
  )
}
```

Create `src/app/page.tsx`:
```typescript
export default function Home() {
  return <main className="p-8 text-center text-2xl font-bold text-sky-600">Ready</main>
}
```

- [ ] **Step 5: Commit**
```bash
git add package.json src/app tailwind.config.ts postcss.config.js package-lock.json
git commit -m "chore: setup next.js and tailwind infrastructure"
```

---

### Task 2: Gamified Quiz Component (UI/UX)

**Files:**
- Create: `src/components/QuizScreen.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `generateProblem`, `calculateEarnedExp`, `getCharacterStage`
- Produces: `<QuizScreen />` React component

- [ ] **Step 1: Write Implementation**

Create `src/components/QuizScreen.tsx` (Client Component):
```typescript
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateProblem } from '../utils/mathGenerator';
import { calculateEarnedExp, getCharacterStage } from '../utils/gamification';

export default function QuizScreen() {
  const [problem, setProblem] = useState({ expression: '', answer: 0 });
  const [input, setInput] = useState('');
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState<'idle'|'correct'|'wrong'>('idle');

  useEffect(() => {
    setProblem(generateProblem('gugudan'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(input) === problem.answer) {
      setFeedback('correct');
      const earned = calculateEarnedExp('gugudan');
      const newExp = exp + earned;
      setExp(newExp);
      if (newExp >= level * 100) {
        setLevel(prev => prev + 1);
        setExp(0);
      }
      setTimeout(() => {
        setProblem(generateProblem('gugudan'));
        setInput('');
        setFeedback('idle');
      }, 1000);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback('idle'), 800);
    }
  };

  const stage = getCharacterStage(level);
  const stageEmojis: Record<string, string> = {
    egg: '🥚', baby_monster: '🐣', cool_monster: '🦕', dragon: '🐉'
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl border-4 border-sky-200">
      <div className="flex justify-between items-center mb-8">
        <div className="text-xl font-bold text-slate-600">Level {level}</div>
        <div className="text-4xl">{stageEmojis[stage]}</div>
        <div className="text-lg font-semibold text-orange-500">EXP {exp} / {level * 100}</div>
      </div>
      
      <div className="h-4 w-full bg-slate-100 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${(exp / (level * 100)) * 100}%` }}
        />
      </div>

      <motion.div 
        animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="text-6xl font-black text-center text-slate-700 mb-10 tracking-widest"
      >
        {problem.expression.replace('\\times', '×')}
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          type="number" 
          value={input}
          onChange={e => setInput(e.target.value)}
          className={`text-center text-4xl p-4 rounded-2xl border-4 outline-none transition-colors ${
            feedback === 'correct' ? 'border-green-400 bg-green-50' : 
            feedback === 'wrong' ? 'border-red-400 bg-red-50' : 
            'border-sky-300 focus:border-sky-500'
          }`}
          placeholder="정답"
          autoFocus
        />
        <button 
          type="submit"
          className="bg-sky-500 text-white text-2xl font-bold py-4 rounded-2xl shadow-[0_8px_0_0_#0284c7] hover:translate-y-1 hover:shadow-[0_4px_0_0_#0284c7] transition-all"
        >
          확인
        </button>
      </form>

      {feedback === 'correct' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <span className="text-8xl">✨🎉✨</span>
        </motion.div>
      )}
    </div>
  );
}
```

Modify `src/app/page.tsx`:
```typescript
import QuizScreen from '../components/QuizScreen';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
      <h1 className="text-4xl font-black text-center text-indigo-900 mb-2 drop-shadow-sm">신나는 구구단 마스터</h1>
      <p className="text-center text-slate-500 mb-8 font-medium">문제를 맞히고 몬스터를 키워보자!</p>
      <QuizScreen />
    </main>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/QuizScreen.tsx src/app/page.tsx
git commit -m "feat: build beautiful gamified quiz UI"
```

---

### Task 3: Playwright E2E Setup & Basic Test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/quiz.spec.ts`

**Interfaces:**
- Consumes: Next.js dev server

- [ ] **Step 1: Install Playwright**
Run: `npm install -D @playwright/test`
Run: `npx playwright install chromium`

- [ ] **Step 2: Config & Test**

Create `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

Create `tests/e2e/quiz.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

test('has title and level indicator', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('신나는 구구단 마스터');
  await expect(page.locator('text=Level 1')).toBeVisible();
});
```

- [ ] **Step 3: Commit**
```bash
git add playwright.config.ts tests/e2e/quiz.spec.ts package.json package-lock.json
git commit -m "test: setup playwright and add basic e2e test"
```
