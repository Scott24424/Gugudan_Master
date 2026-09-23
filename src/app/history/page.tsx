'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { fetchUserSessions, LearningSession } from '../../lib/api';

const categoryLabels: Record<string, { label: string; badgeClass: string }> = {
  gugudan: {
    label: '구구단',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  '2x1': {
    label: '두자리 × 한자리',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
  },
  '3x1': {
    label: '세자리 × 한자리',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  '2x2': {
    label: '두자리 × 두자리',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
  },
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }

    if (user) {
      let isMounted = true;
      fetchUserSessions(user.id)
        .then((data) => {
          if (isMounted) {
            setSessions(data);
            setDataLoading(false);
          }
        })
        .catch((err: unknown) => {
          console.error('Error fetching sessions:', err);
          if (isMounted) {
            setDataLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [user, authLoading, router]);

  if (authLoading || (user && dataLoading) || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-indigo-900 font-bold text-sm">
            {authLoading || !user ? '로그인 확인 중...' : '기록 불러오는 중...'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
      <div className="max-w-md mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sky-600 font-bold hover:underline text-lg transition-colors"
        >
          ← 메인으로 돌아가기
        </Link>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-indigo-900">🏆 내 학습 기록</h1>
          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
            총 {sessions.length}회 완료
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-lg border-2 border-indigo-50">
            <div className="text-5xl mb-4">🌱</div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">아직 학습 기록이 없어요!</h2>
            <p className="text-sm text-slate-500 mb-6">
              곱셈 문제를 풀고 멋진 마스터 기록을 남겨보세요.
            </p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95 text-sm"
            >
              지금 문제 풀러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const categoryConfig = categoryLabels[session.category] || {
                label: session.category,
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
              };
              const score =
                session.total_questions > 0
                  ? Math.round((session.correct_count / session.total_questions) * 100)
                  : 0;
              const isPerfect = score === 100;

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-50 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${categoryConfig.badgeClass}`}
                      >
                        {categoryConfig.label}
                      </span>
                      {isPerfect && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          💯 만점!
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      {formatDate(session.created_at)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-lg font-black ${
                        isPerfect ? 'text-amber-500' : 'text-slate-800'
                      }`}
                    >
                      {score}점
                    </div>
                    <div className="text-xs font-bold text-orange-500">
                      +{session.earned_exp} EXP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
