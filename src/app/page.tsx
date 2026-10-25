'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCharacterStageInfo } from '../utils/gamification';
import QuizScreen from '../components/QuizScreen';
import VerticalQuizScreen from '../components/VerticalQuizScreen';
import GugudanTableModal from '../components/GugudanTableModal';

export default function Home() {
  const router = useRouter();
  const { user, loading, profile, signOut } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-indigo-900 font-bold text-sm">
            {loading ? '로딩 중...' : '로그인 화면으로 이동 중...'}
          </p>
        </div>
      </main>
    );
  }

  const level = profile?.level ?? 1;
  const exp = profile?.exp ?? 0;
  const stageInfo = getCharacterStageInfo(level);

  if (category) {
    if (category === 'gugudan') {
      return (
        <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
          <div className="max-w-md mx-auto mb-4">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className="text-sky-600 font-bold hover:underline text-lg"
            >
              ← 뒤로 가기
            </button>
          </div>
          <QuizScreen category={category} onBack={() => setCategory(null)} />
        </main>
      );
    }

    return (
      <VerticalQuizScreen
        category={category as '2x1' | '3x1' | '2x2'}
        onBack={() => setCategory(null)}
      />
    );
  }

  const categories = [
    {
      id: 'gugudan',
      label: '구구단',
      subLabel: '단별 연습 · 빈칸 채우기 · +10 EXP/문제',
      color: 'bg-orange-400',
      shadow: 'shadow-[0_8px_0_0_#c2410c]',
      hoverShadow: 'hover:shadow-[0_4px_0_0_#c2410c]',
    },
    {
      id: '2x1',
      label: '두자리 × 한자리',
      subLabel: '교과서 세로셈 · 올림수 연습 · +20 EXP/문제',
      color: 'bg-green-400',
      shadow: 'shadow-[0_8px_0_0_#15803d]',
      hoverShadow: 'hover:shadow-[0_4px_0_0_#15803d]',
    },
    {
      id: '3x1',
      label: '세자리 × 한자리',
      subLabel: '교과서 세로셈 · 자릿수 확장 · +30 EXP/문제',
      color: 'bg-blue-400',
      shadow: 'shadow-[0_8px_0_0_#1d4ed8]',
      hoverShadow: 'hover:shadow-[0_4px_0_0_#1d4ed8]',
    },
    {
      id: '2x2',
      label: '두자리 × 두자리',
      subLabel: '1·2단 부분곱과 세로 덧셈 · +40 EXP/문제',
      color: 'bg-purple-400',
      shadow: 'shadow-[0_8px_0_0_#6b21a8]',
      hoverShadow: 'hover:shadow-[0_4px_0_0_#6b21a8]',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
      {/* Top Bar with User Info & Logout */}
      <div className="max-w-md mx-auto flex items-center justify-between mb-4 px-2">
        <div className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
          👤 {user.email}
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-xs text-slate-500 hover:text-rose-600 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* Character Level and EXP Progress Bar Header */}
      <div className="max-w-md mx-auto mb-6 p-5 bg-white rounded-3xl shadow-lg border-2 border-indigo-100">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Level {level}
            </span>
            <div className="text-base font-black text-slate-800 mt-1">{stageInfo.name}</div>
            {stageInfo.nextEvolutionLevel && (
              <div className="text-[11px] font-bold text-slate-400">
                Lv.{stageInfo.nextEvolutionLevel}에 다음 진화!
              </div>
            )}
          </div>
          <div className="text-5xl select-none">{stageInfo.emoji}</div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold block">경험치</span>
            <span className="text-sm font-bold text-orange-500">
              EXP {exp} / {level * 100}
            </span>
          </div>
        </div>

        {/* EXP Progress Bar */}
        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, (exp / (level * 100)) * 100))}%` }}
          />
        </div>
      </div>

      <h1 className="text-4xl font-black text-center text-indigo-900 mb-2 drop-shadow-sm">
        신나는 구구단 마스터
      </h1>
      <p className="text-center text-slate-500 mb-6 font-medium">어떤 곱셈을 마스터해 볼까?</p>

      {/* Quick Study Modal Trigger */}
      <div className="max-w-md mx-auto mb-5">
        <button
          type="button"
          onClick={() => setIsTableModalOpen(true)}
          className="w-full bg-white hover:bg-indigo-50 text-indigo-700 font-black py-3 px-4 rounded-2xl border-2 border-indigo-200 shadow-sm flex items-center justify-center gap-2 transition"
        >
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span>📖 구구단 원리 & 암기 표 먼저 보기</span>
        </button>
      </div>

      <div className="max-w-md mx-auto grid grid-cols-1 gap-5">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`${c.color} text-white py-5 px-6 rounded-3xl ${c.shadow} hover:translate-y-1 ${c.hoverShadow} transition-all active:shadow-none active:translate-y-2 text-center`}
          >
            <div className="text-2xl font-black">{c.label}</div>
            <div className="text-xs font-bold text-white/90 mt-1">{c.subLabel}</div>
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto mt-10 text-center">
        <Link
          href="/history"
          className="text-indigo-600 font-bold hover:underline text-lg inline-block transition-colors"
        >
          🏆 내 성취도 보러가기
        </Link>
      </div>

      <GugudanTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />
    </main>
  );
}
