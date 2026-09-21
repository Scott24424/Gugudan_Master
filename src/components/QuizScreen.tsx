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
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');

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
    egg: '🥚',
    baby_monster: '🐣',
    cool_monster: '🦕',
    dragon: '🐉'
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-3xl shadow-xl border-4 border-sky-200 relative overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div className="text-xl font-bold text-slate-600">Level {level}</div>
        <div className="text-4xl">{stageEmojis[stage]}</div>
        <div className="text-lg font-semibold text-orange-500">EXP {exp} / {level * 100}</div>
      </div>

      <div className="h-4 w-full bg-slate-100 rounded-full mb-8 overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 absolute left-0 top-0"
          initial={{ width: 0 }}
          animate={{ width: `${(exp / (level * 100)) * 100}%` }}
          transition={{ type: "spring", stiffness: 50 }}
        />
      </div>

      <motion.div
        animate={feedback === 'wrong' ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="text-6xl font-black text-center text-slate-700 mb-10 tracking-widest"
      >
        {problem.expression.replace('\\times', '×')}
      </motion.div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 z-10 relative">
        <input
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
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
          className="bg-sky-500 text-white text-2xl font-bold py-4 rounded-2xl shadow-[0_8px_0_0_#0284c7] hover:translate-y-1 hover:shadow-[0_4px_0_0_#0284c7] transition-all active:shadow-none active:translate-y-2"
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
