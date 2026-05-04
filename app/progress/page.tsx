'use client';

import { useState, useEffect } from 'react';
import { Trophy, Target, Flame, BookOpen, Award, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProgressPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalWords: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    timeSpent: 0 // Thêm trường đếm thời gian
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hsk_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      setStats({
        totalWords: parsed.totalWords || 0,
        correctAnswers: parsed.correctAnswers || 0,
        totalQuestions: parsed.totalQuestions || 0,
        timeSpent: parsed.timeSpent || 0 // Mặc định là 0 nếu chưa có
      });
    }
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center dark:text-white">Đang mở Bảng Phong Thần...</div>;

  const accuracy = stats.totalQuestions > 0 
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
    : 0;

  // Thuật pháp quy đổi thời gian
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) return <>{h} <span className="text-xl text-slate-400 font-semibold">giờ</span> {m} <span className="text-xl text-slate-400 font-semibold">phút</span></>;
    if (m > 0) return <>{m} <span className="text-xl text-slate-400 font-semibold">phút</span> {s} <span className="text-xl text-slate-400 font-semibold">giây</span></>;
    return <>{s} <span className="text-xl text-slate-400 font-semibold">giây</span></>;
  };

  let rankName = "Tân Thủ Bập Bẹ";
  let rankColor = "from-slate-400 to-slate-500";
  let RankIcon = BookOpen;

  if (stats.correctAnswers >= 50) {
    rankName = "Đại Sư HSK";
    rankColor = "from-amber-400 to-orange-500";
    RankIcon = Trophy;
  } else if (stats.correctAnswers >= 20) {
    rankName = "Cao Thủ Làng Ngôn Ngữ";
    rankColor = "from-emerald-400 to-teal-500";
    RankIcon = Award;
  } else if (stats.correctAnswers >= 5) {
    rankName = "Học Giả Chăm Chỉ";
    rankColor = "from-indigo-400 to-purple-500";
    RankIcon = Flame;
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-md mb-4">
            Bảng Phong Thần
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Thống kê thành tựu tu luyện HSK của ngài
          </p>
        </div>

        <div className={`relative overflow-hidden bg-gradient-to-br ${rankColor} rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-8 transform transition-transform hover:scale-[1.01]`}>
          <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white/10">
            <RankIcon size={250} />
          </div>
          
          <div className="relative z-10 text-center md:text-left">
            <p className="text-white/80 font-bold uppercase tracking-widest text-sm mb-2">Danh Hiệu Hiện Tại</p>
            <h2 className="text-4xl md:text-5xl font-black drop-shadow-md mb-2">{rankName}</h2>
            <p className="text-white/90 font-medium text-lg">Đã chinh phục đúng {stats.correctAnswers} câu hỏi.</p>
          </div>

          <div className="relative z-10 flex-shrink-0 bg-white/20 p-6 rounded-full backdrop-blur-md border border-white/30 shadow-inner">
            <RankIcon size={64} className="text-white drop-shadow-lg" />
          </div>
        </div>

        {/* CÁC CHỈ SỐ CHI TIẾT (Đã chia làm 4 cột) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Thời gian học */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="bg-sky-100 dark:bg-sky-900/50 p-4 rounded-full mb-4 text-sky-500 group-hover:scale-110 transition-transform">
              <Clock size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Thời gian học</p>
            <div className="text-3xl font-black text-slate-800 dark:text-white">
              {formatTime(stats.timeSpent)}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-full mb-4 text-emerald-500 group-hover:scale-110 transition-transform">
              <Target size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Độ chính xác</p>
            <div className="text-4xl font-black text-slate-800 dark:text-white">
              {accuracy}<span className="text-2xl text-emerald-500">%</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Đã khiêu chiến</p>
            <div className="text-4xl font-black text-slate-800 dark:text-white">
              {stats.totalQuestions} <span className="text-xl text-slate-400 font-semibold">câu</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center group hover:-translate-y-2 transition-all duration-300">
            <div className="bg-orange-100 dark:bg-orange-900/50 p-4 rounded-full mb-4 text-orange-500 group-hover:scale-110 transition-transform">
              <Flame size={32} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Đáp án đúng</p>
            <div className="text-4xl font-black text-slate-800 dark:text-white">
              {stats.correctAnswers} <span className="text-xl text-slate-400 font-semibold">câu</span>
            </div>
          </div>

        </div>

        <div className="text-center">
          <button 
            onClick={() => router.push('/quiz')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg"
          >
            Tiếp tục khiêu chiến thôi các con vợ <ArrowRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}