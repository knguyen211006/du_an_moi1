"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHSK } from '@/components/HSKContext';
import { Square, Crown } from 'lucide-react';

const levels = [
  { number: 1, color: 'from-red-500 to-orange-500', bg: 'bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30', text: 'Cơ Bản' },
  { number: 2, color: 'from-orange-500 to-yellow-500', bg: 'bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30', text: 'Sơ Cấp' },
  { number: 3, color: 'from-yellow-500 to-emerald-500', bg: 'bg-gradient-to-r from-yellow-100 to-emerald-100 dark:from-yellow-900/30 dark:to-emerald-900/30', text: 'Trung Cấp 1' },
  { number: 4, color: 'from-emerald-500 to-blue-500', bg: 'bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30', text: 'Trung Cấp 2' },
  { number: 5, color: 'from-blue-500 to-indigo-500', bg: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30', text: 'Cao Cấp 1' },
  { number: 6, color: 'from-indigo-500 to-purple-500', bg: 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30', text: 'Cao Cấp 2' },
];

export default function LevelsPage() {
  const { setSelectedLevel } = useHSK();
  const router = useRouter();

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
    router.push('/quiz');
  };

  return (
    <div className="min-h-screen py-24 px-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-gray-900 to-slate-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-6">
            Linh Tháp HSK
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Chọn cấp độ tu luyện phù hợp với căn cơ của bạn. Mỗi tầng là một cảnh giới mới.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {levels.map((level) => (
            <button
              key={level.number}
              onClick={() => handleLevelSelect(level.number)}
              className={`group relative h-80 rounded-3xl p-12 text-center overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl shadow-xl border-4 border-transparent hover:border-current hover:shadow-purple-500/20 ${level.bg} ${level.color}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-6">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-white/20 transition-all ${level.color}`}>
                  <Square className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
                <div>
                  <div className="text-6xl font-black text-white mb-4 drop-shadow-lg">
                    HSK {level.number}
                  </div>
                  <div className="text-2xl font-bold text-white/90">
                    {level.text}
                  </div>
                </div>
                <Crown className="w-12 h-12 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-bounce" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

