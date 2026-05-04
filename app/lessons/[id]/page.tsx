"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Swords, ChevronLeft, ChevronRight, Check, Volume2, Square } from "lucide-react";
import { MOCK_HANZI_DATA } from '@/lib/mockHanziData';
import Flashcard from '@/components/ui/Flashcard';

// TTS function to pronounce a word
const speakWord = (text: string) => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }
};

// Extract full Hanzi text from reading passage
const READING_HANZI = "北京的早餐很好吃。我们早上喜欢去小店喝豆浆，包子和油条。这里的食物非常便宜，而且味道很好。";
const READING_TRANSLATION = "Bữa sáng ở Bắc Kinh rất ngon. Chúng tôi thích đi uống sữa đậu nành và ăn bánh bao, quẩy tại cửa hàng nhỏ vào buổi sáng. Thức ăn ở đây rất rẻ và ngon.";

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranslationFlipped, setIsTranslationFlipped] = useState(false);
  const vocabulary = MOCK_HANZI_DATA.slice(0, 10);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // TTS function to read the entire reading passage
  const playReading = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // If already playing, stop it
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(READING_HANZI);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set playing state
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    }
  }, [isPlaying]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const isLastCard = currentIndex === vocabulary.length - 1;

  // Auto-play logic using useEffect
  useEffect(() => {
    if (isAutoPlaying && currentIndex < vocabulary.length) {
      // Speak the current word
      speakWord(vocabulary[currentIndex].hanzi);
      
      // Schedule next word after delay
      autoPlayTimerRef.current = setTimeout(() => {
        if (currentIndex < vocabulary.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
        } else {
          // Reached end, stop auto-play
          setIsAutoPlaying(false);
        }
      }, 3000);
    }

    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isAutoPlaying, currentIndex, vocabulary.length]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Stop auto-play when user manually navigates
  const handleManualPrev = () => {
    setIsAutoPlaying(false);
    handlePrev();
  };

  const handleManualNext = () => {
    setIsAutoPlaying(false);
    handleNext();
  };

  // Calculate progress
  const progressPercent = ((currentIndex + 1) / vocabulary.length) * 100;

  return (
    <div className="min-h-screen bg-[#09060f] text-slate-100 py-8 px-4 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="mb-10">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all text-slate-300 hover:text-cyan-400 font-medium tracking-wide group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Quay lại Trang Chủ
            </Link>
          </div>

          <h1 className="text-3xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Bữa sáng ở Bắc Kinh - 北京的早餐
          </h1>

          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center px-4 py-1.5 bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold tracking-wide">
              HSK 2
            </span>
            <span className="inline-flex items-center px-4 py-1.5 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-full text-amber-400 text-sm font-bold tracking-wide">
              180 từ
            </span>
            <span className="inline-flex items-center px-4 py-1.5 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full text-purple-400 text-sm font-bold tracking-wide">
              Độ khó: Dễ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Auto-Play Audio Player */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4">
              <button
                onClick={toggleAutoPlay}
                className="flex items-center justify-center w-12 h-12 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-full transition-all active:scale-95"
              >
                {isAutoPlaying ? <Pause className="w-5 h-5 text-cyan-400" /> : <Play className="w-5 h-5 text-cyan-400 ml-0.5" />}
              </button>
              <div className="flex-1">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-slate-400 font-mono">
                {currentIndex + 1} / {vocabulary.length}
              </span>
            </div>

            {/* Flashcard Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 lg:p-12">
              <h2 className="text-lg font-bold text-slate-200 tracking-wide mb-6 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-cyan-500 rounded-full" />
                Thẻ từ vựng
              </h2>
              
              {/* Card counter */}
              <div className="text-center mb-4">
                <span className="text-sm text-slate-400">
                  {currentIndex + 1} / {vocabulary.length}
                </span>
              </div>

              {/* Flashcard - key forces remount to reset isFlipped state when index changes */}
              <Flashcard
                key={currentIndex}
                hanzi={vocabulary[currentIndex].hanzi}
                pinyin={vocabulary[currentIndex].pinyin}
                meaning={vocabulary[currentIndex].meaning}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={handleManualPrev}
                  disabled={currentIndex === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    currentIndex === 0
                      ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 hover:border-cyan-500/30'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Lùi lại
                </button>

                <button
                  onClick={handleManualNext}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                    isLastCard
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}
                >
                  {isLastCard ? (
                    <>
                      <Check className="w-5 h-5" />
                      Hoàn Thành
                    </>
                  ) : (
                    <>
                      Tiếp theo
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Reading Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 lg:p-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-200 tracking-wide flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-cyan-500 rounded-full" />
                  Bài đọc
                </h2>
                {/* TTS Play/Stop Button */}
                <button
                  onClick={playReading}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'bg-red-500/20 border border-red-500/50 animate-pulse shadow-lg shadow-red-500/30'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/30'
                  }`}
                  title={isPlaying ? 'Dừng đọc' : 'Đọc toàn bài'}
                >
                  {isPlaying ? (
                    <Square className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-10">
                <p className="text-2xl lg:text-3xl text-slate-100 leading-[3rem] lg:leading-[3.5rem] font-medium">
                  <ruby>北<rt>běi</rt></ruby><ruby>京<rt>jīng</rt></ruby><ruby>的<rt>de</rt></ruby><ruby>早<rt>zǎo</rt></ruby><ruby>餐<rt>cān</rt></ruby><ruby>很<rt>hěn</rt></ruby><ruby>好<rt>hǎo</rt></ruby><ruby>吃<rt>chī</rt></ruby>。
                  <ruby>我<rt>wǒ</rt></ruby><ruby>们<rt>men</rt></ruby><ruby>早<rt>zǎo</rt></ruby><ruby>上<rt>shang</rt></ruby><ruby>喜<rt>xǐ</rt></ruby><ruby>欢<rt>huan</rt></ruby><ruby>去<rt>qù</rt></ruby><ruby>小<rt>xiǎo</rt></ruby><ruby>店<rt>diàn</rt></ruby><ruby>喝<rt>hē</rt></ruby><ruby>豆<rt>dòu</rt></ruby><ruby>浆<rt>jiāng</rt></ruby>，
                  <ruby>吃<rt>chī</rt></ruby><ruby>包<rt>bāo</rt></ruby><ruby>子<rt>zi</rt></ruby><ruby>和<rt>hé</rt></ruby><ruby>油<rt>yóu</rt></ruby><ruby>条<rt>tiáo</rt></ruby>。
                  <ruby>这<rt>zhè</rt></ruby><ruby>里<rt>lǐ</rt></ruby><ruby>的<rt>de</rt></ruby><ruby>食<rt>shí</rt></ruby><ruby>物<rt>wù</rt></ruby><ruby>非<rt>fēi</rt></ruby><ruby>常<rt>cháng</rt></ruby><ruby>便<rt>pián</rt></ruby><ruby>宜<rt>yí</rt></ruby>，
                  <ruby>而<rt>ér</rt></ruby><ruby>且<rt>qiě</rt></ruby><ruby>味<rt>wèi</rt></ruby><ruby>道<rt>dào</rt></ruby><ruby>很<rt>hěn</rt></ruby><ruby>好<rt>hǎo</rt></ruby>。
                </p>
              </div>

              {/* Translation Flip Card */}
              <div 
                className="mt-6 perspective-1000 cursor-pointer"
                onClick={() => setIsTranslationFlipped(!isTranslationFlipped)}
              >
                <div 
                  className={`relative w-full h-48 transition-transform duration-500 preserve-3d ${isTranslationFlipped ? 'rotate-y-180' : ''}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div 
                    className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="text-center">
                      <span className="text-lg text-slate-300 font-medium">✨ Lật để xem bài dịch</span>
                    </div>
                  </div>
                  
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-md border border-cyan-400/30 rounded-2xl flex items-center justify-center p-6"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)' 
                    }}
                  >
                    <p className="text-lg md:text-xl text-slate-100 text-center leading-relaxed p-2 font-medium drop-shadow-lg">
                      {READING_TRANSLATION}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-200 tracking-wide mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
                  Từ vựng quan trọng
                </h3>
                <div className="overflow-y-auto max-h-[400px] space-y-3 pr-2">
                  {vocabulary.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setCurrentIndex(i); setIsFlipped(false); }}
                      className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 transition-all cursor-pointer ${i === currentIndex ? 'border-l-4 border-cyan-400 bg-slate-800' : 'border-l-4 border-transparent hover:bg-white/10 hover:border-cyan-500/20'}`}
                    >
                      <div className="text-lg font-bold text-slate-100 mb-1">{item.hanzi}</div>
                      <div className="text-sm text-cyan-400 font-medium mb-0.5">{item.pinyin}</div>
                      <div className="text-sm text-slate-400">{item.meaning}</div>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/quiz/${params.id}`}
                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Swords className="w-5 h-5" />
                Hoàn thành & Thi Trắc Nghiệm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}