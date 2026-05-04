"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HSKContextType {
  selectedLevel: number | null;
  setSelectedLevel: (level: number | null) => void;
}

const HSKContext = createContext<HSKContextType | undefined>(undefined);

export function HSKProvider({ children }: { children: ReactNode }) {
  const [selectedLevel, setSelectedLevelState] = useState<number | null>(null);

  const setSelectedLevel = (level: number | null) => {
    setSelectedLevelState(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hsk_level', level?.toString() || '');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hsk_level');
      if (saved) {
        setSelectedLevelState(parseInt(saved, 10));
      }
    }
  }, []);

  return (
    <HSKContext.Provider value={{ selectedLevel, setSelectedLevel }}>
      {children}
    </HSKContext.Provider>
  );
}

export const useHSK = () => {
  const context = useContext(HSKContext);
  if (context === undefined) {
    throw new Error('useHSK must be used within HSKProvider');
  }


  // --- THÊM ĐOẠN NÀY ĐỂ ĐẾM THỜI GIAN HỌC TOÀN APP ---
  useEffect(() => {
    // Mỗi 1 giây (1000ms) sẽ cộng thêm 1 giây vào localStorage
    const timer = setInterval(() => {
      const saved = localStorage.getItem('hsk_progress');
      let data = saved ? JSON.parse(saved) : { totalWords: 0, correctAnswers: 0, totalQuestions: 0, timeSpent: 0 };
      
      // Đảm bảo timeSpent tồn tại
      if (typeof data.timeSpent !== 'number') data.timeSpent = 0;
      
      data.timeSpent += 1; // Cộng 1 giây
      localStorage.setItem('hsk_progress', JSON.stringify(data));
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  // --- KẾT THÚC ĐOẠN THÊM ---
  return context;
};


