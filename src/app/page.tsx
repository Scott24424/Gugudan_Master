'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import QuizScreen from '../components/QuizScreen';

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-indigo-900 font-bold text-sm">로딩 중...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (category) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
        <div className="max-w-md mx-auto mb-4">
          <button onClick={() => setCategory(null)} className="text-sky-600 font-bold hover:underline text-lg">
            ← 뒤로 가기
          </button>
        </div>
        <QuizScreen category={category} />
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
        <button className="text-indigo-600 font-bold hover:underline text-lg">
          🏆 내 성취도 보러가기
        </button>
      </div>
    </main>
  );
}
