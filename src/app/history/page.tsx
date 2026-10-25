'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserSessions, LearningSession } from '../../lib/api';
import { analyzeLearningSessions } from '../../utils/resultHelper';

const categoryLabels: Record<string, { label: string; badgeClass: string; barColor: string }> = {
  gugudan: {
    label: '구구단',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    barColor: 'bg-orange-400',
  },
  '2x1': {
    label: '두자리 × 한자리',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    barColor: 'bg-green-500',
  },
  '3x1': {
    label: '세자리 × 한자리',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    barColor: 'bg-blue-500',
  },
  '2x2': {
    label: '두자리 × 두자리',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    barColor: 'bg-purple-500',
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const analytics = useMemo(() => analyzeLearningSessions(sessions), [sessions]);

  const filteredSessions = useMemo(() => {
    if (selectedCategory === 'all') return sessions;
    return sessions.filter((s) => s.category === selectedCategory);
  }, [sessions, selectedCategory]);

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
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-3xl font-black text-indigo-900">🏆 내 학습 기록</h1>
          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
            총 {sessions.length}회 완료
          </span>
        </div>

        {/* Analytics Summary Cards & Mastery Breakdown */}
        {sessions.length > 0 && (
          <div className="space-y-4 mb-6">
            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-indigo-50">
                <div className="text-xs font-bold text-slate-400">평균 정답률</div>
                <div className="text-2xl font-black text-indigo-700 mt-0.5">
                  {analytics.averageAccuracy}%
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-indigo-50">
                <div className="text-xs font-bold text-slate-400">💯 만점 달성</div>
                <div className="text-2xl font-black text-amber-500 mt-0.5">
                  {analytics.perfectSessions}회
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-indigo-50">
                <div className="text-xs font-bold text-slate-400">누적 획득 경험치</div>
                <div className="text-2xl font-black text-orange-500 mt-0.5">
                  +{analytics.totalEarnedExp} EXP
                </div>
              </div>
              <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-indigo-50">
                <div className="text-xs font-bold text-slate-400">완료한 학습 세션</div>
                <div className="text-2xl font-black text-slate-800 mt-0.5">
                  {analytics.totalSessions}회
                </div>
              </div>
            </div>

            {/* Coaching Recommendation Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl p-4 shadow-md flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div className="text-xs font-bold leading-relaxed">
                {analytics.recommendationMessage}
              </div>
            </div>

            {/* Category Mastery Progress Bars */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-50 space-y-3">
              <div className="text-xs font-black text-slate-700">영역별 성취도 분석</div>
              {(['gugudan', '2x1', '3x1', '2x2'] as const).map((catKey) => {
                const stat = analytics.byCategory[catKey];
                const meta = categoryLabels[catKey];
                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{meta.label}</span>
                      <span className="text-slate-500">
                        {stat.sessionCount > 0
                          ? `${stat.accuracy}% (${stat.sessionCount}회 · 만점 ${stat.perfectCount}회)`
                          : '미도전'}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${stat.accuracy}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: '전체' },
                { id: 'gugudan', label: '구구단' },
                { id: '2x1', label: '두자리×한자리' },
                { id: '3x1', label: '세자리×한자리' },
                { id: '2x2', label: '두자리×두자리' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                    selectedCategory === tab.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
            {filteredSessions.map((session) => {
              const categoryConfig = categoryLabels[session.category] || {
                label: session.category,
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                barColor: 'bg-slate-400',
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
                      {formatDate(session.created_at)} · {session.total_questions}문제 중{' '}
                      {session.correct_count}개 정답
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
