"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Loader2, 
  Trophy, 
  Crown, 
  Medal, 
  Sparkles,
  Zap,
  Award
} from "lucide-react";
// Đã xóa các hàm cũ, chỉ giữ lại hàm getUserRank mới nhất
import { getUserRank } from "@/lib/utils/rank";

// User ranking type
interface UserRanking {
  rank: number;
  userId: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
}

// Helper: get initials from name (get last word for Vietnamese)
// Used for avatar: "Nguyễn Văn A" → "A"
function getUserInitial(name: string): string {
  if (!name || name.length === 0) return "?";
  const words = name.trim().split(" ");
  const lastWord = words[words.length - 1];
  return lastWord.charAt(0).toUpperCase();
}

// Rank badges configuration
const RANK_CONFIG = {
  1: {
    title: "ĐỆ NHẤT",
    subtitle: "Thiên Tài",
    color: "from-amber-400 via-yellow-300 to-amber-500",
    borderColor: "border-amber-400/50",
    bgColor: "bg-amber-500/10",
    icon: Crown,
    iconColor: "text-amber-400",
    glow: "shadow-[0_0_60px_rgba(251,191,36,0.4)]",
    podiumHeight: "h-16"
  },
  2: {
    title: "ĐỆ NHỊ",
    subtitle: "Tài Giáp",
    color: "from-slate-300 via-slate-200 to-slate-400",
    borderColor: "border-slate-400/50",
    bgColor: "bg-slate-400/10",
    icon: Medal,
    iconColor: "text-slate-300",
    glow: "shadow-[0_0_40px_rgba(148,163,184,0.3)]",
    podiumHeight: "h-12"
  },
  3: {
    title: "ĐỆ TAM",
    subtitle: "Hiệp Khách",
    color: "from-amber-700 via-orange-600 to-amber-800",
    borderColor: "border-amber-700/50",
    bgColor: "bg-amber-700/10",
    icon: Award,
    iconColor: "text-amber-700",
    glow: "shadow-[0_0_40px_rgba(180,83,9,0.3)]",
    podiumHeight: "h-8"
  }
};

