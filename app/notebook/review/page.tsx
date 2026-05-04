"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Volume2, Loader2, Trophy, RotateCcw, Zap, VolumeX } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { supabase } from "@/lib/supabase/client";
import { getWrongWordsForPractice, recordCorrectAnswer, recordIncorrectAnswer, NotebookWord } from "@/lib/supabase/notebook";

// Type for quiz options
interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export default function NotebookReviewPage() {
  const router = useRouter();
  const [words, setWords] = useState<NotebookWord[]>([]);
  const [options, setOptions] = useState<QuizOption[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shakeOption, setShakeOption] = useState<string | null>(null);

  // Fetch words on mount
  useEffect(() => {
    const fetchWords = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const wrongWords = await getWrongWordsForPractice(currentUser.uid, 20);
        // Shuffle the words
        const shuffled = [...wrongWords].sort(() => Math.random() - 0.5);
        setWords(shuffled);
      } catch (err) {
        console.error("Error fetching practice words:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWords();
  }, [router]);

  // Fetch distractors and set options when moving to a new word
  const loadOptionsForWord = useCallback(async (word: NotebookWord) => {
    setIsOptionsLoading(true);
    setSelectedOption(null);
    setShowResult(false);
    setShakeOption(null);

    try {
      // Fetch 3 random distractors from words table
      const randomOffset = Math.floor(Math.random() * 5000);
      const { data: distractors, error } = await supabase
        .from('words')
        .select('id, hanzi, pinyin, meaning')
        .neq('hanzi', word.hanzi) // Exclude the correct word
        .range(randomOffset, randomOffset + 4); // Get 5, then filter to 3

      if (error) {
        console.error("Error fetching distractors:", error);
        // Fallback: just use the correct answer
        setOptions([
          { id: word.id, text: word.meaning, isCorrect: true }
        ]);
        setIsOptionsLoading(false);
        return;
      }

      // Filter to get 3 unique distractors (different from correct answer)
      const filteredDistractors = (distractors || [])
        .filter(d => d.meaning !== word.meaning)
        .slice(0, 3);

      // Create options array with correct answer + distractors
      const allOptions: QuizOption[] = [
        { id: word.id, text: word.meaning, isCorrect: true },
        ...filteredDistractors.map(d => ({
          id: d.id,
          text: d.meaning,
          isCorrect: false
        }))
      ];

      // Shuffle the options
      const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
      setOptions(shuffled);
    } catch (err) {
      console.error("Error in loadOptionsForWord:", err);
    } finally {
      setIsOptionsLoading(false);
    }
  }, []);

  // Load options when index changes
  useEffect(() => {
    if (words.length > 0 && currentIndex < words.length) {
      loadOptionsForWord(words[currentIndex]);
    }
  }, [currentIndex, words, loadOptionsForWord]);

  const currentWord = words[currentIndex];

const handleOptionClick = async (option: QuizOption) => {
    if (showResult || isOptionsLoading) return;

    setSelectedOption(option.id);
    setShowResult(true);

    if (option.isCorrect) {
      // Correct answer
      await recordCorrectAnswer(currentWord!.id);
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
      
      // Play success sound (optional)
      playSound(true);
      
      // Don't auto-advance - wait for user to click "Tiếp Tục"
    } else {
      // Wrong answer
      setShakeOption(option.id);
      await recordIncorrectAnswer(currentWord!.id);
      setScore((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
      
      // Play error sound (optional)
      playSound(false);
      
      // Don't auto-advance - wait for user to click "Tiếp Tục"
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setGameState("finished");
    }
  };

  const playSound = (isCorrect: boolean) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Simple feedback tone using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (isCorrect) {
          oscillator.frequency.value = 880; // High pitch for correct
        } else {
          oscillator.frequency.value = 220; // Low pitch for wrong
        }
        
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) {
        // Audio not supported, ignore
      }
    }
  };

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setGameState("finished");
    }
  };

  const restartPractice = () => {
    setCurrentIndex(0);
    setGameState("playing");
    setScore({ correct: 0, incorrect: 0 });
    // Reshuffle words
    setWords((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09060f] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Empty state
  if (words.length === 0 && gameState === "playing") {
    return (
      <div className="min-h-screen bg-[#09060f] text-slate-100 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-4">Xuất Sắc!</h1>
          <p className="text-lg text-slate-400 mb-8">
            Bạn không có từ nào cần luyện tập. Hãy tiếp tục học thêm từ mới!
          </p>
          <button
            onClick={() => router.push("/notebook")}
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition-all"
          >
            Quay về Sổ Tay
          </button>
        </div>
      </div>
    );
  }

  // Finished state
  if (gameState === "finished") {
    const total = score.correct + score.incorrect;
    const percentage = total > 0 ? Math.round((score.correct / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-[#09060f] text-slate-100 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Luyện Tập Hoàn Tất!</h1>
          <p className="text-xl text-slate-400 mb-8">
            {percentage >= 80
              ? "Xuất sắc! Bạn đã nắm vững hầu hết các từ!"
              : percentage >= 50
              ? "Tốt lắm! Tiếp tục cố gắng nhé!"
              : "Đừng nản lòng, hãy luyện tập thêm!"}
          </p>

          {/* Results */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-4xl font-black text-emerald-400">{score.correct}</p>
              <p className="text-sm text-slate-400 uppercase">Đúng</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-4xl font-black text-white">{total}</p>
              <p className="text-sm text-slate-400 uppercase">Tổng</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-4xl font-black text-red-400">{score.incorrect}</p>
              <p className="text-sm text-slate-400 uppercase">Sai</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={restartPractice}
              className="flex items-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition-all"
            >
              <RotateCcw size={20} />
              Luyện Lại
            </button>
            <button
              onClick={() => router.push("/notebook")}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all"
            >
              Quay về Sổ Tay
            </button>
          </div>
        </div>
      </div>
    );
  }

// Playing state
  return (
    <div className="min-h-screen bg-[#09060f] text-slate-100 py-8 px-4 lg:px-8">
      {/* Header with Exit button */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/notebook")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Quay về</span>
          </button>
          <button
            onClick={() => router.push("/notebook")}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all text-sm"
          >
            ✕ Thoát
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-400">
            Câu {currentIndex + 1} / {words.length}
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <Check size={16} />
              {score.correct}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <X size={16} />
              {score.incorrect}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Quiz Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
          {/* Hanzi Display */}
          <div className="text-center mb-8">
            <p className="text-2xl text-cyan-300 font-medium mb-2">
              {currentWord?.pinyin}
            </p>
            <div className="text-6xl md:text-8xl font-serif font-bold text-white mb-4">
              {currentWord?.hanzi}
            </div>
            <p className="text-sm text-slate-500">Chọn đáp án đúng:</p>
          </div>

          {/* Options */}
          {isOptionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {options.map((option) => {
                const isSelected = selectedOption === option.id;
                const isCorrectAnswer = option.isCorrect;
                const showCorrect = showResult && isCorrectAnswer;
                const showWrong = showResult && isSelected && !isCorrectAnswer;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionClick(option)}
                    disabled={showResult}
                    className={`
                      p-4 rounded-xl font-bold text-base transition-all transform
                      ${!showResult ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'}
                      ${isSelected && isCorrectAnswer 
                        ? 'bg-emerald-500/30 border-2 border-emerald-500 text-emerald-400' 
                        : isSelected && !isCorrectAnswer
                        ? 'bg-red-500/30 border-2 border-red-500 text-red-400'
                        : showCorrect
                        ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300'
                        : showWrong
                        ? 'bg-red-500/20 border-2 border-red-500/50 text-red-300 animate-shake'
                        : 'bg-white/5 border-2 border-white/10 text-slate-200 hover:bg-white/10 hover:border-cyan-400/30'
                      }
                      ${shakeOption === option.id ? 'animate-shake' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.text}</span>
                      {showCorrect && <Check className="w-5 h-5" />}
                      {showWrong && <X className="w-5 h-5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Next Question Button - Shows after answering */}
        {showResult && (
          <button
            onClick={handleNextQuestion}
            className="w-full mt-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {currentIndex < words.length - 1 ? (
              <>
                Tiếp Tục ➔
              </>
            ) : (
              <>
                Hoàn Thành ✨
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
