"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Volume2, PenTool, BookOpen } from 'lucide-react'; 
import HandwritingCanvas from '@/components/HandwritingCanvas';
import vocabData from '@/data/hsk_words_viet.json';

interface HanziData {
  hanzi: string;
  pinyin: string;
  meaning: string;
  level: number | string | any;
}

const FALLBACK_DATA: HanziData = {
  hanzi: '',
  pinyin: 'Đang nạp...',
  meaning: 'Chưa có dữ liệu nghĩa cho từ này.',
  level: 1
};

export default function HanziDetail() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<HanziData>(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState(true);

  // Pháp thuật phát âm
  const handleSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      alert("Trình duyệt của Đại sư không hỗ trợ phát âm.");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!params.id) return;
    const decodedId = decodeURIComponent(params.id as string);
    
    setIsLoading(true);
    
    const foundWord = (vocabData as any[]).find((w) => 
      (w.hanzi === decodedId) || (w.simplified === decodedId)
    );

    if (foundWord) {
      let pinyin = foundWord.pinyin || "";
      if (Array.isArray(pinyin)) pinyin = pinyin.join(" ");
      
      let meaning = foundWord.meaning || foundWord.meanings?.[0] || "";
      if (Array.isArray(meaning)) meaning = meaning[0];
      meaning = String(meaning).split(';')[0].trim();
      
      setData({
        hanzi: foundWord.hanzi || foundWord.simplified || decodedId,
        pinyin: pinyin,
        meaning: meaning,
        level: foundWord.level || 1
      });
    } else {
      setData({ ...FALLBACK_DATA, hanzi: decodedId });
    }
    
    setIsLoading(false);
  }, [params.id]);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 lg:px-8 font-sans transition-colors duration-500 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto flex flex-col h-full">
        
        {/* NÚT QUAY LẠI */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-xl shadow-sm hover:bg-muted hover:text-primary transition-all text-muted-foreground font-bold tracking-wide"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Sảnh Luyện Chữ
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-bold tracking-widest uppercase text-sm">Đang mài mực...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center w-full">
            
            {/* TRỤ CỘT TRÁI: LÝ THUYẾT (CHIẾM 1 NỬA) */}
            <div className="flex-1 bg-card/40 backdrop-blur-sm rounded-[3rem] border border-border shadow-xl relative overflow-hidden flex flex-col justify-center p-10 lg:p-16 min-h-[500px]">
              
              {/* Trang trí background: Khung lưới mờ ảo */}
              <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
              
              {/* Badge Cấp độ */}
              <div className="absolute top-10 left-10">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <BookOpen size={14} className="text-primary" />
                  <span className="text-[10px] font-black text-primary tracking-widest uppercase">
                    HSK {data.level}
                  </span>
                </div>
              </div>

              <div className="text-center z-10">
                <h1 className="text-[10rem] lg:text-[14rem] font-black text-foreground mb-4 tracking-tighter leading-none drop-shadow-2xl">
                  {data.hanzi}
                </h1>
                
                <div className="flex items-center justify-center gap-4 mb-8">
                  <div className="px-8 py-3 bg-muted/80 border border-border rounded-2xl shadow-inner">
                    <p className="text-3xl lg:text-4xl font-bold text-primary tracking-[0.3em] font-mono lowercase">
                      {data.pinyin}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleSpeech(data.hanzi)}
                    className="p-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-7 h-7" />
                  </button>
                </div>

                <div className="inline-block px-8 py-4 bg-background/50 border border-border rounded-2xl">
                  <p className="text-xl lg:text-2xl text-muted-foreground font-medium leading-relaxed">
                    {data.meaning}
                  </p>
                </div>
              </div>
            </div>

            {/* TRỤ CỘT PHẢI: THỰC HÀNH (CHIẾM 1 NỬA) */}
            <div className="flex-1 bg-card/80 border border-border rounded-[3rem] shadow-xl p-8 lg:p-12 flex flex-col items-center justify-center relative">
              
              <div className="absolute top-10 right-10 opacity-10">
                <PenTool size={100} />
              </div>

              <div className="text-center mb-8 z-10">
                <h2 className="text-2xl font-black text-foreground flex items-center justify-center gap-3 uppercase tracking-widest">
                  Thực Hành Kẻ Nét
                </h2>
                <p className="text-xs text-muted-foreground mt-2 uppercase tracking-[0.2em]">
                  Chữ: <span className="text-primary font-bold text-base">{data.hanzi}</span>
                </p>
              </div>
              
              {/* Wrapper bọc Canvas để tạo cảm giác chìm vào giao diện */}
              <div className="relative z-10 bg-background p-4 rounded-[2.5rem] border border-border shadow-inner w-full max-w-[450px] mx-auto flex items-center justify-center">
                <div className="w-full h-full flex justify-center items-center rounded-3xl overflow-hidden ring-1 ring-primary/10">
                  <HandwritingCanvas targetCharacter={data.hanzi ? data.hanzi[0] : ''} />
                </div>
              </div>
              
            </div>

          </div>
        )}
      </div>
    </div>
  );
}