'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import { getFeedbackMessage } from '../utils/resultHelper';

export interface HistoryItem {
  expression: string;
  userAns: number;
  realAns: number;
  isCorrect: boolean;
}

export interface ResultScreenProps {
  history: HistoryItem[];
  totalExp: number;
  onRetry: () => void;
  onHome: () => void;
}

// Pre-defined confetti positions for deterministic hydration and performance
const CONFETTI_PIECES = [
  { id: 1, x: -140, y: -160, color: '#f59e0b', scale: 0.9, rotate: 45, delay: 0 },
  { id: 2, x: 130, y: -150, color: '#ec4899', scale: 0.8, rotate: 120, delay: 0.1 },
  { id: 3, x: -100, y: -200, color: '#3b82f6', scale: 1.1, rotate: 210, delay: 0.15 },
  { id: 4, x: 90, y: -210, color: '#10b981', scale: 1.0, rotate: 75, delay: 0.05 },
  { id: 5, x: -50, y: -230, color: '#8b5cf6', scale: 1.2, rotate: 300, delay: 0.2 },
  { id: 6, x: 40, y: -220, color: '#f97316', scale: 0.85, rotate: 160, delay: 0.12 },
  { id: 7, x: -160, y: -90, color: '#eab308', scale: 0.95, rotate: 90, delay: 0.18 },
  { id: 8, x: 160, y: -100, color: '#06b6d4', scale: 1.05, rotate: 180, delay: 0.08 },
  { id: 9, x: -120, y: -60, color: '#f43f5e', scale: 0.75, rotate: 240, delay: 0.22 },
  { id: 10, x: 120, y: -70, color: '#a855f7', scale: 1.0, rotate: 60, delay: 0.25 },
  { id: 11, x: -70, y: -180, color: '#14b8a6', scale: 1.15, rotate: 135, delay: 0.3 },
  { id: 12, x: 70, y: -170, color: '#e11d48', scale: 0.9, rotate: 315, delay: 0.16 },
  { id: 13, x: -150, y: -130, color: '#facc15', scale: 1.0, rotate: 50, delay: 0.28 },
  { id: 14, x: 140, y: -140, color: '#38bdf8', scale: 0.85, rotate: 270, delay: 0.09 },
  { id: 15, x: 0, y: -240, color: '#fb923c', scale: 1.25, rotate: 190, delay: 0.14 },
];

export default function ResultScreen({
  history,
  totalExp,
  onRetry,
  onHome,
}: ResultScreenProps) {
  const correctCount = history.filter(item => item.isCorrect).length;
  const score = correctCount * 10;
  const feedback = getFeedbackMessage(score);
  const isPerfect = score === 100;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl border-4 border-sky-200 relative overflow-hidden">
      {/* Celebration Fireworks & Confetti for 100 Score */}
      {isPerfect && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex items-center justify-center">
          {/* Expanding shockwave bursts */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: [0.2, 1.8, 2.4], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
            className="w-48 h-48 rounded-full border-4 border-yellow-300 absolute"
          />
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: [0.2, 1.6, 2.1], opacity: [0.8, 0.3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1, delay: 0.5 }}
            className="w-48 h-48 rounded-full border-4 border-pink-400 absolute"
          />

          {/* Confetti pieces shooting outward and floating */}
          {CONFETTI_PIECES.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [0, p.x, p.x * 1.15],
                y: [0, p.y, p.y + 160],
                scale: [0, p.scale, p.scale * 0.9, p.scale * 0.7],
                rotate: [0, p.rotate, p.rotate + 360],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatDelay: 0.8,
                delay: p.delay,
                ease: 'easeOut',
              }}
              style={{ backgroundColor: p.color }}
              className="w-3.5 h-3.5 rounded-sm absolute shadow-sm"
            />
          ))}
        </div>
      )}

      {/* Header Result Badge */}
      <div className="text-center relative z-10 mb-6">
        <motion.div
          initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-block relative mb-2"
        >
          <div className="text-7xl filter drop-shadow-md select-none">
            {feedback.emoji}
          </div>
          {isPerfect && (
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 text-yellow-500"
            >
              <Sparkles className="w-7 h-7 drop-shadow" />
            </motion.div>
          )}
        </motion.div>

        <h2 className="text-2xl font-black text-slate-800 mb-1">
          {feedback.title}
        </h2>
        <p className="text-slate-500 text-sm font-medium mb-4">
          {feedback.subtitle}
        </p>

        {/* Score & EXP Banner */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-2xl border-2 border-sky-100">
          <div className="text-center">
            <div className="text-xs text-slate-500 font-semibold mb-0.5">최종 점수</div>
            <div className="text-3xl font-black text-indigo-700">
              {score}<span className="text-base font-bold text-indigo-500 ml-1">점</span>
            </div>
            <div className="text-xs text-indigo-400 font-medium">10문제 중 {correctCount}개 정답</div>
          </div>

          <div className="text-center border-l-2 border-sky-100">
            <div className="text-xs text-slate-500 font-semibold mb-0.5">획득 경험치</div>
            <div className="text-3xl font-black text-orange-500 flex items-center justify-center gap-0.5">
              <span>+{totalExp}</span>
              <span className="text-base font-bold text-orange-400 ml-0.5">EXP</span>
            </div>
            <div className="text-xs text-orange-400 font-medium flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5 inline" />
              성장 레벨 업!
            </div>
          </div>
        </div>
      </div>

      {/* Question Review List */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-sm font-bold text-slate-700">문제별 풀이 결과</span>
          <span className="text-xs font-semibold text-slate-400">총 {history.length}문제</span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {history.map((item, index) => {
            const formattedExpr = item.expression.replace(/\\times/g, '×');

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                  item.isCorrect
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-rose-50/70 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      item.isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800 text-base">
                      {formattedExpr} = {item.isCorrect ? item.userAns : item.realAns}
                    </div>
                    {!item.isCorrect && (
                      <div className="text-xs text-rose-600 font-medium">
                        내 답: <span className="line-through">{item.userAns}</span> (정답: {item.realAns})
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {item.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-3 relative z-10">
        <button
          onClick={onRetry}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-4 px-4 rounded-2xl shadow-[0_6px_0_0_#0284c7] hover:translate-y-0.5 hover:shadow-[0_3px_0_0_#0284c7] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center gap-2 text-lg"
        >
          <RotateCcw className="w-5 h-5" />
          다시 풀기
        </button>
        <button
          onClick={onHome}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl shadow-[0_6px_0_0_#cbd5e1] hover:translate-y-0.5 hover:shadow-[0_3px_0_0_#cbd5e1] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center gap-2 text-base"
        >
          <Home className="w-5 h-5" />
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}
