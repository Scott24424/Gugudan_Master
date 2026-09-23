'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getCharacterStage } from '../utils/gamification';
import QuizScreen from '../components/QuizScreen';

export default function Home() {
  const router = useRouter();
  const { user, loading, profile, signOut } = useAuth();
  const [category, setCategory] = useState<string | null>(null);

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
  const stage = getCharacterStage(level);
  const stageEmojis: Record<string, string> = {
    egg: '🥚',
    baby_monster: '🐣',
    cool_monster: '🦕',
    dragon: '🐉',
  };

  if (category) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
        <div className="max-w-md mx-auto mb-4">
          <button onClick={() => setCategory(null)} className="text-sky-600 font-bold hover:underline text-lg">
            ← 뒤로 가기
          </button>
        </div>
        <QuizScreen category={category} onBack={() => setCategory(null)} />
      </main>
    );
  }

  const categories = [
    { id: 'gugudan', label: '구구단', color: 'bg-orange-400', shadow: 'shadow-[0_8px_0_0_#c2410c]', hoverShadow: 'hover:shadow-[0_4px_0_0_#c2410c]' },
    { id: '2x1', label: '두자리 × 한자리', color: 'bg-green-400', shadow: 'shadow-[0_8px_0_0_#15803d]', hoverShadow: 'hover:shadow-[0_4px_0_0_#15803d]' },
    { id: '3x1', label: '세자리 × 한자리', color: 'bg-blue-400', shadow: 'shadow-[0_8px_0_0_#1d4ed8]', hoverShadow: 'hover:shadow-[0_4px_0_0_#1d4ed8]' },
    { id: '2x2', label: '두자리 × 두자리', color: 'bg-purple-400', shadow: 'shadow-[0_8px_0_0_#6b21a8]', hoverShadow: 'hover:shadow-[0_4px_0_0_#6b21a8]' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
      {/* Top Bar with User Info & Logout */}
      <div className="max-w-md mx-auto flex items-center justify-between mb-4 px-2">
        <div className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
          👤 {user.email}
        </div>
        <button
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
            <div className="text-base font-black text-slate-800 mt-1">내 캐릭터</div>
          </div>
          <div className="text-5xl select-none">{stageEmojis[stage] || '🥚'}</div>
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

      <h1 className="text-4xl font-black text-center text-indigo-900 mb-2 drop-shadow-sm">신나는 구구단 마스터</h1>
      <p className="text-center text-slate-500 mb-10 font-medium">어떤 곱셈을 마스터해 볼까?</p>
      
      <div className="max-w-md mx-auto grid grid-cols-1 gap-6">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`${c.color} text-white text-2xl font-black py-6 rounded-3xl ${c.shadow} hover:translate-y-1 ${c.hoverShadow} transition-all active:shadow-none active:translate-y-2`}
          >
            {c.label}
          </button>
        ))}
      </div>
      
      <div className="max-w-md mx-auto mt-12 text-center">
        <Link
          href="/history"
          className="text-indigo-600 font-bold hover:underline text-lg inline-block transition-colors"
        >
          🏆 내 성취도 보러가기
        </Link>
      </div>
    </main>
  );
}
