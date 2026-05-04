"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Bookmark, BookmarkCheck, Play, RotateCcw, Info } from "lucide-react";
import vocabData from "@/data/hsk_words_viet.json";

export default function DisciplineFlashcard() {
  const [index, setIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false); // Trạng thái màn hình nhắc nhở

  const cards = vocabData.slice(0, 1000);
  const currentCard = cards[index];

  // Hàm chuyển từ tiếp theo kèm logic kiểm tra mốc 21
  const nextCard = useCallback(() => {
    // Nếu từ hiện tại là mốc 21 (21, 42, 63...)
    if ((index + 1) % 21 === 0 && !showMilestone) {
      setShowMilestone(true);
      return;
    }
    
    setShowMeaning(false);
    setIsSaved(false);
    setShowMilestone(false);
    setIndex((prev) => (prev + 1) % cards.length);
  }, [index, cards.length, showMilestone]);

  const prevCard = useCallback(() => {
    setShowMilestone(false);
    setShowMeaning(false);
    setIsSaved(false);
    setIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  }, [cards.length]);

  const handleRestart = () => {
    setIndex(0);
    setShowMilestone(false);
    setShowMeaning(false);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showMilestone) return; // Vô hiệu hóa lật thẻ khi đang ở màn hình nhắc nhở

    if (e.code === "Space") {
      e.preventDefault(); 
      setShowMeaning((prev) => !prev);
    } else if (e.code === "ArrowRight") {
      nextCard();
    } else if (e.code === "ArrowLeft") {
      prevCard();
    }
  }, [nextCard, prevCard, showMilestone]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!currentCard) return <div className="min-h-screen flex items-center justify-center">Đang chuẩn bị thảo dược...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 select-none font-sans transition-colors duration-500 overflow-hidden">
      
      {/* 1. KHU VỰC THẺ CHÍNH / MÀN HÌNH NHẮC NHỞ */}
      <div 
        className={`
          relative w-full max-w-4xl min-h-[520px] rounded-[3rem] transition-all duration-500
          flex flex-col items-center justify-center p-12 text-center
          bg-card border-2 border-border shadow-lg z-10
          ${!showMilestone ? "cursor-pointer active:scale-[0.99]" : ""}
        `}
        onClick={() => !showMilestone && setShowMeaning(!showMeaning)}
      >
        
        {!showMilestone ? (
          /* NỘI DUNG FLASHCARD */
          <>
            <div className="absolute top-8 left-10">
              <span className="text-xs font-bold tracking-[0.3em] text-emerald-600/70 dark:text-emerald-400/50 uppercase">
                HSK_LEVEL_{currentCard.level}
              </span>
            </div>

            <button 
              onClick={handleSave}
              className="absolute top-7 right-8 p-3 rounded-full hover:bg-muted transition-colors"
            >
              {isSaved ? (
                <BookmarkCheck size={28} className="text-emerald-500 fill-emerald-500" />
              ) : (
                <Bookmark size={28} className="text-foreground/20" />
              )}
            </button>

            <h1 className="text-[11rem] md:text-[13rem] font-black leading-none text-foreground/90">
              {currentCard.hanzi}
            </h1>
            
            <div className={`w-full flex flex-col items-center transition-all duration-500 ${showMeaning ? "opacity-100 mt-8" : "opacity-0 h-0 overflow-hidden"}`}>
              <div className="space-y-2">
                <p className="text-4xl font-semibold text-emerald-700 dark:text-emerald-400 tracking-widest">{currentCard.pinyin}</p>
                <h2 className="text-5xl font-bold text-foreground/80 capitalize">{currentCard.meaning}</h2>
              </div>
              {currentCard.example && (
                <div className="mt-8 p-6 bg-muted/20 rounded-[2rem] w-full max-w-2xl border border-border/50">
                  <p className="text-xl text-foreground/70 font-serif italic">"{currentCard.example}"</p>
                  <p className="text-base text-foreground/50 mt-2">{currentCard.exampleTranslation}</p>
                </div>
              )}
            </div>
            {!showMeaning && (
              <p className="absolute bottom-10 text-foreground/20 font-bold tracking-[0.2em] text-[10px] uppercase">
                [ NHẤN PHÍM CÁCH ĐỂ LẬT THẺ ]
              </p>
            )}
          </>
        ) : (
          /* MÀN HÌNH NHẮC NHỞ SAU 21 TỪ */
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-6">
              <Info size={40} />
            </div>
            <h2 className="text-4xl font-black text-foreground mb-4">Mốc tu luyện 21 từ!</h2>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed mb-10">
              Đại sư đã lướt qua <span className="text-emerald-600 dark:text-emerald-400 font-bold">21 từ vựng</span>. Đừng vội đi tiếp, hãy dừng lại một chút để ôn kỹ các từ vừa rồi để nhớ lâu hơn nhé!
            </p>
            
            <div className="flex gap-6 w-full max-w-md">
              <button 
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-border font-bold hover:bg-muted transition-all"
              >
                <RotateCcw size={20} /> Trở lại từ đầu
              </button>
              <button 
                onClick={() => { setShowMilestone(false); setIndex(index + 1); }}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Play size={20} /> Học tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. ĐIỀU KHIỂN & LỜI KHUYÊN */}
      {!showMilestone && (
        <div className="mt-12 w-full max-w-lg space-y-10 z-10">
          <div className="flex justify-between items-center px-4">
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={prevCard}>
               <kbd className="px-5 py-2.5 rounded-xl bg-card border border-border text-foreground/60 font-bold shadow-sm transition-all group-hover:bg-primary group-hover:text-primary-foreground">←</kbd>
               <span className="text-[10px] font-bold text-muted-foreground uppercase">Trước</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setShowMeaning(!showMeaning)}>
               <kbd className="px-12 py-2.5 rounded-xl bg-card border border-border text-foreground/60 font-bold shadow-sm transition-all group-hover:bg-primary group-hover:text-primary-foreground uppercase">Phím Cách</kbd>
               <span className="text-[10px] font-bold text-muted-foreground uppercase">Hiện nghĩa</span>
            </div>
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={nextCard}>
               <kbd className="px-5 py-2.5 rounded-xl bg-card border border-border text-foreground/60 font-bold shadow-sm transition-all group-hover:bg-primary group-hover:text-primary-foreground">→</kbd>
               <span className="text-[10px] font-bold text-muted-foreground uppercase">Sau</span>
            </div>
          </div>

          <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 text-center">
            <p className="text-sm text-emerald-800/70 dark:text-emerald-400/70 leading-relaxed font-medium">
              🌿 <span className="font-bold uppercase tracking-tight">Lời khuyên y tế:</span> Hãy sử dụng <span className="text-emerald-600 dark:text-emerald-300 font-bold">Chế độ tối</span> khi học vào ban đêm để giảm ánh sáng xanh, bảo vệ mắt.
            </p>
          </div>
        </div>
      )}

      {/* Số thứ tự mờ ảo phía sau */}
      <div className="absolute bottom-10 right-12 hidden lg:block select-none pointer-events-none">
        <span className="text-[140px] font-black text-foreground/[0.03] leading-none">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

    </div>
  );
}