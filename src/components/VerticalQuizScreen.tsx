'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  generateVerticalProblem,
  VerticalProblemPlan,
  VerticalStep,
  PlaceColumn,
} from '../utils/verticalMathEngine';
import { calculateNextLevelAndExp, getCharacterStage } from '../utils/gamification';
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

const EXP_REWARDS: Record<string, number> = {
  '2x1': 20,
  '3x1': 30,
  '2x2': 40,
};

export default function VerticalQuizScreen({ category, onBack }: VerticalQuizScreenProps) {
  const { user, profile, updateProfileState } = useAuth();
  const [plan, setPlan] = useState<VerticalProblemPlan>(() => generateVerticalProblem(category));
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [enteredValues, setEnteredValues] = useState<Record<string, number>>({});
  const [errorStepId, setErrorStepId] = useState<string | null>(null);
  const [hasCurrentProblemError, setHasCurrentProblemError] = useState(false);
  const [isQuestionCompleted, setIsQuestionCompleted] = useState(false);

  const [questionCount, setQuestionCount] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sessionExp, setSessionExp] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const hasSavedRef = useRef(false);

  const activeInputRef = useRef<HTMLInputElement>(null);

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
    sessionExp
  );
  const level = displayStats.level;
  const exp = displayStats.exp;

  // Sound effects with Web Audio API
  const playSound = useCallback((type: 'correct' | 'wrong' | 'complete') => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (type === 'correct') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'wrong') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'complete') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          const startTime = audioCtx.currentTime + idx * 0.08;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.2, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
          osc.start(startTime);
          osc.stop(startTime + 0.2);
        });
      }
    } catch {
      // Audio playback non-blocking fallback
    }
  }, []);

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
  const handleDigitInput = useCallback((digit: number) => {
    if (isQuestionCompleted || isFinished) return;
    const currentStep = plan.steps[currentStepIndex];
    if (!currentStep) return;

    if (digit === currentStep.expectedValue) {
      // Correct digit
      playSound('correct');
      setEnteredValues(prev => ({ ...prev, [currentStep.id]: digit }));

      if (currentStepIndex + 1 < plan.steps.length) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        // All steps completed!
        setIsQuestionCompleted(true);
        playSound('complete');

        const reward = EXP_REWARDS[category] || 20;
        const isProblemPassed = !hasCurrentProblemError;
        if (isProblemPassed) {
          setSessionExp(prev => prev + reward);
        }

        const newHistoryItem: HistoryItem = {
          expression: `${plan.topNumber} × ${plan.bottomNumber}`,
          userAns: plan.answer,
          realAns: plan.answer,
          isCorrect: isProblemPassed,
        };
        setHistory(prev => [...prev, newHistoryItem]);

        setTimeout(() => {
          if (questionCount < 10) {
            setQuestionCount(prev => prev + 1);
            setPlan(generateVerticalProblem(category));
            setCurrentStepIndex(0);
            setEnteredValues({});
            setHasCurrentProblemError(false);
            setIsQuestionCompleted(false);
          } else {
            setIsFinished(true);
          }
        }, 800);
      }
    } else {
      // Incorrect digit
      playSound('wrong');
      setHasCurrentProblemError(true);
      setErrorStepId(currentStep.id);
      setTimeout(() => {
        setErrorStepId(null);
      }, 400);
    }
  }, [category, currentStepIndex, hasCurrentProblemError, isFinished, isQuestionCompleted, plan, playSound, questionCount]);

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

  // Save session when 10 questions finished
  useEffect(() => {
    if (!isFinished || hasSavedRef.current || !user) return;
    hasSavedRef.current = true;

    const saveSessionData = async () => {
      const totalQuestions = 10;
      const correctCount = history.filter(h => h.isCorrect).length;

      await insertSession(user.id, category, totalQuestions, correctCount, sessionExp);
      const nextStats = calculateNextLevelAndExp(
        sessionBaseStats.exp,
        sessionBaseStats.level,
        sessionExp
      );
      await upsertProfile(user.id, nextStats.exp, nextStats.level);
      updateProfileState(nextStats.exp, nextStats.level);
    };

    saveSessionData();
  }, [isFinished, user, history, sessionExp, sessionBaseStats, category, updateProfileState]);

  const resetQuiz = () => {
    hasSavedRef.current = false;
    setQuestionCount(1);
    setHistory([]);
    setIsFinished(false);
    setSessionExp(0);
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

  if (isFinished) {
    const correctCount = history.filter(h => h.isCorrect).length;
    return (
      <ResultScreen
        history={history}
        totalExp={sessionExp}
        onRetry={resetQuiz}
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
  const topDigits = {
    thousands: plan.topNumber >= 1000 ? Math.floor(plan.topNumber / 1000) % 10 : null,
    hundreds: plan.topNumber >= 100 ? Math.floor(plan.topNumber / 100) % 10 : null,
    tens: Math.floor(plan.topNumber / 10) % 10,
    ones: plan.topNumber % 10,
  };

  const bottomDigits = {
    thousands: null,
    hundreds: null,
    tens: plan.bottomNumber >= 10 ? Math.floor(plan.bottomNumber / 10) % 10 : null,
    ones: plan.bottomNumber % 10,
  };

  // Find step by id
  const getStep = (id: string) => plan.steps.find(s => s.id === id);

  const stage = getCharacterStage(level);
  const stageEmojis: Record<string, string> = {
    egg: '🥚',
    baby_monster: '🐣',
    cool_monster: '🦕',
    dragon: '🐉',
  };
  const stageNames: Record<string, string> = {
    egg: '알',
    baby_monster: '아기 몬스터',
    cool_monster: '멋쟁이 몬스터',
    dragon: '드래곤',
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex flex-col items-center p-4">
      {/* Top Header */}
      <header className="w-full max-w-lg flex items-center justify-between py-2 mb-2">
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 font-bold text-sm bg-white/80 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 transition"
        >
          ← 뒤로 가기
        </button>
        <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
          {CATEGORY_NAMES[category] || category} (세로셈)
        </span>
      </header>

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col items-center">
        {/* Character & EXP Bar */}
        <div className="w-full flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{stageEmojis[stage] || '🥚'}</span>
            <div>
              <div className="text-xs font-bold text-slate-500">Lv.{level} {stageNames[stage] || '알'}</div>
              <div className="text-xs font-semibold text-indigo-600">+{EXP_REWARDS[category]} EXP/문제</div>
            </div>
          </div>
          <div className="w-40">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>EXP</span>
              <span>{exp} / 100</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, exp)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 10 Question Progress Pills */}
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: 10 }).map((_, i) => {
            const isCurrent = i + 1 === questionCount;
            const isPast = i + 1 < questionCount;
            const item = history[i];

            let bg = 'bg-slate-200 text-slate-500';
            if (isCurrent) bg = 'bg-indigo-600 text-white font-bold scale-110 shadow-sm ring-2 ring-indigo-300';
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
        <div className="w-full bg-amber-50/40 border-2 border-amber-200/60 rounded-2xl p-5 mb-4 flex flex-col items-center select-none shadow-inner relative">
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
            <div className="text-3xl font-black text-slate-800 h-12 flex items-center justify-center">
              {topDigits.thousands ?? ''}
            </div>
            <div className="text-3xl font-black text-slate-800 h-12 flex items-center justify-center">
              {topDigits.hundreds ?? ''}
            </div>
            <div className="text-3xl font-black text-slate-800 h-12 flex items-center justify-center">
              {topDigits.tens}
            </div>
            <div className="text-3xl font-black text-slate-800 h-12 flex items-center justify-center">
              {topDigits.ones}
            </div>

            {/* 3. Bottom Operand with Multiplication Sign (승수) */}
            <div className="text-2xl font-bold text-indigo-500 h-12 flex items-center justify-center">
              ×
            </div>
            <div className="text-3xl font-black text-slate-800 h-12 flex items-center justify-center">
              {bottomDigits.hundreds ?? ''}
            </div>
            <div className="text-3xl font-black text-slate-800 h-12 flex items-center justify-center">
              {bottomDigits.tens ?? ''}
            </div>
            <div className="text-3xl font-black text-slate-800 h-12 flex items-center justify-center">
              {bottomDigits.ones}
            </div>

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
                <div className="col-span-4 border-b-2 border-slate-400 my-1 relative">
                  {getStep('add_carry_hundreds') && (
                    <div className="absolute -top-3 left-1/4">
                      {renderCell(getStep('add_carry_hundreds')?.id, 'small', getStep('add_carry_hundreds'))}
                    </div>
                  )}
                </div>

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

        {/* Step Guide Hint */}
        <div className="text-xs text-slate-500 font-semibold mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          파란 테두리 칸에 알맞은 숫자를 키보드로 입력하세요 (
          {currentStep?.targetType === 'carry' ? '올림수' : '계산 결과'} 입력 차례)
        </div>

        {/* On-Screen Keypad for Mobile / Tablet / Mouse */}
        <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
            <button
              key={num}
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
