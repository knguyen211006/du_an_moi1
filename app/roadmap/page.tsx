"use client";

import { useState, useEffect } from "react";
import { Sprout, Droplet, Zap, Flame, Star, Crown, Lock, CheckCircle2, Loader2, Target } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { supabase } from "@/lib/supabase/client";

const ROADMAP_DATA = [
  { id: 1, level: "HSK 1", name: "Sơ Nhập Môn", status: "completed", progress: 100, icon: Sprout },
  { id: 2, level: "HSK 2", name: "Luyện Khí Kỳ", status: "in-progress", progress: 60, icon: Droplet },
  { id: 3, level: "HSK 3", name: "Trúc Cơ Kỳ", status: "locked", progress: 0, icon: Zap },
  { id: 4, level: "HSK 4", name: "Kim Đan Kỳ", status: "locked", progress: 0, icon: Flame },
  { id: 5, level: "HSK 5", name: "Nguyên Anh Kỳ", status: "locked", progress: 0, icon: Star },
  { id: 6, level: "HSK 6", name: "Hóa Thần Kỳ", status: "locked", progress: 0, icon: Crown },
];

export default function RoadmapPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalPower, setTotalPower] = useState(0);
  const [battlesWon, setBattlesWon] = useState(0);
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: quizResults, error } = await supabase
          .from('quiz_results')
          .select('score, total_questions')
          .eq('user_id', currentUser.uid);

        if (error) {
          console.error('Error fetching quiz results:', error);
          setIsLoading(false);
          return;
        }

        if (quizResults && quizResults.length > 0) {
          const totalScore = quizResults.reduce((sum, r) => sum + r.score, 0);
          const totalQuestions = quizResults.reduce((sum, r) => sum + r.total_questions, 0);
          const accuracyRate = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;

          setTotalPower(totalScore);
          setBattlesWon(quizResults.length);
          setAccuracy(Math.round(accuracyRate));
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#09060f] text-slate-100 py-20 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
          Lộ Trình Tu Luyện
        </h1>
        <p className="text-slate-400 text-lg">Hành trình đột phá cảnh giới Hán ngữ.</p>
      </div>

      {/* Stats Header - Dashboard */}
      <div className="max-w-5xl mx-auto mb-20 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            <span className="text-slate-400">Đang triệu hồi sức mạnh...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Power Card */}
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-amber-500/20">
                  <Zap className="w-8 h-8 text-amber-400" />
                </div>
                <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">Tổng Công Lực</span>
              </div>
              <div className="text-5xl md:text-6xl font-black text-white">{totalPower}</div>
              <div className="text-slate-400 mt-2">Điểm tích lũy</div>
            </div>

            {/* Battles Won Card */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-cyan-500/20">
                  <Sprout className="w-8 h-8 text-cyan-400" />
                </div>
                <span className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Số Trận Đã Đánh</span>
              </div>
              <div className="text-5xl md:text-6xl font-black text-white">{battlesWon}</div>
              <div className="text-slate-400 mt-2">Trận đã hoàn thành</div>
            </div>

            {/* Accuracy Card */}
            <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/10 backdrop-blur-xl border border-green-500/30 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-green-500/20">
                  <Target className="w-8 h-8 text-green-400" />
                </div>
                <span className="text-sm font-bold text-green-400 uppercase tracking-widest">Tỷ Lệ Chính Xác</span>
              </div>
              <div className="text-5xl md:text-6xl font-black text-white">{accuracy}%</div>
              <div className="text-slate-400 mt-2">Tỷ lệ đúng</div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Đường thẳng kẻ dọc */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[1px] bg-white/10 -translate-x-1/2" />

        <div className="space-y-12 md:space-y-24">
          {ROADMAP_DATA.map((stage, index) => {
            const Icon = stage.icon;
            const isEven = index % 2 === 0;

            // Tính toán màu sắc dựa trên cảnh giới (status)
            let cardStyle = "";
            let iconStyle = "";
            let dotStyle = "";
            let badgeStyle = "";

            if (stage.status === "completed") {
              cardStyle = "border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]";
              iconStyle = "bg-green-500/10 text-green-400";
              dotStyle = "bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.8)]";
              badgeStyle = "bg-green-500/20 text-green-400";
            } else if (stage.status === "in-progress") {
              cardStyle = "border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)]";
              iconStyle = "bg-cyan-500/20 text-cyan-400";
              dotStyle = "bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]";
              badgeStyle = "bg-cyan-500/20 text-cyan-400";
            } else {
              cardStyle = "border-white/5 opacity-60";
              iconStyle = "bg-white/5 text-slate-500";
              dotStyle = "bg-slate-700 border-2 border-[#09060f]";
              badgeStyle = "bg-white/5 text-slate-500";
            }

            return (
              <div key={stage.id} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                
                {/* Viên Trân Châu (Timeline Dot) */}
                <div className="absolute left-8 md:left-1/2 w-5 h-5 rounded-full -translate-x-1/2 z-20 flex items-center justify-center bg-[#09060f]">
                  <div className={`w-3.5 h-3.5 rounded-full transition-all ${dotStyle}`} />
                </div>

                {/* Thẻ Bài (Card) */}
                <div className={`ml-20 md:ml-0 w-full md:w-1/2 ${isEven ? 'md:pr-16' : 'md:pl-16'}`}>
                  <div className={`p-6 md:p-8 rounded-2xl bg-white/5 backdrop-blur-xl/2xl border border-white/10 transition-all hover:scale-[1.02] ${cardStyle}`}>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-2xl ${iconStyle}`}>
                        <Icon size={32} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-slate-200">{stage.level}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeStyle}`}>
                            {stage.status === "completed" ? "Hoàn thành" : stage.status === "in-progress" ? "Đang tu luyện" : "Khóa"}
                          </span>
                        </div>
                        <h2 className="text-3xl font-black text-white">{stage.name}</h2>
                      </div>
                    </div>

                    {/* Nội dung bên trong thẻ */}
                    {stage.status === "completed" && (
                      <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-4 py-4 rounded-xl border border-green-500/20 font-bold justify-center">
                        <CheckCircle2 size={20} />
                        Cảnh giới đã vững chắc!
                      </div>
                    )}

                    {stage.status === "in-progress" && (
                      <div>
                        <div className="flex justify-between text-sm text-slate-400 mb-2 font-medium">
                          <span>Tiến độ tu luyện</span>
                          <span>{stage.progress}%</span>
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-6">
                          <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" style={{ width: `${stage.progress}%` }} />
                        </div>
                        <button className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95 tracking-wide">
                          TIẾP TỤC TU LUYỆN
                        </button>
                      </div>
                    )}

                    {stage.status === "locked" && (
                      <div className="flex items-center gap-2 text-slate-500 bg-white/5 px-4 py-4 rounded-xl border border-white/5 font-bold justify-center">
                        <Lock size={18} />
                        CẦN ĐỘT PHÁ CẢNH GIỚI TRƯỚC
                      </div>
                    )}

                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
