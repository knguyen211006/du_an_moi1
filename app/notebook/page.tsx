"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Book, Check, BookOpen, Brain, Volume2, Loader2, Trash2, Search, Swords } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { supabase } from '@/lib/supabase/client';

interface Vocab {
  id: string;
  notebookId?: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  isMastered: boolean;
}

export default function NotebookPage() {
  const router = useRouter();
  const [words, setWords] = useState<Vocab[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'notLearned' | 'learned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Computed: count of words that need practice (not mastered)
  const wordsNeedingPractice = words.filter(w => !w.isMastered);

// Fetch words from Supabase notebook table
  useEffect(() => {
    const fetchNotebookWords = async (userId: string) => {
      try {
const { data, error } = await supabase
          .from('notebook')
          .select('id, hanzi, pinyin, meaning, is_mastered')
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching notebook:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          setWords(data.map((word) => ({
            id: word.id,
            notebookId: word.id,
            hanzi: word.hanzi,
            pinyin: word.pinyin,
            meaning: word.meaning,
            isMastered: word.is_mastered || false,
          })));
        }
      } catch (err) {
        console.error('Error fetching notebook words:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Use Firebase auth state listener to handle timing
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchNotebookWords(user.uid);
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

const masteredCount = words.filter((word) => word.isMastered).length;
  const learningCount = words.length - masteredCount;
  const stats = {
    total: words.length,
    mastered: masteredCount,
    learning: learningCount,
  };

const filteredWords = words.filter((word) => {
    // Filter by tab
    let matchesTab = true;
    if (activeFilter === 'all') matchesTab = true;
    else if (activeFilter === 'learned') matchesTab = word.isMastered;
    else if (activeFilter === 'notLearned') matchesTab = !word.isMastered;
    
    // Filter by search term (case-insensitive)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      word.hanzi.toLowerCase().includes(searchLower) || 
      word.pinyin.toLowerCase().includes(searchLower) || 
      word.meaning.toLowerCase().includes(searchLower);
    
    return matchesTab && matchesSearch;
  });

  const toggleMastered = async (wordId: string, currentStatus: boolean) => {
    try {
      // Update Supabase
      await supabase.from('notebook').update({ is_mastered: !currentStatus }).eq('id', wordId);
      
      // Immediately update local state
      setWords((prev) =>
        prev.map((word) => (word.id === wordId ? { ...word, isMastered: !currentStatus } : word))
      );
    } catch (err) {
      console.error('Error toggling mastered status:', err);
    }
  };

const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const removeWord = async (wordId: string) => {
    try {
      // Delete from Supabase
      await supabase.from('notebook').delete().eq('id', wordId);
      
      // Immediately update local state - filter out the deleted word
      setWords((prev) => prev.filter((word) => word.id !== wordId));
    } catch (err) {
      console.error('Error deleting word:', err);
    }
  };

  const filters = [
    { key: 'all' as const, label: 'Tất cả' },
    { key: 'notLearned' as const, label: 'Chưa thuộc' },
    { key: 'learned' as const, label: 'Đã thuộc' },
  ];

  return (
    <div className="min-h-screen bg-[#09060f] text-slate-100 py-8 px-4 lg:px-8 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/30">
              <Book className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent mb-2">
                Sổ Tay Tu Luyện
              </h1>
              <p className="text-xl text-slate-400 font-medium">Nơi lưu trữ những tinh hoa Hán ngữ ngài đã thu thập.</p>
            </div>
          </div>

{/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
            {[
              { label: 'Tổng số từ', value: stats.total, icon: BookOpen, color: 'cyan' },
              { label: 'Đã thuộc', value: stats.mastered, icon: Brain, color: 'emerald' },
              { label: 'Đang học', value: stats.learning, icon: Check, color: 'amber' },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div key={i} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all hover:scale-[1.02] shadow-2xl hover:shadow-[0_20px_40px_rgba(255,255,255,0.05)]">
                <Icon className={`w-12 h-12 text-${color}-400 mx-auto mb-4 opacity-75 group-hover:opacity-100 transition-all`} />
                <p className="text-3xl lg:text-4xl font-black text-white mb-1 text-center">{value.toLocaleString()}</p>
                <p className="text-sm text-slate-400 uppercase tracking-wider font-medium text-center">{label}</p>
              </div>
            ))}
          </div>
          
          {/* Practice CTA Button - Only show if there are words needing practice */}
          {wordsNeedingPractice.length > 0 && (
            <div className="max-w-2xl mx-auto mb-12">
              <button
                onClick={() => router.push('/notebook/review')}
                className="w-full py-4 px-8 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Swords size={24} />
                Luyện Tập Từ Sai
                <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
                  {wordsNeedingPractice.length} từ
                </span>
              </button>
            </div>
          )}
        </div>

{/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 justify-center mb-6 max-w-4xl mx-auto">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wider border-2 transition-all duration-300 ${
                activeFilter === key
                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.05] border-transparent'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-cyan-400/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap gap-3 justify-center mb-12 max-w-2xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm Hán tự, Pinyin, hoặc nghĩa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-100 placeholder-slate-500 font-medium focus:outline-none focus:border-cyan-500/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <p className="text-xl text-slate-400">Đang tải từ vựng...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && words.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400">
            <Brain className="w-20 h-20 mx-auto mb-6 opacity-50" />
            <p className="text-xl font-medium">Tàng kinh các còn trống, hãy thu thập từ vựng từ Lôi Đài!</p>
          </div>
        )}

{/* Flashcard Grid */}
        {!isLoading && words.length > 0 && (
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6`}>
{filteredWords.map((word) => (
              <div
                key={word.id}
                className={`group relative backdrop-blur-xl border rounded-3xl p-4 lg:p-6 min-h-[200px] flex flex-col justify-between shadow-2xl hover:shadow-[0_25px_50px_rgba(255,255,255,0.08)] hover:scale-[1.02] transition-all duration-300 overflow-hidden ${
                  word.isMastered
                    ? 'bg-white/[0.02] border-white/5 opacity-60'
                    : 'bg-white/5 border-white/10 hover:border-cyan-400/50'
                }`}
              >
{/* Audio Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(word.hanzi);
                  }}
                  className="absolute top-3 left-3 w-8 h-8 bg-white/10 hover:bg-cyan-500/20 border border-white/20 text-slate-300 hover:text-cyan-400 rounded-lg flex items-center justify-center shadow-lg hover:shadow-cyan-400/30 transition-all duration-300 hover:scale-105"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWord(word.id);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/10 hover:bg-red-500/20 border border-white/20 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Top Section: Hanzi + Pinyin */}
                <div className="flex-1 flex flex-col items-center justify-center pt-8 pb-2">
                  {/* Pinyin - smaller, positioned above */}
                  <p className="text-xs sm:text-sm text-cyan-300 font-medium mb-1 text-center leading-tight max-w-full truncate px-1">
                    {word.pinyin}
                  </p>
                  
                  {/* Hanzi - responsive sizing */}
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white drop-shadow-lg text-center leading-none">
                    {word.hanzi}
                  </div>
                </div>

                {/* Bottom Section: Meaning */}
                <p className="text-sm lg:text-base font-bold text-purple-300 text-center px-2 leading-tight mb-8">
                  {word.meaning}
                </p>

{/* Toggle Button */}
                <button
                  onClick={() => toggleMastered(word.id, word.isMastered)}
                  className={`absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
                    word.isMastered
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400 shadow-emerald-500/25 hover:shadow-emerald-500/40 border-2'
                      : 'bg-slate-500/20 border-slate-400/40 text-slate-400 shadow-slate-500/20 hover:shadow-slate-500/30 border-2 hover:border-cyan-400/50'
                  }`}
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

{!isLoading && words.length > 0 && filteredWords.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400">
            <Search className="w-20 h-20 mx-auto mb-6 opacity-50" />
            <p className="text-xl font-medium">
              {searchTerm 
                ? `Không tìm thấy linh tự nào phù hợp với "${searchTerm}"!` 
                : 'Không có từ vựng nào trong mục này...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
