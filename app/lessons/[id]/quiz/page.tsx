"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Swords,
  RotateCcw,
  Loader2,
  Volume2,
  VolumeX,
  BookOpen,
  Target,
  TrendingUp,
  Home,
  Scroll,
  Flame
} from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { supabase } from "@/lib/supabase/client";
import { generateQuizQuestions } from "@/lib/supabase/quizService";
import { addWordToNotebook } from "@/lib/supabase/notebook";

// Enhanced quiz question type with word_id for notebook integration
interface QuizQuestion {
  id: number;
  word_id?: string;
  hanzi: string;
  pinyin: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

// ===== Sound Utility =====
function playDingSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    // Pleasant major chord arpeggio: C5 -> E5 -> G5
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(523.25, now);
    oscillator.frequency.setValueAtTime(659.25, now + 0.08);
    oscillator.frequency.setValueAtTime(783.99, now + 0.16);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } catch (e) {
    console.error("Sound play failed:", e);
  }
}

// ===== Shuffle utility =====
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

// ===== Main Component =====
export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  // === Core Quiz State ===
  const [resolvedParams, setResolvedParams] = useState<{ id: string }>({ id: "1" });
  const [quizData, setQuizData] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // === Animation States ===
  const [isCorrectAnimation, setIsCorrectAnimation] = useState(false);
  const [isWrongAnimation, setIsWrongAnimation] = useState(false);

  // === Wrong Answer Tracking (Sổ Thù Hận) ===
  const [wrongAnswers, setWrongAnswers] = useState<QuizQuestion[]>([]);
  const [notebookSaveStatus, setNotebookSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // === Sound Settings ===
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("soundEnabled");
      return saved === null ? true : saved === "true";
    }
    return true;
  });

  // === Persist score for reliable database save ===
  const [scoreForSave, setScoreForSave] = useState(0);

  // Resolve params on mount
  useEffect(() => {
    params.then((resolved) => setResolvedParams(resolved));
  }, [params]);

  // Fetch quiz questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questions = await generateQuizQuestions(10);
        setQuizData(questions);
      } catch (error) {
        console.error("Error fetching quiz questions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("soundEnabled", String(next));
      return next;
    });
  }, []);

  // Early return for loading
  if (isLoading || quizData.length === 0) {
    return (
      <div className="min-h-screen bg-[#09060f] text-slate-100 pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <p className="mt-4 text-lg text-slate-300">Đang tụ khí triệu hồi từ vựng...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = quizData.length;
  const currentQ = quizData[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Save score to Supabase
  const saveScoreToDatabase = async (finalScore: number) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("No user logged in, skipping save to database");
      return;
    }

    const lessonId = resolvedParams.id || "1";
    
    // 🔥 TÂM PHÁP ĐÃ ĐƯỢC VÁ LỖI: Nhân 100 điểm để khớp với Công Lực trên giao diện
    const expEarned = finalScore * 100;

    try {
      await supabase.from("profiles").upsert({
        id: currentUser.uid,
        display_name: currentUser.displayName || "Learner",
      });

      const { error } = await supabase.from("quiz_results").insert({
        user_id: currentUser.uid,
        lesson_id: lessonId,
        score: expEarned, // Đã nạp điểm sau khi nhân 100
        total_questions: totalQuestions,
      });

      if (error) {
        console.error("Error saving quiz score:", error);
      }
    } catch (err) {
      console.error("Error in saveScoreToDatabase:", err);
    }
  };

  // Auto-save wrong answer to notebook (Sổ Thù Hận)
  const saveWrongAnswerToNotebook = async (word: QuizQuestion) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setNotebookSaveStatus("saving");
    try {
      const success = await addWordToNotebook(currentUser.uid, {
        hanzi: word.hanzi,
        pinyin: word.pinyin,
        meaning: word.correctAnswer,
        wordId: word.word_id || word.hanzi,
      }, true);
      setNotebookSaveStatus(success ? "saved" : "error");
    } catch (err) {
      console.error("Error saving to notebook:", err);
      setNotebookSaveStatus("error");
    }
  };

  const handleSelect = (option: string) => {
    if (hasSubmitted) return;
    setSelectedOption(option);
  };

  const handleAction = () => {
    if (!hasSubmitted) {
      // SUBMIT
      setHasSubmitted(true);
      const isCorrect = selectedOption === currentQ.correctAnswer;

      if (isCorrect) {
        setScore((prev) => {
          const newScore = prev + 1;
          setScoreForSave(newScore);
          return newScore;
        });
        setIsCorrectAnimation(true);
        setTimeout(() => setIsCorrectAnimation(false), 800);
        if (isSoundEnabled) playDingSound();
      } else {
        // Record wrong answer
        setWrongAnswers((prev) => [...prev, currentQ]);
        setIsWrongAnimation(true);
        setTimeout(() => setIsWrongAnimation(false), 800);
        // Auto-save to notebook
        saveWrongAnswerToNotebook(currentQ);
      }
    } else {
      // NEXT
      if (isLastQuestion) {
        saveScoreToDatabase(scoreForSave);
        setIsFinished(true);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedOption(null);
        setHasSubmitted(false);
        setIsCorrectAnimation(false);
        setIsWrongAnimation(false);
        setNotebookSaveStatus("idle");
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setScoreForSave(0);
    setIsFinished(false);
    setHasSubmitted(false);
    setSelectedOption(null);
    setWrongAnswers([]);
    setIsCorrectAnimation(false);
    setIsWrongAnimation(false);
    setNotebookSaveStatus("idle");
  };

  // ==================== RENDER: RESULT PAGE ====================
  if (isFinished) {
    const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const totalPoints = score * 100;

    return (
      <div className="min-h-screen bg-[#09060f] text-slate-100 pt-24 pb-12 px-4 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px]" />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center min-h-[calc(100vh-8rem)] space-y-8 animate-fade-in">
          {/* Header */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 tracking-widest text-center">
            Thắng Bại Tại Kỹ Năng
          </h1>

          {/* Score Card */}
          <div className="w-full max-w-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 shadow-2xl text-center">
            <div className="text-6xl md:text-7xl font-serif font-black text-neutral-200 mb-2">
              <span className="text-amber-500">{score}</span>
              <span className="text-slate-500 mx-2">/</span>
              <span>{totalQuestions}</span>
            </div>
            <p className="text-lg text-slate-300 font-semibold tracking-wide mb-6">
              Công lực đạt được
            </p>
            <Zap className="w-16 h-16 mx-auto text-amber-400 animate-pulse fill-amber-400" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
            {/* Accuracy Ring */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center">
              <Target className="w-6 h-6 text-cyan-400 mb-3" />
              <div className="relative w-24 h-24 mb-3">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/10"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-cyan-400 transition-all duration-1000 ease-out"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - accuracy / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{accuracy}%</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-400">Tỷ lệ Chính xác</span>
            </div>

            {/* Total Points */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400 mb-3" />
              <div className="text-4xl font-bold text-white mb-2">{totalPoints}</div>
              <span className="text-sm font-semibold text-slate-400">Tổng Công Lực</span>
            </div>
          </div>

          {/* Wrong Answers - Sổ Thù Hận */}
          {wrongAnswers.length > 0 && (
            <div className="w-full max-w-lg bg-gradient-to-br from-red-500/10 to-orange-500/5 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 text-red-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-bold text-lg">Những chiêu thức cần luyện lại</h3>
                <span className="ml-auto text-xs bg-red-500/20 px-2 py-1 rounded-full">
                  {wrongAnswers.length}
                </span>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {wrongAnswers.map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-red-500/30 transition-all"
                  >
                    <div>
                      <div className="text-xl font-medium text-white">{word.hanzi}</div>
                      <div className="text-sm text-slate-400">{word.pinyin}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400 font-semibold">{word.correctAnswer}</div>
                      <div className="text-xs text-slate-500">Đã lưu vào Sổ Thù Hận</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Perfect Score Message */}
          {wrongAnswers.length === 0 && (
            <div className="w-full max-w-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 text-center">
              <Flame className="w-10 h-10 text-orange-400 mx-auto mb-3 animate-pulse" />
              <h3 className="text-xl font-bold text-green-400 mb-2">Hoàn hảo!</h3>
              <p className="text-slate-300">Ngươi đã thông thạo tất cả chiêu thức. Tiếp tục luyện công!</p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="w-full max-w-lg space-y-4">
            <Link
              href="/roadmap"
              className="w-full py-4 px-8 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Home size={20} />
              Về Lộ Trình
            </Link>

            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-2xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm font-bold text-lg"
            >
              <RotateCcw size={20} />
              Luyện lại từ đầu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: QUIZ UI ====================
  return (
    <div className="min-h-screen bg-[#09060f] text-slate-100 pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Screen Flash Red Overlay - triggers on wrong answer */}
      {isWrongAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-screen-flash-red" />
      )}
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />

      <div className="max-w-4xl mx-auto relative z-10 flex flex-col min-h-[calc(100vh-8rem)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <Link
            href={`/lessons/${resolvedParams.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-300 hover:text-cyan-400 text-sm font-medium"
          >
            <X size={16} />
            <span className="hidden sm:inline">Rời Lôi Đài</span>
          </Link>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
              <span className="tracking-widest">
                CÂU HỎI {currentQuestionIndex + 1}/{totalQuestions}
              </span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(6,182,212,0.4)] animate-progress-glow"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-400 hover:text-cyan-400"
              title={isSoundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
            >
              {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Score */}
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 font-bold text-sm shadow-lg shadow-amber-500/10">
              <Zap size={16} className="fill-amber-400" />
              <span className="hidden sm:inline">Công lực:</span> {score}
            </div>
          </div>
        </div>

        {/* Main Arena */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto space-y-6">
          {/* Question Card */}
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 text-white font-bold mb-6">
              {currentQuestionIndex + 1}
            </div>
            <h2 className="text-sm font-bold text-slate-400 tracking-widest mb-6 uppercase">
              Chọn đáp án đúng
            </h2>
            <div className="flex items-center justify-center gap-4 text-3xl sm:text-4xl font-medium leading-[4rem] text-white">
              <ruby>
                {currentQ.hanzi}
                <rt>{currentQ.pinyin}</rt>
              </ruby>
            </div>
            <span className="text-xl text-slate-300">{currentQ.question}</span>
          </div>

          {/* Options Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((option, index) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let optionStyle = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30 text-slate-300";
              let labelStyle = "bg-white/10 text-slate-400";
              let animationClass = "";

              if (hasSubmitted) {
                if (isCorrect) {
                  optionStyle = "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                  labelStyle = "bg-green-500/20 text-green-400";
                  // Highlight correct answer even if not selected
                  animationClass = "animate-correct-pulse";
                } else if (isSelected) {
                  optionStyle = "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                  labelStyle = "bg-red-500/20 text-red-400";
                  animationClass = "animate-shake animate-wrong-pulse";
                } else {
                  optionStyle = "bg-white/5 border-white/5 text-slate-500 opacity-50 cursor-not-allowed";
                }
              } else if (isSelected) {
                optionStyle = "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]";
                labelStyle = "bg-cyan-500/20 text-cyan-400";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelect(option)}
                  disabled={hasSubmitted}
                  className={`relative flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left w-full group ${optionStyle} ${animationClass}`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mr-4 transition-colors ${labelStyle}`}
                  >
                    {OPTION_LABELS[index]}
                  </div>
                  <span className="font-semibold text-lg">{option}</span>

                  {/* Feedback Icons */}
                  {hasSubmitted && isCorrect && (
                    <CheckCircle2 className="absolute right-4 text-green-400" size={24} />
                  )}
                  {hasSubmitted && isSelected && !isCorrect && (
                    <XCircle className="absolute right-4 text-red-400" size={24} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {hasSubmitted && (
            <div
              className={`w-full p-6 rounded-2xl border animate-fade-in ${
                selectedOption === currentQ.correctAnswer
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <h3
                className={`font-bold mb-2 flex items-center gap-2 ${
                  selectedOption === currentQ.correctAnswer ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {selectedOption === currentQ.correctAnswer ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                {selectedOption === currentQ.correctAnswer
                  ? "Tuyệt vời! Đáp án chính xác."
                  : "Rất tiếc! Đáp án chưa chuẩn."}
              </h3>
              <p className="text-slate-300">
                {currentQ.hanzi} ({currentQ.pinyin}) = <strong>{currentQ.correctAnswer}</strong>
              </p>

              {/* Notebook Save Status */}
              {selectedOption !== currentQ.correctAnswer && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <BookOpen size={16} className="text-amber-400" />
                  {notebookSaveStatus === "saving" && (
                    <span className="text-amber-400">Đang khắc vào Sổ Thù Hận...</span>
                  )}
                  {notebookSaveStatus === "saved" && (
                    <span className="text-green-400">Đã khắc vào Sổ Thù Hận!</span>
                  )}
                  {notebookSaveStatus === "error" && (
                    <span className="text-red-400">Lỗi lưu Sổ Thù Hận</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleAction}
            disabled={!selectedOption && !hasSubmitted}
            className={`w-full py-4 mt-8 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              !selectedOption && !hasSubmitted
                ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                : hasSubmitted
                  ? "bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  : "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]"
            }`}
          >
            {!hasSubmitted ? (
              <>
                <Swords size={20} />
                Xuất Chiêu
              </>
            ) : isLastQuestion ? (
              <>
                <Zap size={20} />
                Xem Kết Quả
              </>
            ) : (
              <>
                Tiếp Tục
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}