# 신나는 구구단 마스터 v2.0 고도화 설계 명세서 (Spec & Implementation Plan)

> **작성일**: 2026-10-25  
> **대상 경로**: `C:\Users\ksb53\Project\Agy_Workspaces\Gugudan_Master`

---

## 1. 현황 진단 (Diagnosis)

### 1.1 발견된 코드 결함 및 불일치 (Bugs & Technical Debt)
1. **`VerticalQuizScreen.tsx`의 EXP 프로그레스 바 계산 결함**:
   - `gamification.ts`의 레벨업 요구 경험치는 `level * 100`이나, `VerticalQuizScreen.tsx` 상단 헤더는 `{exp} / 100` 및 `width: ${Math.min(100, exp)}%`로 하드코딩되어 있어 Level 2 이상에서 경험치 바와 최대치가 잘못 표시됨.
2. **EXP 보상 상수 중복 정의**:
   - `gamification.ts`의 `calculateEarnedExp(category)` 대신 `VerticalQuizScreen.tsx` 내부에 `EXP_REWARDS`가 중복 선언됨.
3. **`calculateScore`의 고정 10문제 가정**:
   - `resultHelper.ts` 및 `ResultScreen.tsx`가 `correctCount * 10`으로 점수를 계산하여, 오답 복습 모드(예: 틀린 3문제만 재도전) 실행 시 만점을 받아도 30점으로 표시되는 한계가 있음.
4. **구구단 가로셈(`QuizScreen.tsx`)의 UX 격차**:
   - `VerticalQuizScreen.tsx`와 달리 효과음(Web Audio API)과 온스크린 숫자 키패드가 없으며, 오답 시 정답 안내 없이 즉시 다음 문제로 넘어가 학습 피드백이 부족함.

### 1.2 교육적·기능적 고도화 기회 (Enhancement Opportunities)
1. **구구단 맞춤 단 선택 & 빈칸 채우기(역연산) & 구구단 표 학습 모달**:
   - 특정 단(2~9단 중 선택 또는 전체) 집중 연습과 `A × □ = C` 빈칸 채우기 문제 유형을 지원하고, 홈 화면에서 언제든 2~9단 원리를 확인할 수 있는 구구단 표 모달 추가.
2. **세로셈 단계별 친절 가이드(`hint`) 및 현재 계산 자리 하이라이트**:
   - `verticalMathEngine.ts`의 각 `VerticalStep`에 현재 어떤 자리 숫자끼리 곱하거나 더하는지 알려주는 `hint` 문자열과 활성 피승수/승수 컬럼(`activeTopColumn`, `activeBottomColumn`)을 포함해 초등학생이 세로셈 순서를 직관적으로 이해하도록 개선.
3. **오답 노트 즉시 복습 모드 (Mastery Review Mode)**:
   - `ResultScreen`에서 틀린 문제가 있을 때 `💪 틀린 문제만 다시 풀기`를 제공하여 구구단 및 세로셈 모두 틀렸던 문제만 즉시 재도전 가능하도록 구현.
4. **연속 정답 콤보(Streak) & 만점 보너스 EXP (+20%) & 레벨업 축하 배너**:
   - 연속 정답 시 `🔥 N연속 콤보` 표시, 10문제 만점 달성 시 기본 획득 EXP의 20% 보너스 지급, 레벨 상승 시 결과 화면에서 레벨업 배너 노출.
5. **성취도 페이지(`/history`) 통계 대시보드 & 취약 영역 분석**:
   - 전체 학습 요약(총 완료 횟수, 평균 점수, 만점 횟수, 누적 획득 EXP) 및 카테고리별 정답률 그래프와 맞춤 추천 배너, 카테고리 필터 탭 추가.
6. **공통 사운드 매니저(`soundEffects.ts`) 및 음소거 토글**:
   - 정오답·완료·레벨업 효과음을 공통 모듈로 통합하고 음소거(Mute) 토글 제공.

---

## 2. 모듈별 상세 변경 계획 (Implementation Plan)

1. **`src/utils/mathGenerator.ts` & `tests/utils/mathGenerator.test.ts`**:
   - 기존 `generateProblem(category)` 시그니처와 반환 형식(`{ expression, answer }`)을 100% 하위 호환 유지.
   - 선택적 옵션 `GugudanOptions` (`selectedDans?: number[]`, `mode?: 'standard' | 'missing' | 'mixed'`) 지원 및 빈칸 문제 생성(`generateGugudanProblem`) 함수 추가.
2. **`src/utils/verticalMathEngine.ts` & `tests/utils/verticalMathEngine.test.ts`**:
   - `VerticalStep`에 `hint?: string`, `activeTopColumn?: PlaceColumn`, `activeBottomColumn?: PlaceColumn` 필드 추가(기존 모든 필드 및 순서 100% 유지).
3. **`src/utils/gamification.ts` & `tests/utils/gamification.test.ts`**:
   - 만점 달성 시 보너스 경험치를 계산하는 `calculateSessionBonusExp(category, totalQuestions, correctCount)` 및 캐릭터 단계 한글 이름 헬퍼(`getCharacterStageName`, `getCharacterStageEmoji`) 추가.
4. **`src/utils/resultHelper.ts` & `tests/utils/resultHelper.test.ts`**:
   - `calculateScore(history)`가 10문제일 때는 기존과 동일하게 개당 10점(100점 만점)을 반환하고, 오답 복습 등 10문제가 아닐 때는 `Math.round((correctCount / history.length) * 100)`을 반환하도록 개선.
   - 학습 기록 배열(`LearningSession[]`)로부터 카테고리별 통계와 취약 카테고리를 분석하는 `analyzeLearningSessions` 순수 함수 추가.
5. **`src/utils/soundEffects.ts`**:
   - Web Audio API 기반 `playQuizSound('correct' | 'wrong' | 'complete' | 'levelup', muted)` 유틸리티 구현.
6. **UI 컴포넌트 고도화**:
   - `src/components/GugudanTableModal.tsx`: 2~9단 구구단 표 및 묶음/덧셈 원리 학습 모달.
   - `src/components/ResultScreen.tsx`: 오답 복습 버튼(`onReviewWrong`), 레벨업 축하 배너(`previousLevel`, `currentLevel`), 만점 보너스 EXP 표시.
   - `src/components/QuizScreen.tsx`: 단 선택(전체/2~9단), 문제 유형(기본/빈칸/혼합), 연속 콤보 배지, 오답 시 정답 안내, 온스크린 숫자 키패드(백스페이스/확인 포함), 사운드 토글, 오답 복습 모드 연동.
   - `src/components/VerticalQuizScreen.tsx`: EXP 프로그레스 바 버그(`level * 100`) 수정, 단계별 친절 가이드(`step.hint`) 및 현재 계산 중인 피승수/승수 숫자 하이라이트, 연속 콤보, 사운드 토글, 오답 복습 모드 연동.
   - `src/app/page.tsx`: 구구단 표 학습 모달 버튼 및 캐릭터 스테이지 이름 표시 추가.
   - `src/app/history/page.tsx`: 전체 성취도 요약 카드 4종, 카테고리별 정답률 바 차트 및 학습 코칭 메시지, 카테고리별 필터 탭 추가.
