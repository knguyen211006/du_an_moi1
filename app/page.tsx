'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Swords, Library, Sparkles, Target, Zap } from "lucide-react";

// ============================================================
// 🎨 WUXIA/GLASSMORPHIC LANDING PAGE - HÁN TỰ ĐẠI SƯ
// ============================================================

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a10] text-slate-100 overflow-hidden relative">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-[200px]" />
      </div>

      {/* Hero Section - Centered */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated Badge */}
          <div 
            className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-8 bg-white/5 backdrop-blur-md border border-white/10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <span className="text-amber-400">⚔️</span>
            <span className="text-sm font-medium text-slate-300">Võ Đạo Tu Luyện</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
          </div>

          {/* Main Title - Massive Glowing Headline */}
          <h1 className={`font-extrabold mb-6 transition-all duration-1000 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="block text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-purple-500 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)] font-serif">
              Hán Tự Đại Sư
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-gray-400 text-xl md:text-2xl mb-12 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Đột phá cảnh giới Hán ngữ với phương pháp luyện công hiện đại.
          </p>

          {/* CTA Button - Pulsating Glassmorphic */}
          <div className={`transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link 
              href="/roadmap"
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold text-xl shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/50 transition-all transform hover:scale-105 active:scale-95"
            >
              <span className="text-2xl group-hover:animate-bounce">🔥</span>
              <span>Khởi Hành</span>
              <Zap className="w-5 h-5 group-hover:animate-pulse" />
              {/* Pulsating Ring Effect */}
              <span className="absolute inset-0 rounded-2xl animate-ping opacity-30 bg-cyan-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - 3 Columns */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Phòng Luyện Công - Huyễn Ảnh Trận */}
          <div className="group bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 hover:border-cyan-500/30 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)] transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Huyễn Ảnh Trận</h3>
            <p className="text-slate-400">Học từ vựng qua thẻ lật 3D và truyền âm nhập mật (TTS).</p>
            <Sparkles className="w-5 h-5 text-cyan-500/50 mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 2: Lôi Đài Trắc Nghiệm */}
          <div className="group bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Swords className="w-7 h-7 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Lôi Đài Sát Hạch</h3>
            <p className="text-slate-400">Kiểm tra thực chiến, tự động ghi chép lỗi sai vào Sổ thù hận.</p>
            <Target className="w-5 h-5 text-violet-500/50 mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Card 3: Tàng Kinh Các */}
          <div className="group bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 hover:border-purple-500/30 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Library className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Tàng Kinh Các</h3>
            <p className="text-slate-400">Lưu trữ tinh hoa, tra cứu nhanh chóng mọi lúc mọi nơi.</p>
            <Library className="w-5 h-5 text-purple-500/50 mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            &copy; Nguyễn Khôi Nguyên - Hán Tự Đại Sư 2024.
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Đột phá cảnh giới · Tu luyện Hán ngữ · Trở thành Đại Sư
          </p>
        </div>
      </footer>
    </div>
  );
}
