'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Flame, Lightbulb } from 'lucide-react';
import {
  generateVerticalProblem,
  VerticalProblemPlan,
  VerticalStep,
  PlaceColumn,
} from '../utils/verticalMathEngine';
import {
  calculateEarnedExp,
  calculatePerfectBonusExp,
  calculateNextLevelAndExp,
  getCharacterStageInfo,
} from '../utils/gamification';
import { playQuizSound } from '../utils/soundEffects';
import ResultScreen, { HistoryItem } from './ResultScreen';
import { useAuth } from '../context/AuthContext';
import { insertSession, upsertProfile } from '../lib/api';

export interface VerticalQuizScreenProps {
  category: '2x1' | '3x1' | '2x2';
  onBack?: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  '2x1': '두자리 × 한자리',
  '3x1': '세자리 × 한자리',
  '2x2': '두자리 × 두자리',
};

export default function VerticalQuizScreen({ category, onBack }: VerticalQuizScreenProps) {
  const { user, profile, updateProfileState } = useAuth();
  const [reviewQueue, setReviewQueue] = useState<Array<{ top: number; bottom: number }> | null>(
    null
  );
  const [plan, setPlan] = useState<VerticalProblemPlan>(() => generateVerticalProblem(category));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [enteredValues, setEnteredValues] = useState<Record<string, number>>({});
  const [errorStepId, setErrorStepId] = useState<string | null>(null);
  const [hasCurrentProblemError, setHasCurrentProblemError] = useState(false);
  const [isQuestionCompleted, setIsQuestionCompleted] = useState(false);

  const [questionCount, setQuestionCount] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sessionExp, setSessionExp] = useState(0);
  const [bonusExp, setBonusExp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const hasSavedRef = useRef(false);

  const activeInputRef = useRef<HTMLInputElement>(null);

  const totalQuestionsTarget = reviewQueue ? reviewQueue.length : 10;
  const expPerQuestion = calculateEarnedExp(category);

  const [sessionBaseStats, setSessionBaseStats] = useState({
    exp: profile?.exp ?? 0,
    level: profile?.level ?? 1,
  });

  useEffect(() => {
    if (sessionExp === 0 && questionCount === 1 && profile) {
      setSessionBaseStats({
        exp: profile.exp,
        level: profile.level,
      });
    }
  }, [profile, sessionExp, questionCount]);

  const displayStats = calculateNextLevelAndExp(
    sessionBaseStats.exp,
    sessionBaseStats.level,
    sessionExp + bonusExp
  );
  const level = displayStats.level;
  const exp = displayStats.exp;

  // Autofocus the active step box
  useEffect(() => {
    if (!isQuestionCompleted && !isFinished) {
      activeInputRef.current?.focus();
      const timer = setTimeout(() => {
        activeInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isQuestionCompleted, isFinished, plan]);

  // Handle digit input
  const handleDigitInput = useCallback(
    (digit: number) => {
      if (isQuestionCompleted || isFinished) return;
      const currentStep = plan.steps[currentStepIndex];
      if (!currentStep) return;

      if (digit === currentStep.expectedValue) {
        playQuizSound('correct', isMuted);
        setEnteredValues((prev) => ({ ...prev, [currentStep.id]: digit }));

        if (currentStepIndex + 1 < plan.steps.length) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          // All steps completed!
          setIsQuestionCompleted(true);
          playQuizSound('complete', isMuted);

          const isProblemPassed = !hasCurrentProblemError;
          if (isProblemPassed) {
            setSessionExp((prev) => prev + expPerQuestion);
            setStreak((prev) => prev + 1);
          } else {
            setStreak(0);
          }

          const newHistoryItem: HistoryItem = {
            expression: `${plan.topNumber} × ${plan.bottomNumber}`,
            userAns: plan.answer,
            realAns: plan.answer,
            isCorrect: isProblemPassed,
          };
          const nextHistory = [...history, newHistoryItem];
          setHistory(nextHistory);

          setTimeout(() => {
            if (questionCount < totalQuestionsTarget) {
              const nextIdx = questionCount;
              setQuestionCount((prev) => prev + 1);
              if (reviewQueue && reviewQueue[nextIdx]) {
                setPlan(generateVerticalProblem(category, reviewQueue[nextIdx]));
              } else {
                setPlan(generateVerticalProblem(category));
              }
              setCurrentStepIndex(0);
              setEnteredValues({});
              setHasCurrentProblemError(false);
              setIsQuestionCompleted(false);
            } else {
              const finalCorrectCount = nextHistory.filter((h) => h.isCorrect).length;
              const perfectBonus = calculatePerfectBonusExp(
                category,
                totalQuestionsTarget,
                finalCorrectCount
              );
              setBonusExp(perfectBonus);
              setIsFinished(true);
            }
          }, 800);
        }
      } else {
        playQuizSound('wrong', isMuted);
        setHasCurrentProblemError(true);
        setErrorStepId(currentStep.id);
        setTimeout(() => {
          setErrorStepId(null);
        }, 400);
      }
    },
    [
      category,
      currentStepIndex,
      expPerQuestion,
      hasCurrentProblemError,
      history,
      isFinished,
      isMuted,
      isQuestionCompleted,
      plan,
      questionCount,
      reviewQueue,
      totalQuestionsTarget,
    ]
  );

  // Global keydown handler for numbers 0-9
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitInput(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitInput]);

  // Save session when finished
  useEffect(() => {
    if (!isFinished || hasSavedRef.current || !user) return;
    hasSavedRef.current = true;

    const saveSessionData = async () => {
      const totalQuestions = history.length;
      const correctCount = history.filter((h) => h.isCorrect).length;
      const totalEarned = sessionExp + bonusExp;

      await insertSession(user.id, category, totalQuestions, correctCount, totalEarned);
      const nextStats = calculateNextLevelAndExp(
        sessionBaseStats.exp,
        sessionBaseStats.level,
        totalEarned
      );
      if (nextStats.level > sessionBaseStats.level) {
        playQuizSound('levelup', isMuted);
      }
      await upsertProfile(user.id, nextStats.exp, nextStats.level);
      updateProfileState(nextStats.exp, nextStats.level);
    };

    saveSessionData();
  }, [
    isFinished,
    user,
    history,
    sessionExp,
    bonusExp,
    sessionBaseStats,
    category,
    updateProfileState,
    isMuted,
  ]);

  const resetQuiz = () => {
    hasSavedRef.current = false;
    setReviewQueue(null);
    setQuestionCount(1);
    setHistory([]);
    setIsFinished(false);
    setSessionExp(0);
    setBonusExp(0);
    setStreak(0);
    setPlan(generateVerticalProblem(category));
    setCurrentStepIndex(0);
    setEnteredValues({});
    setHasCurrentProblemError(false);
    setIsQuestionCompleted(false);
    setSessionBaseStats({
      exp: profile?.exp ?? 0,
      level: profile?.level ?? 1,
    });
  };

  const startReviewWrong = () => {
    const wrongOperands = history
      .filter((h) => !h.isCorrect)
      .map((h) => {
        const parts = h.expression.split('×').map((s) => parseInt(s.trim(), 10));
        return { top: parts[0] || 12, bottom: parts[1] || 3 };
      });
    if (wrongOperands.length === 0) return;

    hasSavedRef.current = false;
    setReviewQueue(wrongOperands);
    setQuestionCount(1);
    setHistory([]);
    setIsFinished(false);
    setSessionExp(0);
    setBonusExp(0);
    setStreak(0);
    setPlan(generateVerticalProblem(category, wrongOperands[0]));
    setCurrentStepIndex(0);
    setEnteredValues({});
    setHasCurrentProblemError(false);
    setIsQuestionCompleted(false);
    setSessionBaseStats({
      exp: profile?.exp ?? 0,
      level: profile?.level ?? 1,
    });
  };

  if (isFinished) {
    return (
      <ResultScreen
        history={history}
        totalExp={sessionExp + bonusExp}
        bonusExp={bonusExp}
        previousLevel={sessionBaseStats.level}
        currentLevel={level}
        onRetry={resetQuiz}
        onReviewWrong={startReviewWrong}
        onHome={onBack ?? (() => {})}
      />
    );
  }

  const currentStep = plan.steps[currentStepIndex];

  // Helper to render input cell
  const renderCell = (
    stepId: string | undefined,
    size: 'small' | 'large' = 'large',
    step?: VerticalStep
  ) => {
    if (!stepId || !step) {
      return <div className={size === 'small' ? 'w-9 h-8' : 'w-12 h-14'} />;
    }

    const isActive = currentStep?.id === stepId;
    const isEntered = enteredValues[stepId] !== undefined;
    const isError = errorStepId === stepId;

    const sizeClasses =
      size === 'small'
        ? 'w-9 h-8 text-sm font-bold rounded-lg border-2'
        : 'w-12 h-14 text-2xl font-black rounded-xl border-2';

    let stateClasses = 'bg-white border-slate-300 text-slate-400';
    if (isEntered) {
      stateClasses =
        size === 'small'
          ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
          : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm';
    } else if (isActive) {
      stateClasses =
        size === 'small'
          ? 'bg-amber-50 border-amber-500 ring-4 ring-amber-200 animate-pulse text-amber-900'
          : 'bg-white border-indigo-600 ring-4 ring-indigo-200 text-indigo-900 shadow-md';
    }

    return (
      <motion.div
        key={stepId}
        animate={isError ? { x: [-8, 8, -6, 6, 0] } : {}}
        transition={{ duration: 0.35 }}
        className={`flex items-center justify-center select-none transition-all ${sizeClasses} ${stateClasses} ${
          isError ? 'border-red-500 bg-red-50 text-red-600' : ''
        }`}
        onClick={() => {
          if (isActive) activeInputRef.current?.focus();
        }}
      >
        {isEntered ? enteredValues[stepId] : isActive ? '?' : ''}
        {isActive && (
          <input
            ref={activeInputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            autoFocus
          />
        )}
      </motion.div>
    );
  };

  // Digits splitting for operands
  const topDigits: Record<PlaceColumn, number | null> = {
    thousands: plan.topNumber >= 1000 ? Math.floor(plan.topNumber / 1000) % 10 : null,
    hundreds: plan.topNumber >= 100 ? Math.floor(plan.topNumber / 100) % 10 : null,
    tens: Math.floor(plan.topNumber / 10) % 10,
    ones: plan.topNumber % 10,
  };

  const bottomDigits: Record<PlaceColumn, number | null> = {
    thousands: null,
    hundreds: null,
    tens: plan.bottomNumber >= 10 ? Math.floor(plan.bottomNumber / 10) % 10 : null,
    ones: plan.bottomNumber % 10,
  };

  const renderOperandDigit = (val: number | null, col: PlaceColumn, isTop: boolean) => {
    const isHighlighted = isTop
      ? currentStep?.activeTopColumn === col
      : currentStep?.activeBottomColumn === col;

    return (
      <div
        className={`text-3xl font-black h-12 flex items-center justify-center rounded-xl transition-all ${
          val !== null && isHighlighted
            ? 'bg-indigo-100/90 text-indigo-700 ring-2 ring-indigo-300 scale-105'
            : 'text-slate-800'
        }`}
      >
        {val ?? ''}
      </div>
    );
  };

  const getStep = (id: string) => plan.steps.find((s) => s.id === id);
  const stageInfo = getCharacterStageInfo(level);
  const maxExpForLevel = level * 100;
  const expPercentage = Math.min(100, Math.max(0, (exp / maxExpForLevel) * 100));

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex flex-col items-center p-4">
      {/* Top Header */}
      <header className="w-full max-w-lg flex items-center justify-between py-2 mb-2">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 font-bold text-sm bg-white/80 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 transition"
        >
          ← 뒤로 가기
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
            {CATEGORY_NAMES[category] || category} (세로셈)
          </span>
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
            className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 border border-slate-200 shadow-sm transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col items-center">
        {/* Character & EXP Bar */}
        <div className="w-full flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{stageInfo.emoji}</span>
            <div>
              <div className="text-xs font-bold text-slate-500">
                Lv.{level} {stageInfo.name}
              </div>
              <div className="text-xs font-semibold text-indigo-600">
                +{expPerQuestion} EXP/문제
              </div>
            </div>
          </div>

          {streak >= 2 && (
            <div className="inline-flex items-center gap-0.5 text-xs font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {streak}연속 무실수!
            </div>
          )}

          <div className="w-36 sm:w-44">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>EXP</span>
              <span>
                {exp} / {maxExpForLevel}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${expPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Review Mode Notice */}
        {reviewQueue && (
          <div className="w-full mb-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800">
            💪 실수했던 세로셈 문제를 다시 풀어보고 있어요!
          </div>
        )}

        {/* Question Progress Pills */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: totalQuestionsTarget }).map((_, i) => {
            const isCurrent = i + 1 === questionCount;
            const isPast = i + 1 < questionCount;
            const item = history[i];

            let bg = 'bg-slate-200 text-slate-500';
            if (isCurrent)
              bg = 'bg-indigo-600 text-white font-bold scale-110 shadow-sm ring-2 ring-indigo-300';
            else if (isPast) {
              bg = item?.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white';
            }

            return (
              <div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${bg}`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {/* Vertical Calculation Board */}
        <div className="w-full bg-amber-50/40 border-2 border-amber-200/60 rounded-2xl p-5 mb-3 flex flex-col items-center select-none shadow-inner relative">
          <div className="grid grid-cols-4 gap-2 text-center items-center">
            {/* 1. Top Carry Row */}
            <div className="flex justify-center">
              {renderCell(getStep('carry_thousands')?.id, 'small', getStep('carry_thousands'))}
            </div>
            <div className="flex justify-center">
              {renderCell(
                getStep('carry_hundreds_r1')?.id || getStep('carry2_tens')?.id,
                'small',
                getStep('carry_hundreds_r1') || getStep('carry2_tens')
              )}
            </div>
            <div className="flex justify-center">
              {renderCell(
                getStep('carry_tens_r1')?.id || getStep('carry1_tens')?.id,
                'small',
                getStep('carry_tens_r1') || getStep('carry1_tens')
              )}
            </div>
            <div className="w-9 h-8" />

            {/* 2. Top Operand (피승수) */}
            {renderOperandDigit(topDigits.thousands, 'thousands', true)}
            {renderOperandDigit(topDigits.hundreds, 'hundreds', true)}
            {renderOperandDigit(topDigits.tens, 'tens', true)}
            {renderOperandDigit(topDigits.ones, 'ones', true)}

            {/* 3. Bottom Operand with Multiplication Sign (승수) */}
            <div className="text-2xl font-bold text-indigo-500 h-12 flex items-center justify-center">
              ×
            </div>
            {renderOperandDigit(bottomDigits.hundreds, 'hundreds', false)}
            {renderOperandDigit(bottomDigits.tens, 'tens', false)}
            {renderOperandDigit(bottomDigits.ones, 'ones', false)}

            {/* Divider 1 */}
            <div className="col-span-4 border-b-4 border-slate-700 my-1" />

            {/* 4. Partial Product 1 (or single result for 2x1, 3x1) */}
            {category !== '2x2' ? (
              <>
                <div className="flex justify-center">
                  {renderCell(getStep('res_thousands_r1')?.id, 'large', getStep('res_thousands_r1'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('res_hundreds_r1')?.id, 'large', getStep('res_hundreds_r1'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('res_tens_r1')?.id, 'large', getStep('res_tens_r1'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('res_ones_r1')?.id, 'large', getStep('res_ones_r1'))}
                </div>
              </>
            ) : (
              <>
                {/* 2x2 Row 1 (Top * bottomOnes) */}
                <div className="w-12 h-14" />
                <div className="flex justify-center">
                  {renderCell(getStep('row1_hundreds')?.id, 'large', getStep('row1_hundreds'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('row1_tens')?.id, 'large', getStep('row1_tens'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('row1_ones')?.id, 'large', getStep('row1_ones'))}
                </div>

                {/* 2x2 Row 2 (Top * bottomTens, shifted left) */}
                <div className="flex justify-center">
                  {renderCell(getStep('row2_thousands')?.id, 'large', getStep('row2_thousands'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('row2_hundreds')?.id, 'large', getStep('row2_hundreds'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('row2_tens')?.id, 'large', getStep('row2_tens'))}
                </div>
                <div className="w-12 h-14 flex items-center justify-center text-slate-300 font-bold">
                  0
                </div>

                {/* Addition Carry row if any */}
                {(getStep('add_carry_thousands') ||
                  getStep('add_carry_hundreds') ||
                  getStep('add_carry_tens')) && (
                  <>
                    <div className="flex justify-center">
                      {renderCell(
                        getStep('add_carry_thousands')?.id,
                        'small',
                        getStep('add_carry_thousands')
                      )}
                    </div>
                    <div className="flex justify-center">
                      {renderCell(
                        getStep('add_carry_hundreds')?.id,
                        'small',
                        getStep('add_carry_hundreds')
                      )}
                    </div>
                    <div className="flex justify-center">
                      {renderCell(
                        getStep('add_carry_tens')?.id,
                        'small',
                        getStep('add_carry_tens')
                      )}
                    </div>
                    <div className="w-9 h-8" />
                  </>
                )}

                {/* Divider 2 */}
                <div className="col-span-4 border-b-4 border-slate-700 my-1" />

                {/* 2x2 Row 3 Final Sum */}
                <div className="flex justify-center">
                  {renderCell(getStep('sum_thousands')?.id, 'large', getStep('sum_thousands'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('sum_hundreds')?.id, 'large', getStep('sum_hundreds'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('sum_tens')?.id, 'large', getStep('sum_tens'))}
                </div>
                <div className="flex justify-center">
                  {renderCell(getStep('sum_ones')?.id, 'large', getStep('sum_ones'))}
                </div>
              </>
            )}
          </div>

          {/* Success Checkmark Overlay */}
          <AnimatePresence>
            {isQuestionCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/75 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl shadow-lg mb-2">
                  ✓
                </div>
                <span className="font-extrabold text-emerald-800 text-lg">완벽한 세로셈!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step-by-Step Pedagogical Guide Banner */}
        <div
          className={`w-full rounded-xl px-3.5 py-2.5 mb-3 text-xs font-bold flex items-center gap-2 transition-colors border ${
            errorStepId
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
          }`}
        >
          <Lightbulb
            className={`w-4 h-4 shrink-0 ${
              errorStepId ? 'text-rose-500' : 'text-amber-500'
            }`}
          />
          <span>
            {currentStep?.hint ||
              `파란 테두리 칸에 알맞은 숫자를 입력하세요 (${
                currentStep?.targetType === 'carry' ? '올림수' : '계산 결과'
              } 입력 차례)`}
          </span>
        </div>

        {/* On-Screen Keypad for Mobile / Tablet / Mouse */}
        <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitInput(num)}
              className="h-12 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 border border-slate-200 rounded-xl font-bold text-xl text-slate-700 shadow-sm transition active:scale-95"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
