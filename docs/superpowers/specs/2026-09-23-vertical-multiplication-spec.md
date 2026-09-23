# Specification: Vertical Column Multiplication (세로셈) System

## 1. Overview & Pedagogical Purpose
In Korean elementary school mathematics (초등 3~4학년 곱셈 교육과정), multi-digit multiplication must not be answered by rote memorization or single-box guessing. Students must learn and execute the step-by-step column multiplication procedure (세로셈):
- Identifying carry numbers (올림수) above place values.
- Calculating partial products (부분 곱) for each multiplier digit.
- Aligning place values (자릿수 정렬: 일의 자리, 십의 자리, 백의 자리, 천의 자리).
- Summing partial products for multi-digit multipliers (`2x2`).

This specification defines the interactive vertical multiplication engine, UI layout, step sequence generator, and gamified quiz flow for:
1. `2x1` (두자리 × 한자리, e.g. $47 \times 6$)
2. `3x1` (세자리 × 한자리, e.g. $328 \times 4$)
3. `2x2` (두자리 × 두자리, e.g. $34 \times 28$)

Basic `gugudan` (구구단, 2~9단) will retain the existing horizontal flash quiz format for mental speed drills.

---

## 2. Interactive Flow & Input Sequence Rules

### A. Carry Number (올림수) Rule
1. **Dynamic Carry Activation**:
   - A carry input box is activated **only when an actual carry occurs** ($\ge 10$).
   - If the digit product is $< 10$ (e.g. $2 \times 3 = 6$ or $0 \times 3 = 0$), no carry box is prompted; the cursor advances directly to the result box.
2. **Standard Sequence**:
   - `[올림수 입력] ➔ [해당 자리의 일의 자리 결과값 입력] ➔ [다음 올림수] ➔ [다음 자리 결과값]`

### B. Final Double-Digit Result Rule (최종 두 자리 입력 순서)
When computing the highest place value and there are no further digits to multiply, if the resulting value is a 2-digit number (e.g., $800 \times 3 \rightarrow 8 \times 3 = 24$, or $47 \times 6 \rightarrow 4 \times 6 + 4 = 28$):
- The digits are entered **naturally from left to right (높은 자리 ➔ 낮은 자리)**:
  - Example $800 \times 3$: `일의 자리 0` ➔ `십의 자리 0` ➔ `천의 자리 2` ➔ `백의 자리 4`.
  - Example $47 \times 6$: `올림수 4` ➔ `일의 자리 2` ➔ `백의 자리 2` ➔ `십의 자리 8`.

### C. Multi-Row Multiplication (`2x2` 두자리 × 두자리)
For $34 \times 28$:
- **Row 1**: Multiplier ones digit ($34 \times 8 = 272$)
  - $4 \times 8 = 32 \rightarrow$ carry `3`, ones `2`
  - $3 \times 8 + 3 = 27 \rightarrow$ hundreds `2`, tens `7`
- **Row 2**: Multiplier tens digit ($34 \times 2 = 68$)
  - $4 \times 2 = 8 \rightarrow$ no carry, tens `8`
  - $3 \times 2 = 6 \rightarrow$ no carry, hundreds `6`
- **Row 3**: Vertical Addition ($272 + 680 = 952$)
  - Ones: $2 \rightarrow 2$
  - Tens: $7 + 8 = 15 \rightarrow$ addition carry `1`, tens `5`
  - Hundreds: $1 + 2 + 6 = 9 \rightarrow 9$

---

## 3. UI/UX Interaction Design (`VerticalQuizScreen.tsx`)

### Grid Structure
- A clean, 4-column aligned math workbook grid:
  - Column 0: 천의 자리 (Thousands)
  - Column 1: 백의 자리 (Hundreds)
  - Column 2: 십의 자리 (Tens)
  - Column 3: 일의 자리 (Ones)
- Operands display:
  - Top row: 작은 올림수 칸 (오렌지색 테두리)
  - Middle rows: 피승수 & 승수 + 곱셈 기호 ($\times$)
  - Divider: 굵은 실선 구분선
  - Result row(s): 사각형 숫자 입력 박스

### Immediate Feedback & Auto-Progression
- **Single-Digit Input**:
  - The currently active step box has a pulsing blue highlight and autofocus.
  - As soon as a single digit (`0`~`9`) is pressed:
    - **Correct**: Instant green highlight flash, box locks with green text, cursor auto-moves to the next step box in 50ms.
    - **Incorrect**: Box shakes with red border (`framer-motion`), content is cleared, and remains focused for retry.
    - **Error Scoring**: If any incorrect digit is submitted for a problem, `hasError` is marked `true`, resulting in an incorrect mark (❌) on the 10-problem session score and history, while still allowing the child to finish solving the problem.
- **Completion**:
  - When the final step is completed, celebration confetti/emoji triggers.
  - EXP is credited according to category (+20 for 2x1, +30 for 3x1, +40 for 2x2).
  - Automatically advances to the next question or ResultScreen.

---

## 4. Architecture & Data Structures

### `src/utils/verticalMathEngine.ts`
```ts
export type PlaceColumn = 'thousands' | 'hundreds' | 'tens' | 'ones';

export interface VerticalStep {
  id: string;
  targetType: 'carry' | 'partial' | 'sum';
  row: number; // 0: carry, 1: row1 partial, 2: row2 partial, 3: final sum
  column: PlaceColumn;
  expectedValue: number; // 0-9
  hint?: string;
}

export interface VerticalProblemPlan {
  topNumber: number;
  bottomNumber: number;
  category: string;
  finalAnswer: number;
  steps: VerticalStep[];
}
```

### Component Hierarchy
```
src/app/page.tsx
  ├─ [gugudan] ➔ QuizScreen (Horizontal)
  └─ [2x1, 3x1, 2x2] ➔ VerticalQuizScreen (Vertical Column Math)
        ├─ Header (Level, EXP Bar, 10-question pills)
        ├─ VerticalGrid (Operands, Carry Row, Inputs, Borders)
        └─ [On Finished] ➔ ResultScreen
```

---

## 5. Verification & Test Plan
1. **Unit Tests (`tests/utils/verticalMathEngine.test.ts`)**:
   - `2x1` problem generation: validates step order, carry presence, left-to-right final digits.
   - `3x1` problem generation: validates all 3 columns carry & steps.
   - `2x2` problem generation: validates row 1, row 2, and addition row 3.
   - 100 randomized test runs ensuring valid values and complete correctness.
2. **Integration & Build**:
   - TypeScript compilation (`npx tsc --noEmit`).
   - Jest test suite (`npm test`).
   - Production build (`npm run build`).
3. **E2E Browser Verification**:
   - Playwright verification of step progression, carry focus, and score recording.
