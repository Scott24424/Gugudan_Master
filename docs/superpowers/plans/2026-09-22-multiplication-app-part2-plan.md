# Multiplication App Part 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Auth, 10-question sessions with Result screen, History dashboard, and Supabase integration.

**Architecture:** Client-side Supabase Auth with React Context. 10-question state management in QuizScreen branching into a ResultScreen. Supabase data fetching for History.

**Tech Stack:** Next.js 14, React, TailwindCSS, Framer Motion, @supabase/supabase-js.

**Spec:** docs/superpowers/specs/2026-09-22-multiplication-app-part2-spec.md

## Global Constraints
- Node.js 18+ 지원
- Next.js 14 App Router 사용
- CSS는 TailwindCSS만 사용
- 모든 코드는 TypeScript strict 모드 적용
- `ui-ux-pro-max-skill` 수준의 유려한 디자인 유지

---

### Task 1: Auth Screen & Supabase Context
**Spec Coverage:** 2.3. 로그인/회원가입 화면, 2.4. Auth Provider

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/app/login/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: AuthContext Implementation**
Create `AuthContext.tsx` providing `{ session, user, loading }`. Use `supabase.auth.getSession()` and `onAuthStateChange`.

- [ ] **Step 2: Login Page UI**
Create `src/app/login/page.tsx` with Email/Password inputs, and two buttons for "로그인" (signInWithPassword) and "회원가입" (signUp). Include error message UI.

- [ ] **Step 3: Layout Integration**
Modify `src/app/layout.tsx` (must become a Client component or have a separate Client wrapper) to wrap `{children}` in `<AuthProvider>`.

- [ ] **Step 4: Route Protection**
Modify `src/app/page.tsx` to redirect to `/login` if `!loading && !user`. Use `useRouter().push('/login')`.

- [ ] **Step 5: Commit**
`git add ... && git commit -m "feat: implement auth screen and context"`

---

### Task 2: 10-Question Session & Result Screen UI
**Spec Coverage:** 2.1. 결과 화면 (Result Screen)

**Files:**
- Create: `src/components/ResultScreen.tsx`
- Modify: `src/components/QuizScreen.tsx`

- [ ] **Step 1: State Modification in QuizScreen**
Modify `QuizScreen` to track `questionCount` (1 to 10) and `history` (array of `{ expression, userAns, realAns, isCorrect }`).
When `questionCount` reaches 10 and the user answers, do not generate the 11th problem. Instead, set `isFinished = true`.

- [ ] **Step 2: ResultScreen Component**
Create `ResultScreen` that takes `history`, `totalExp`, `onRetry`, `onHome` as props.
Render total score (`history.filter(h => h.isCorrect).length * 10`), total EXP.
Render a detailed list of the 10 questions with user answers vs real answers.
If score == 100, show Framer Motion fireworks.

- [ ] **Step 3: Render Result in QuizScreen**
In `QuizScreen`, if `isFinished`, render `<ResultScreen />` instead of the quiz form.

- [ ] **Step 4: Commit**
`git add ... && git commit -m "feat: implement 10-question session and result screen"`

---

### Task 3: DB Integration & Global Profile
**Spec Coverage:** 2.4. 클라우드 DB 및 상태 연동

**Files:**
- Create: `src/lib/api.ts`
- Modify: `src/context/AuthContext.tsx` (to include profile data)
- Modify: `src/components/QuizScreen.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: API Functions**
Create `api.ts` wrapping supabase calls:
- `upsertProfile(userId, exp, level)`
- `fetchProfile(userId)`
- `insertSession(userId, category, total, correct, exp)`

- [ ] **Step 2: Load Profile in Context**
Modify `AuthContext` to also fetch and provide `profile: { exp, level }` when a user logs in.

- [ ] **Step 3: Save Data on Quiz End**
In `QuizScreen.tsx`, inside `useEffect` that triggers when `isFinished` becomes true, call `insertSession` and `upsertProfile` with the updated EXP/Level. Use `user.id` from `AuthContext`.

- [ ] **Step 4: Header Sync**
Update `QuizScreen.tsx` and `page.tsx` to read `level` and `exp` from `AuthContext` rather than local state, so the Home dashboard and Quiz screen share the true DB values.

- [ ] **Step 5: Commit**
`git add ... && git commit -m "feat: integrate supabase db for profiles and sessions"`

---

### Task 4: History Screen
**Spec Coverage:** 2.2. 기록 화면 (History Screen)

**Files:**
- Create: `src/app/history/page.tsx`
- Modify: `src/app/page.tsx` (Link connection)

- [ ] **Step 1: History Page Component**
Create `history/page.tsx`. Use `useEffect` to fetch rows from `learning_sessions` ordered by `created_at` descending.

- [ ] **Step 2: History UI**
Render a neat list with TailwindCSS showing the Category, Score, EXP, and Date for each session. Include a `<Link href="/">← 메인으로 돌아가기</Link>` at the top.

- [ ] **Step 3: Link in Home**
Modify `page.tsx` to wrap the "🏆 내 성취도 보러가기" button with `<Link href="/history">`.

- [ ] **Step 4: Commit**
`git add ... && git commit -m "feat: implement history screen"`
