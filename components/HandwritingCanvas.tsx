"use client";

import React, { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { Sparkles, RefreshCcw, AlertCircle, Lightbulb, Loader2, Volume2, Search, PenTool } from 'lucide-react';

interface HandwritingCanvasProps {
  targetCharacter: string;
}

interface AIFeedback {
  score: number;
  comment: string;
  fix: string;
}

export default function HandwritingCanvas({ targetCharacter }: HandwritingCanvasProps) {
  const [activeTab, setActiveTab] = useState<'practice' | 'test'>('practice');
  
  // Ref cho Tab 1: HanziWriter (Luyện nét chuẩn)
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<any>(null);
  
  // Ref cho Tab 2: Bảng vẽ tự do (Tự kiểm tra)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [hasError, setHasError] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);

  // ==========================================
  // KHỞI TẠO HANZIWRITER (CHỈ DÙNG CHO TAB 1)
  // ==========================================
  useEffect(() => {
    if (!targetCharacter || !containerRef.current) return;
    
    // Nếu đang ở Tab 2, không cần nạp HanziWriter
    if (activeTab === 'test') return;

    setHasError(false);
    containerRef.current.innerHTML = '';

    try {
      writerRef.current = HanziWriter.create(containerRef.current, targetCharacter, {
        width: 250,
        height: 250,
        padding: 15,
        strokeAnimationSpeed: 2,
        delayBetweenStrokes: 150,
        showOutline: true, 
        strokeColor: '#3b82f6', 
        outlineColor: 'rgba(148, 163, 184, 0.2)',
        drawingWidth: 12, 
        drawingColor: '#94a3b8',
        onLoadCharDataError: (reason: any) => setHasError(true)
      });
      writerRef.current.quiz({ showOutline: true, leniency: 2.5 });
    } catch (err) {
      setHasError(true);
    }
  }, [targetCharacter, activeTab]);

  // ==========================================
  // KHỞI TẠO BẢNG VẼ TỰ DO (CHỈ DÙNG CHO TAB 2)
  // ==========================================
  useEffect(() => {
    if (activeTab === 'test' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 14; // Độ dày nét bút
        ctx.strokeStyle = '#3b82f6'; // Màu mực xanh
      }
    }
  }, [activeTab]);

  // Các hàm vẽ tự do
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Lấy tọa độ chuột hoặc ngón tay
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(clientX - rect.left, clientY - rect.top);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (ctx) {
      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  // ==========================================
  // CÁC HÀM ĐIỀU KHIỂN CHUNG
  // ==========================================
  const handleClear = () => {
    if (activeTab === 'practice') {
      writerRef.current?.quiz({ showOutline: true, leniency: 2.5 });
    } else {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setFeedback(null);
  };

  const handleAnimate = () => writerRef.current?.animateCharacter();

  // Chụp ảnh từ Bảng Vẽ Tự Do để nộp AI
  const getCanvasImageBase64 = async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error("Không tìm thấy bảng vẽ");
    
    // Tạo một canvas tạm thời để lót nền tối (tránh nền trong suốt AI không nhìn thấy nét)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      tempCtx.fillStyle = '#0f172a'; // Nền trùng với màu của giao diện
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      return tempCanvas.toDataURL('image/png');
    }
    return canvas.toDataURL('image/png');
  };

  const handleSubmit = async () => {
    setIsGrading(true);
    setFeedback(null);
    try {
      const imageBase64 = await getCanvasImageBase64();
      const response = await fetch('/api/grade-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, targetCharacter }),
      });
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      setFeedback({ score: 0, comment: "Lỗi kết nối", fix: "Hãy kiểm tra API Key." });
    } finally { 
      setIsGrading(false); 
    }
  };

  return (
    <div className="w-full max-w-[320px] mx-auto flex flex-col items-center">
      {/* THANH TAB ĐIỀU HƯỚNG */}
      <div className="flex bg-slate-800/50 p-1 rounded-2xl w-full mb-6 border border-slate-700/50 shadow-inner">
        <button
          onClick={() => { setActiveTab('practice'); handleClear(); }}
          className={`flex-1 py-2 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'practice' ? 'bg-slate-700 text-blue-400 shadow-md' : 'text-slate-400'
          }`}
        >
          <Search size={16} /> Tra cứu
        </button>
        <button
          onClick={() => { setActiveTab('test'); handleClear(); }}
          className={`flex-1 py-2 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'test' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          <PenTool size={16} /> Luyện viết
        </button>
      </div>

      {/* KHUNG HIỂN THỊ BẢNG VẼ */}
      <div className="w-[260px] h-[260px] rounded-[2rem] flex items-center justify-center relative overflow-hidden mb-6 shadow-2xl bg-slate-900 border border-slate-800">
        
        {/* TAB 1: Bảng của HanziWriter */}
        <div 
          ref={containerRef} 
          className={`absolute inset-0 flex items-center justify-center ${activeTab === 'practice' ? 'block' : 'hidden'}`}
        />

        {/* TAB 2: Bảng vẽ Tự do (Dùng HTML Canvas nguyên thủy) */}
        <canvas
          ref={canvasRef}
          width={260}
          height={260}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`absolute inset-0 cursor-crosshair touch-none ${activeTab === 'test' ? 'block' : 'hidden'} ${isGrading ? 'opacity-20' : 'opacity-100'}`}
        />

        {hasError && activeTab === 'practice' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">Chưa hỗ trợ nét vẽ.</p>
          </div>
        )}

        {isGrading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm pointer-events-none">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Đang phân tích...</span>
          </div>
        )}
      </div>

      {/* CÁC NÚT ĐIỀU KHIỂN */}
      <div className="flex gap-3 w-full">
        {activeTab === 'practice' ? (
          <>
            <button onClick={handleAnimate} className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-2xl text-[13px]">
              <Volume2 size={16} className="inline mr-2 text-blue-400" /> Phát Nét
            </button>
            <button onClick={handleClear} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-2xl text-[13px]">
              Luyện tập
            </button>
          </>
        ) : (
          <>
            <button onClick={handleClear} className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-2xl text-[13px]">
              <RefreshCcw size={16} className="inline mr-2" /> Xóa bảng
            </button>
            <button onClick={handleSubmit} disabled={isGrading} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl text-[13px] shadow-lg shadow-blue-900/20">
              <Sparkles size={16} className="inline mr-2" /> Nộp bài
            </button>
          </>
        )}
      </div>

      {/* HIỂN THỊ KẾT QUẢ AI */}
      {feedback && activeTab === 'test' && (
        <div className="mt-6 w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-5 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black text-white ${feedback.score >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              {feedback.score}
            </div>
            <h4 className="text-sm font-bold text-slate-200">Nhận xét từ AI</h4>
          </div>
          <p className="text-[13px] text-slate-300 mb-3 leading-relaxed italic">"{feedback.comment}"</p>
          <div className="text-[12px] text-amber-400 bg-amber-900/20 p-3 rounded-xl border border-amber-800/30">
            <span className="font-bold flex items-center gap-1 mb-1"><Lightbulb size={14}/> Bí kíp:</span>
            {feedback.fix}
          </div>
        </div>
      )}
    </div>
  );
}