export default function LeaderboardPage() {
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all quiz results from Supabase
        const { data: quizResults, error: fetchError } = await supabase
          .from('quiz_results')
          .select('user_id, score');

        if (fetchError) {
          console.error('Error fetching quiz results:', fetchError);
          setError('Không thể tải dữ liệu bảng xếp hạng.');
          setIsLoading(false);
          return;
        }

        if (!quizResults || quizResults.length === 0) {
          setRankings([]);
          setIsLoading(false);
          return;
        }

        // Aggregate scores by user_id
        const userScores: Record<string, number> = {};
        quizResults.forEach((result) => {
          if (result.user_id && result.score) {
            userScores[result.user_id] = (userScores[result.user_id] || 0) + result.score;
          }
        });

        // Convert to array and sort by total points (descending)
        const sortedUsers = Object.entries(userScores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 50);

        // Get list of unique userIds that we need profiles for
        const userIdsToFetch = sortedUsers.map(([userId]) => userId);
        console.log('User IDs to fetch from Firestore:', userIdsToFetch);

        // Fetch user display names from Supabase profiles table
        const userProfiles: Record<string, { displayName: string; email?: string }> = {};
        
        try {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIdsToFetch);
          
          if (profilesError) {
            console.error('Error fetching Supabase profiles:', profilesError);
          } else if (profilesData) {
            profilesData.forEach((profile) => {
              userProfiles[profile.id] = {
                displayName: profile.display_name || "",
                email: undefined
              };
            });
            console.log('Loaded profiles from Supabase:', userProfiles);
          }
        } catch (supabaseError) {
          console.error('Could not fetch Supabase profiles:', supabaseError);
        }

        // Build rankings array with real user data
        const rankingData: UserRanking[] = sortedUsers.map(([userId, totalPoints], index) => {
          const profile = userProfiles[userId];
          
          let displayName = profile?.displayName;
          if (!displayName || displayName.length === 0) {
            displayName = "Vô Danh Cốc"; 
          }
          
          const photoURL = undefined;

          return {
            rank: index + 1,
            userId,
            displayName,
            photoURL,
            totalPoints
          };
        });

        setRankings(rankingData);
      } catch (err) {
        console.error('Error in fetchLeaderboard:', err);
        setError('Đã xảy ra lỗi không mong muốn.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Render single user card for Top 3
  const renderUserCard = (user: UserRanking | undefined, position: number) => {
    if (!user) return null;

    const config = RANK_CONFIG[position as 1 | 2 | 3];
    const userName = user.displayName || 'Vô Danh Cốc';
    const userPoints = user.totalPoints;
    const hasPhotoURL = user.photoURL && user.photoURL.length > 0;
    const avatarInitial = getUserInitial(userName);
    
    // Lấy thông tin cảnh giới từ hàm mới
    const rankInfo = getUserRank(userPoints);
    
    const showCrown = position === 1;
    const avatarSize = position === 1 ? "w-28 h-28" : "w-24 h-24";

    return (
      <div className="flex flex-col items-center">
        {/* Crown for 1st place */}
        {showCrown && (
          <div className="relative mb-2">
            <div className="absolute -inset-4 bg-amber-400/20 rounded-full blur-xl animate-pulse" />
            <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
          </div>
        )}
        
        {/* Avatar Circle */}
        {hasPhotoURL ? (
          <div 
            className={`
              ${avatarSize} rounded-full 
              overflow-hidden
              ${config.borderColor} border-2
              ${config.glow}
              transition-all duration-500 hover:scale-105
            `}
          >
            <img 
              src={user.photoURL} 
              alt={userName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div 
            className={`
              ${avatarSize} rounded-full 
              flex items-center justify-center
              bg-gradient-to-br ${config.color}
              ${config.borderColor} border-2
              ${config.glow}
              transition-all duration-500 hover:scale-105
            `}
          >
            <span className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
              {avatarInitial}
            </span>
          </div>
        )}

        {/* Rank Badge */}
        <div className={`mt-3 px-3 py-1 rounded-full ${config.bgColor} ${config.borderColor} border`}>
          <span className={`text-xs font-bold ${config.iconColor}`}>
            {config.title}
          </span>
        </div>

        {/* Name - Show only last word (tên chính) */}
        <h3 className="mt-2 text-lg md:text-xl font-bold text-white text-center max-w-[160px]">
          {userName?.trim().split(' ').filter(Boolean).pop() || 'Vô Danh'}
        </h3>

        {/* Rank Title - Dùng màu sắc và chức danh từ Cảnh giới */}
        <div className={`text-xs font-semibold ${rankInfo.textColor} mt-1`}>
          {rankInfo.title}
        </div>

        {/* Points */}
        <div className={`flex items-center gap-1 mt-1 ${config.iconColor}`}>
          <Zap size={14} className="fill-current" />
          <span className="text-sm font-bold">{userPoints.toLocaleString()}</span>
        </div>

        {/* Podium Base */}
        <div className={`
          w-24 md:w-28 mt-3 rounded-t-lg 
          bg-gradient-to-t ${config.color}
          ${config.borderColor} border-t border-x-2
          ${config.podiumHeight}
          opacity-80
        `} />
      </div>
    );
  };

  // Render top 3 podium
  const renderTopThree = () => {
    const topThree = rankings.slice(0, 3);
    if (topThree.length === 0) return null;

    const secondPlace = topThree[1];
    const firstPlace = topThree[0];
    const thirdPlace = topThree[2];

    return (
      <div className="flex items-end justify-center gap-4 md:gap-8 mb-12">
        {secondPlace && renderUserCard(secondPlace, 2)}
        {firstPlace && renderUserCard(firstPlace, 1)}
        {thirdPlace && renderUserCard(thirdPlace, 3)}
      </div>
    );
  };

  // Render remaining rankings (4+)
  const renderRemainingRankings = () => {
    const remaining = rankings.slice(3);
    if (remaining.length === 0) return null;

    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-slate-200">Danh Sách Cao Thủ</h2>
        </div>

        <div className="space-y-3">
          {remaining.map((user, index) => {
            const userName = user.displayName || 'Vô Danh Cốc';
            const userPoints = user.totalPoints;
            const hasPhotoURL = user.photoURL && user.photoURL.length > 0;
            const avatarInitial = getUserInitial(userName);
            
            // Gọi Cảnh giới cho danh sách cấp thấp
            const rankInfo = getUserRank(userPoints);

            return (
              <div
                key={user?.userId || index}
                className="
                  flex items-center gap-4 p-4 
                  bg-white/5 backdrop-blur-md 
                  border border-white/10 rounded-xl
                  hover:bg-white/10 hover:border-cyan-500/30
                  transition-all duration-300
                  animate-in fade-in slide-in-from-bottom-4
                  fill-mode-backwards
                "
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Rank Number */}
                <div className="w-10 h-10 flex items-center justify-center">
                  <span className="text-lg font-bold text-slate-500">
                    {user?.rank || index + 4}
                  </span>
                </div>

                {/* Avatar */}
                {hasPhotoURL ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg shadow-violet-500/20">
                    <img 
                      src={user.photoURL} 
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <span className="text-lg font-bold text-white">
                      {avatarInitial}
                    </span>
                  </div>
                )}

                {/* Name & Rank */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">
                    {userName?.trim().split(' ').filter(Boolean).pop() || 'Vô Danh'}
                  </p>
                  {/* Đã cập nhật để dùng rankInfo */}
                  <p className={`text-xs font-semibold ${rankInfo.textColor}`}>
                    {rankInfo.title}
                  </p>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1 text-amber-400">
                  <Zap size={16} className="fill-amber-400" />
                  <span className="font-bold">{userPoints.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09060f] flex flex-col items-center justify-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 w-24 h-24 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
        </div>
        <p className="text-slate-400 animate-pulse">Đang triệu hồi bảng phong thần...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#09060f] flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-300 mb-2">Chưa Có Dữ Liệu</p>
          <p className="text-slate-500">{error}</p>
          <p className="text-slate-600 text-sm mt-4">
            Hãy hoàn thành các bài quiz để xuất hiện trên bảng xếp hạng!
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (rankings.length === 0) {
    return (
      <div className="min-h-screen bg-[#09060f] flex flex-col items-center justify-center p-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <Trophy className="w-16 h-16 text-amber-500/50 relative z-10" />
        </div>
        <h1 className="text-3xl font-black text-white mb-4">Bảng Phong Thần</h1>
        <p className="text-slate-400 text-center max-w-md">
          Chưa có cao thủ nào xuất hiện. Hãy là người đầu tiên chinh phục bảng xếp hạng!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09060f] text-slate-100 py-20 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 relative z-10 pt-8">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
          <Trophy className="w-16 h-16 text-amber-400 relative z-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 mb-4">
          Bảng Phong Thần
        </h1>
        <p className="text-slate-400 text-lg">Top 50 cao thủ hàng đầu</p>
      </div>

      {/* Top 3 Podium */}
      {renderTopThree()}

      {/* Remaining Rankings */}
      {renderRemainingRankings()}

      {/* Footer Stats */}
      <div className="text-center mt-16 text-slate-500 text-sm">
        <p>Tổng số trận đã đánh: {rankings.length}</p>
      </div>
    </div>
  );
}