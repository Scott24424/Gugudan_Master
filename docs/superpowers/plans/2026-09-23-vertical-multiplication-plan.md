# Implementation Plan: Vertical Column Multiplication (세로셈)

## Goal
Implement the interactive vertical column multiplication system (세로셈) for `2x1`, `3x1`, and `2x2` categories following Korean elementary math pedagogy with dynamic carry handling, natural step-by-step input order, auto-advancing focus, and error tracking.

---

## Tasks

### Task 1: Vertical Math Engine (`verticalMathEngine.ts` & Unit Tests)
- **Files**:
  - `src/utils/verticalMathEngine.ts`
  - `tests/utils/verticalMathEngine.test.ts`
- **Details**:
  - Implement `generateVerticalProblem(category: string, fixedOperands?: { top: number, bottom: number })`.
  - Calculate exact `VerticalStep[]` list:
    - If ones-place product $\ge 10$: insert carry step, then ones-result step.
    - If ones-place product $< 10$: insert ones-result step directly.
    - Highest-place product: enter left-to-right (thousands $\rightarrow$ hundreds $\rightarrow$ tens).
    - Multi-row for `2x2`: row 1 partial product $\rightarrow$ row 2 partial product $\rightarrow$ row 3 vertical addition with carry.
  - Write comprehensive tests in `tests/utils/verticalMathEngine.test.ts` covering `2x1`, `3x1`, and `2x2` step order and carry logic.
- **Verification**: `npm test tests/utils/verticalMathEngine.test.ts` passes.

---

### Task 2: Vertical Quiz Screen Component (`VerticalQuizScreen.tsx`)
- **Files**:
  - `src/components/VerticalQuizScreen.tsx`
- **Details**:
  - Render top progress bar, level badge, and 10-question pills matching `QuizScreen`.
  - Render 4-column aligned math grid (Thousands, Hundreds, Tens, Ones).
  - Manage step state: `currentStepIndex`, `valuesByStepId`, `errorStepId`, `hasError`.
  - Auto-focus the active step box.
  - On single digit press:
    - Validate immediately against `currentStep.expectedValue`.
    - If correct: flash green, advance `currentStepIndex + 1`.
    - If wrong: trigger red shake animation, clear value, set `hasError = true`, stay on step.
  - When all steps completed:
    - Trigger celebration feedback.
    - Record question to session history (`expression`, `userAns`, `realAns`, `isCorrect: !hasError`).
    - After 10 questions: save session to Supabase, update profile, transition to `ResultScreen`.
- **Verification**: Type-check and component structure verification.

---

### Task 3: Integration in Main Page (`src/app/page.tsx`)
- **Files**:
  - `src/app/page.tsx`
- **Details**:
  - Conditional rendering:
    - If `category === 'gugudan'` $\rightarrow$ render `<QuizScreen />`
    - If `category !== 'gugudan'` $\rightarrow$ render `<VerticalQuizScreen category={category} onBack={() => setCategory(null)} />`
- **Verification**: Visual and behavioral check.

---

### Task 4: Complete Verification & Testing
- **Details**:
  - Run all unit tests (`npm test`).
  - Run TypeScript compile check (`npx tsc --noEmit`).
  - Run Next.js production build (`npm run build`).
  - E2E Playwright test: play through vertical problems in `2x1` and verify step inputs and carry behaviors.

---

### Task 5: Git Commit & Documentation
- Commit all code and documentation cleanly with clear messages.
