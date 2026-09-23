'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { generateProblem } from '../utils/mathGenerator';
import { calculateEarnedExp, calculateNextLevelAndExp, getCharacterStage } from '../utils/gamification';
import ResultScreen, { HistoryItem } from './ResultScreen';
import { useAuth } from '../context/AuthContext';
import { insertSession, upsertProfile } from '../lib/api';

export interface QuizScreenProps {
  category: string;
  onBack?: () => void;
}

export default function QuizScreen({ category, onBack }: QuizScreenProps) {
  const { user, profile, updateProfileState } = useAuth();
  const [problem, setProblem] = useState({ expression: '', answer: 0 });
  const [input, setInput] = useState('');
  const [sessionExp, setSessionExp] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [questionCount, setQuestionCount] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const hasSavedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedback === 'idle' && !isFinished) {
      inputRef.current?.focus();
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [feedback, questionCount, isFinished]);

  const [sessionBaseStats, setSessionBaseStats] = useState({
    exp: profile?.exp ?? 0,
    level: profile?.level ?? 1,
  });

  // Keep session base stats updated if profile loads after mount before any questions are answered
  useEffect(() => {
    if (sessionExp === 0 && questionCount === 1 && profile) {
      setSessionBaseStats({
        exp: profile.exp,
        level: profile.level,
      });
    }
  }, [profile, sessionExp, questionCount]);

  // Derive dynamic level and exp from session base stats + sessionExp
  const displayStats = calculateNextLevelAndExp(
    sessionBaseStats.exp,
    sessionBaseStats.level,
    sessionExp
  );
  const level = displayStats.level;
  const exp = displayStats.exp;

  const resetQuiz = () => {
    hasSavedRef.current = false;
    setQuestionCount(1);
    setHistory([]);
    setIsFinished(false);
    setSessionExp(0);
    setInput('');
    setFeedback('idle');
    setProblem(generateProblem(category));
    setSessionBaseStats({
      exp: profile?.exp ?? 0,
      level: profile?.level ?? 1,
    });
  };

  useEffect(() => {
    resetQuiz();
  }, [category]);

  // Save session and update profile to Supabase when 10 questions finish
  useEffect(() => {
    if (!isFinished || hasSavedRef.current || !user) return;
    hasSavedRef.current = true;

    const saveSessionData = async () => {
      const totalQuestions = 10;
      const correctCount = history.filter(h => h.isCorrect).length;

      // 1. Insert session record
      await insertSession(user.id, category, totalQuestions, correctCount, sessionExp);

      // 2. Calculate cumulative level and exp based on starting profile + sessionExp
      const nextStats = calculateNextLevelAndExp(
        sessionBaseStats.exp,
        sessionBaseStats.level,
        sessionExp
      );

      // 3. Upsert profile in Supabase
      await upsertProfile(user.id, nextStats.exp, nextStats.level);

      // 4. Update global AuthContext state so Home Dashboard updates immediately
      updateProfileState(nextStats.exp, nextStats.level);
    };

    saveSessionData();
  }, [isFinished, user, category, history, sessionExp, sessionBaseStats, updateProfileState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setHistory(prev => [...prev, historyItem]);

    if (isCorrect) {
      setFeedback('correct');
      const earned = calculateEarnedExp(category);
      setSessionExp(prev => prev + earned);
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      if (questionCount < 10) {
        setQuestionCount(prev => prev + 1);
        setProblem(generateProblem(category));
        setInput('');
        setFeedback('idle');
      } else {
        setIsFinished(true);
        setInput('');
        setFeedback('idle');
      }
    }, isCorrect ? 800 : 700);
  };

  if (isFinished) {
    return (
      <ResultScreen
        history={history}
        totalExp={sessionExp}
        onRetry={resetQuiz}
        onHome={onBack ?? (() => {})}
      />
    );
  }

  const stage = getCharacterStage(level);
  const stageEmojis: Record<string, string> = {
    egg: '🥚',
    baby_monster: '🐣',
    cool_monster: '🦕',
    dragon: '🐉',
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl border-4 border-sky-200 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="text-xl font-bold text-slate-600">Level {level}</div>
        <div className="text-4xl">{stageEmojis[stage]}</div>
        <div className="text-lg font-semibold text-orange-500">EXP {exp} / {level * 100}</div>
      </div>

      <div className="h-4 w-full bg-slate-100 rounded-full mb-6 overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 absolute left-0 top-0"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, (exp / (level * 100)) * 100))}%` }}
          transition={{ type: "spring", stiffness: 50 }}
        />
      </div>

      {/* 10-Question Progress Indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full">
          문제 {questionCount} / 10
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }).map((_, idx) => (
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

      <motion.div
        animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="text-6xl font-black text-center text-slate-700 mb-10 tracking-widest select-none"
      >
        {problem.expression.replace(/\\times/g, '×')}
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 z-10 relative">
        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={feedback !== 'idle'}
          className={`text-center text-4xl p-4 rounded-2xl border-4 outline-none transition-colors ${
            feedback === 'correct' ? 'border-green-400 bg-green-50 text-green-700' :
            feedback === 'wrong' ? 'border-red-400 bg-red-50 text-red-700' :
            'border-sky-300 focus:border-sky-500 text-slate-700'
          }`}
          placeholder="정답입력"
          autoFocus
        />
        <button
          type="submit"
          disabled={feedback !== 'idle'}
          className="bg-sky-500 text-white text-2xl font-bold py-4 rounded-2xl shadow-[0_8px_0_0_#0284c7] hover:translate-y-1 hover:shadow-[0_4px_0_0_#0284c7] transition-all active:shadow-none active:translate-y-2 disabled:opacity-80"
        >
          확인
        </button>
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
    </div>
  );
}
