'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, BookOpen, Sparkles } from 'lucide-react';

export interface GugudanTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDan?: number;
}

const DANS = [2, 3, 4, 5, 6, 7, 8, 9];

export default function GugudanTableModal({
  isOpen,
  onClose,
  initialDan = 2,
}: GugudanTableModalProps) {
  const [selectedDan, setSelectedDan] = useState<number>(initialDan);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number>(3);
  const [hideAnswers, setHideAnswers] = useState<boolean>(false);
  const [revealedRows, setRevealedRows] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const toggleRevealRow = (m: number) => {
    setSelectedMultiplier(m);
    if (hideAnswers) {
      setRevealedRows((prev) => ({ ...prev, [m]: !prev[m] }));
    }
  };

  const handleSelectDan = (dan: number) => {
    setSelectedDan(dan);
    setRevealedRows({});
  };

  const handleToggleHideAll = () => {
    setHideAnswers((prev) => !prev);
    setRevealedRows({});
  };

  const product = selectedDan * selectedMultiplier;
  const additionExpr = Array.from({ length: selectedMultiplier }, () => selectedDan).join(' + ');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-4 border-indigo-100 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-300" />
              <h2 className="text-lg font-black tracking-tight">구구단 원리 & 암기 표</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="p-1.5 rounded-full hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {/* Dan Selector Tabs */}
            <div className="grid grid-cols-4 gap-2">
              {DANS.map((dan) => {
                const isActive = selectedDan === dan;
                return (
                  <button
                    key={dan}
                    type="button"
                    onClick={() => handleSelectDan(dan)}
                    className={`py-2 rounded-xl font-black text-sm transition-all border-2 ${
                      isActive
                        ? 'bg-orange-400 text-white border-orange-500 shadow-sm scale-105'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-orange-50 hover:border-orange-200'
                    }`}
                  >
                    {dan}단
                  </button>
                );
              })}
            </div>

            {/* Concept Visualization Box */}
            <div className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-3.5 text-center">
              <div className="text-xs font-bold text-amber-700 mb-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {selectedDan}씩 {selectedMultiplier}묶음 원리 ({selectedDan} × {selectedMultiplier}{' '}
                  = {product})
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-600 break-words mb-2">
                {additionExpr} = <strong className="text-indigo-700 text-sm">{product}</strong>
              </div>
              {product <= 45 && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {Array.from({ length: selectedMultiplier }).map((_, groupIdx) => (
                    <div
                      key={groupIdx}
                      className="inline-flex items-center gap-0.5 bg-white px-2 py-1 rounded-lg border border-amber-300 shadow-sm"
                    >
                      {Array.from({ length: selectedDan }).map((__, dotIdx) => (
                        <span
                          key={dotIdx}
                          className="w-2 h-2 rounded-full bg-orange-400 inline-block"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hide Answers Toggle Bar */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-500 font-semibold">
                {hideAnswers
                  ? '💡 줄을 터치하면 숨겨진 정답이 나타나요!'
                  : '줄을 클릭해 묶음 원리를 확인해 보세요!'}
              </span>
              <button
                type="button"
                onClick={handleToggleHideAll}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition ${
                  hideAnswers
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {hideAnswers ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    정답 모두 보기
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    답 가리고 외우기
                  </>
                )}
              </button>
            </div>

            {/* Multiplication Table List (x1 ~ x9) */}
            <div className="grid grid-cols-1 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => {
                const isSelected = selectedMultiplier === m;
                const isRevealed = !hideAnswers || revealedRows[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleRevealRow(m)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950'
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="text-lg font-black tracking-wide">
                      {selectedDan} × {m}
                    </span>
                    <span className="text-slate-400 font-bold">=</span>
                    <span
                      className={`min-w-[3.2rem] text-center py-0.5 px-2.5 rounded-lg text-lg font-black transition ${
                        isRevealed
                          ? 'text-indigo-700 bg-indigo-100/70'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}
                    >
                      {isRevealed ? selectedDan * m : '?'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl shadow-md transition active:scale-98"
            >
              다 외웠어요! 문제 풀러 가기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
