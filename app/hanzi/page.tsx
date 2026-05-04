"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Search, PenTool } from 'lucide-react';
import vocabData from '@/data/hsk_words_viet.json';

export default function HandwritingIndexPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWords = (vocabData as any[])
    .filter((w) => {
      if (!searchTerm) return w.level === 1 || String(w.level) === "1"; 
      
      const hanzi = w.hanzi || w.simplified || "";
      let pinyin = w.pinyin || "";
      if (Array.isArray(pinyin)) pinyin = pinyin.join(" ");
      
      const matchHanzi = hanzi.includes(searchTerm);
      const matchPinyin = pinyin.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchHanzi || matchPinyin;
    })
    .slice(0, 60);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 font-sans transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
            <PenTool size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
            Luyện Viết Chữ Hán
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nhập chữ Hán hoặc Pinyin vào ô bên dưới để bắt đầu luyện nét. Mặc định hệ thống sẽ hiển thị các chữ Hán thuộc cấp độ HSK 1.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-16 relative">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="text-muted-foreground" size={24} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm chữ Hán hoặc Pinyin (VD: ni, wo, hao...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-card border-2 border-border rounded-full text-lg focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        {filteredWords.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredWords.map((item, index) => {
              const hanzi = item.hanzi || item.simplified;
              let pinyin = item.pinyin || "";
              if (Array.isArray(pinyin)) pinyin = pinyin.join(" ");

              return (
                <Link
                  key={`${hanzi}-${index}`}
                  href={`/hanzi/${encodeURIComponent(hanzi)}`}
                  className="group flex flex-col items-center justify-center p-8 bg-card border-2 border-border rounded-[2rem] hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-2"
                >
                  <span className="text-5xl font-black mb-4 text-foreground group-hover:text-primary transition-colors">
                    {hanzi}
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] bg-muted group-hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors">
                    {pinyin}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🔍</span>
            <p className="text-2xl font-bold text-muted-foreground tracking-tight">
              Không tìm thấy chữ Hán nào phù hợp!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

