import QuizScreen from '../components/QuizScreen';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 py-10 px-4">
      <h1 className="text-4xl font-black text-center text-indigo-900 mb-2 drop-shadow-sm">신나는 구구단 마스터</h1>
      <p className="text-center text-slate-500 mb-8 font-medium">문제를 맞히고 몬스터를 키워보자!</p>
      <QuizScreen />
    </main>
  );
}
