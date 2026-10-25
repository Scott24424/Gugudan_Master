'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, BookOpen, Flame, Delete } from 'lucide-react';
import {
  generateProblem,
  generateGugudanProblem,
  GugudanMode,
  Problem,
} from '../utils/mathGenerator';
import {
  calculateEarnedExp,
  calculatePerfectBonusExp,
  calculateNextLevelAndExp,
  getCharacterStageInfo,
} from '../utils/gamification';
import { playQuizSound } from '../utils/soundEffects';
import ResultScreen, { HistoryItem } from './ResultScreen';
import GugudanTableModal from './GugudanTableModal';
import { useAuth } from '../context/AuthContext';
import { insertSession, upsertProfile } from '../lib/api';

export interface QuizScreenProps {
  category: string;
  onBack?: () => void;
}

const ALL_DANS = [2, 3, 4, 5, 6, 7, 8, 9];

export default function QuizScreen({ category, onBack }: QuizScreenProps) {
  const { user, profile, updateProfileState } = useAuth();

  // 구구단 맞춤 설정 (선택 단 & 문제 유형)
  const [selectedDans, setSelectedDans] = useState<number[]>([]);
  const [gugudanMode, setGugudanMode] = useState<GugudanMode>('standard');
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // 오답 복습 모드 큐 (비어 있으면 일반 10문제 세션)
  const [reviewQueue, setReviewQueue] = useState<Problem[] | null>(null);

  const createNextProblem = useCallback(
    (dans: number[], mode: GugudanMode): Problem => {
      if (category === 'gugudan') {
        const p = generateGugudanProblem({ selectedDans: dans, mode });
        return { expression: p.expression, answer: p.answer };
      }
      return generateProblem(category);
    },
    [category]
  );

  const [problem, setProblem] = useState<Problem>(() => createNextProblem([], 'standard'));
  const [input, setInput] = useState('');
  const [sessionExp, setSessionExp] = useState(0);
  const [bonusExp, setBonusExp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [questionCount, setQuestionCount] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const hasSavedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalQuestionsTarget = reviewQueue ? reviewQueue.length : 10;

  useEffect(() => {
    if (feedback === 'idle' && !isFinished && !isTableModalOpen) {
      inputRef.current?.focus();
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [feedback, questionCount, isFinished, isTableModalOpen]);

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

  const resetQuiz = useCallback(
    (customDans = selectedDans, customMode = gugudanMode) => {
      hasSavedRef.current = false;
      setReviewQueue(null);
      setQuestionCount(1);
      setHistory([]);
      setIsFinished(false);
      setSessionExp(0);
      setBonusExp(0);
      setStreak(0);
      setInput('');
      setFeedback('idle');
      setProblem(createNextProblem(customDans, customMode));
      setSessionBaseStats({
        exp: profile?.exp ?? 0,
        level: profile?.level ?? 1,
      });
    },
    [createNextProblem, gugudanMode, profile?.exp, profile?.level, selectedDans]
  );

  useEffect(() => {
    resetQuiz([], 'standard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const startReviewWrong = () => {
    const wrongProblems: Problem[] = history
      .filter((h) => !h.isCorrect)
      .map((h) => ({ expression: h.expression, answer: h.realAns }));
    if (wrongProblems.length === 0) return;

    hasSavedRef.current = false;
    setReviewQueue(wrongProblems);
    setQuestionCount(1);
    setHistory([]);
    setIsFinished(false);
    setSessionExp(0);
    setBonusExp(0);
    setStreak(0);
    setInput('');
    setFeedback('idle');
    setProblem(wrongProblems[0]);
    setSessionBaseStats({
      exp: profile?.exp ?? 0,
      level: profile?.level ?? 1,
    });
  };

  // 단 선택 토글 핸들러
  const toggleDan = (dan: number) => {
    const nextDans = selectedDans.includes(dan)
      ? selectedDans.filter((d) => d !== dan)
      : [...selectedDans, dan].sort((a, b) => a - b);
    setSelectedDans(nextDans);
    if (questionCount === 1 && history.length === 0 && !reviewQueue) {
      setProblem(createNextProblem(nextDans, gugudanMode));
    }
  };

  const handleModeChange = (nextMode: GugudanMode) => {
    setGugudanMode(nextMode);
    if (questionCount === 1 && history.length === 0 && !reviewQueue) {
      setProblem(createNextProblem(selectedDans, nextMode));
    }
  };

  // 세션 종료 시 Supabase에 저장 및 프로필 업데이트
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
      } else {
        playQuizSound('complete', isMuted);
      }

      await upsertProfile(user.id, nextStats.exp, nextStats.level);
      updateProfileState(nextStats.exp, nextStats.level);
    };

    saveSessionData();
  }, [
    isFinished,
    user,
    category,
    history,
    sessionExp,
    bonusExp,
    sessionBaseStats,
    updateProfileState,
    isMuted,
  ]);

  const submitAnswer = () => {
    if (input.trim() === '' || feedback !== 'idle' || isFinished) return;

    const userAns = parseInt(input, 10);
    if (Number.isNaN(userAns)) return;

    const isCorrect = userAns === problem.answer;
    const historyItem: HistoryItem = {
      expression: problem.expression,
      userAns,
      realAns: problem.answer,
      isCorrect,
    };
    const nextHistory = [...history, historyItem];
    setHistory(nextHistory);

    if (isCorrect) {
      setFeedback('correct');
      playQuizSound('correct', isMuted);
      const earned = calculateEarnedExp(category);
      setSessionExp((prev) => prev + earned);
      setStreak((prev) => prev + 1);
    } else {
      setFeedback('wrong');
      playQuizSound('wrong', isMuted);
      setStreak(0);
    }

    setTimeout(() => {
      if (questionCount < totalQuestionsTarget) {
        const nextIdx = questionCount;
        setQuestionCount((prev) => prev + 1);
        if (reviewQueue && reviewQueue[nextIdx]) {
          setProblem(reviewQueue[nextIdx]);
        } else {
          setProblem(createNextProblem(selectedDans, gugudanMode));
        }
        setInput('');
        setFeedback('idle');
      } else {
        const finalCorrectCount = nextHistory.filter((h) => h.isCorrect).length;
        const perfectBonus = calculatePerfectBonusExp(
          category,
          totalQuestionsTarget,
          finalCorrectCount
        );
        setBonusExp(perfectBonus);
        setIsFinished(true);
        setInput('');
        setFeedback('idle');
      }
    }, isCorrect ? 750 : 1100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitAnswer();
  };

  const handleKeypadDigit = (digit: number) => {
    if (feedback !== 'idle' || isFinished) return;
    if (input.length >= 4) return;
    setInput((prev) => `${prev}${digit}`);
  };

  const handleKeypadBackspace = () => {
    if (feedback !== 'idle' || isFinished) return;
    setInput((prev) => prev.slice(0, -1));
  };

  if (isFinished) {
    return (
      <ResultScreen
        history={history}
        totalExp={sessionExp + bonusExp}
        bonusExp={bonusExp}
        previousLevel={sessionBaseStats.level}
        currentLevel={level}
        onRetry={() => resetQuiz(selectedDans, gugudanMode)}
        onReviewWrong={startReviewWrong}
        onHome={onBack ?? (() => {})}
      />
    );
  }

  const stageInfo = getCharacterStageInfo(level);

  return (
    <div className="max-w-md mx-auto mt-4 p-6 bg-white rounded-3xl shadow-xl border-4 border-sky-200 relative overflow-hidden">
      {/* Top Status Row: Level, Character, EXP & Sound Toggle */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="text-lg font-black text-slate-700">Level {level}</div>
          <div className="text-xs font-bold text-slate-400">{stageInfo.name}</div>
        </div>
        <div className="text-4xl select-none">{stageInfo.emoji}</div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-bold text-orange-500">
              EXP {exp} / {level * 100}
            </div>
            {streak >= 2 && (
              <div className="inline-flex items-center gap-0.5 text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                {streak}연속 정답!
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* EXP Progress Bar */}
      <div className="h-3.5 w-full bg-slate-100 rounded-full mb-5 overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 absolute left-0 top-0"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, (exp / (level * 100)) * 100))}%` }}
          transition={{ type: 'spring', stiffness: 50 }}
        />
      </div>

      {/* Gugudan Customization Controls (Dan Filter, Mode Selector & Reference Table) */}
      {category === 'gugudan' && !reviewQueue && (
        <div className="mb-5 p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              🎯 연습할 단 선택 ({selectedDans.length === 0 ? '2~9단 전체' : `${selectedDans.join(', ')}단`})
            </span>
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200 transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              구구단 표 보기
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedDans([]);
                if (questionCount === 1 && history.length === 0) {
                  setProblem(createNextProblem([], gugudanMode));
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                selectedDans.length === 0
                  ? 'bg-orange-400 text-white border-orange-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50'
              }`}
            >
              전체
            </button>
            {ALL_DANS.map((dan) => {
              const active = selectedDans.includes(dan);
              return (
                <button
                  key={dan}
                  type="button"
                  onClick={() => toggleDan(dan)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition ${
                    active
                      ? 'bg-orange-400 text-white border-orange-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-orange-50'
                  }`}
                >
                  {dan}단
                </button>
              );
            })}
          </div>

          {/* Mode Toggle: Standard vs Missing vs Mixed */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {(
              [
                { id: 'standard', label: '기본 (A×B=?)' },
                { id: 'missing', label: '빈칸 (A×□=C)' },
                { id: 'mixed', label: '혼합 출제' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModeChange(m.id)}
                className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                  gugudanMode === m.id
                    ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Review Mode Banner */}
      {reviewQueue && (
        <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs font-bold text-amber-800">
          💪 오답 복습 모드 진행 중! 틀렸던 문제를 완벽히 정복해 보세요!
        </div>
      )}

      {/* Question Progress Indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full">
          문제 {questionCount} / {totalQuestionsTarget}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: totalQuestionsTarget }).map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx < history.length
                  ? history[idx].isCorrect
                    ? 'bg-emerald-500'
                    : 'bg-rose-500'
                  : idx === questionCount - 1
                  ? 'bg-sky-500 scale-125'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Expression Display */}
      <motion.div
        animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="text-5xl sm:text-6xl font-black text-center text-slate-700 mb-4 py-2 tracking-wider select-none"
      >
        {problem.expression.replace(/\\times/g, '×')}
      </motion.div>

      {/* Wrong Answer Learning Feedback Banner */}
      {feedback === 'wrong' && (
        <div className="mb-4 py-2 px-3 bg-rose-50 border border-rose-200 rounded-xl text-center text-sm font-bold text-rose-600">
          아쉬워요! 정답은 <span className="underline font-black">{problem.answer}</span>예요 💡
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 z-10 relative">
        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={feedback !== 'idle'}
          className={`text-center text-4xl p-3.5 rounded-2xl border-4 outline-none transition-colors ${
            feedback === 'correct'
              ? 'border-green-400 bg-green-50 text-green-700'
              : feedback === 'wrong'
              ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-sky-300 focus:border-sky-500 text-slate-700'
          }`}
          placeholder={problem.expression.includes('□') ? '□ 안의 숫자' : '정답입력'}
          autoFocus
        />

        {/* On-Screen Keypad for Touch / Tablet / Mouse Convenience */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
            <button
              key={num}
              type="button"
              disabled={feedback !== 'idle'}
              onClick={() => handleKeypadDigit(num)}
              className="h-11 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 active:bg-sky-100 border border-slate-200 rounded-xl font-bold text-lg text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {num}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={feedback !== 'idle' || input.length === 0}
            onClick={handleKeypadBackspace}
            className="col-span-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl border border-slate-200 flex items-center justify-center gap-1 transition active:scale-95 disabled:opacity-50"
          >
            <Delete className="w-5 h-5" />
            <span className="text-sm">지우기</span>
          </button>
          <button
            type="submit"
            disabled={feedback !== 'idle'}
            className="col-span-2 bg-sky-500 text-white text-2xl font-bold py-3.5 rounded-2xl shadow-[0_6px_0_0_#0284c7] hover:translate-y-0.5 hover:shadow-[0_3px_0_0_#0284c7] transition-all active:shadow-none active:translate-y-1.5 disabled:opacity-80"
          >
            확인
          </button>
        </div>
      </form>

      {feedback === 'correct' && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
        >
          <span className="text-8xl drop-shadow-2xl">✨🎉✨</span>
        </motion.div>
      )}

      <GugudanTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        initialDan={selectedDans[0] ?? 2}
      />
    </div>
  );
}
