"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User as FirebaseUser, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUserProfile, updateUserProfile, serverTimestamp } from "@/lib/firebase/firestore";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  LogOut, 
  Edit3, 
  Star, 
  Zap, 
  BookOpen,
  Trophy,
  Settings,
  AlertCircle,
  Volume2,
  Bell,
  Palette,
  ChevronRight,
  X,
  History,
  Calendar,
  Swords
} from "lucide-react";

import { getUserRank } from "@/lib/utils/rank";

const ADMIN_EMAIL = "nguyenkhoinguyen21102006@gmail.com";
const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// Giao diện dữ liệu cho Chiến Tích
interface QuizResult {
  id: string;
  score: number;
  total_questions: number;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [lastNameChangeAt, setLastNameChangeAt] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const [stats, setStats] = useState({
    exp: 0,
    lessonsCompleted: 0,
    streak: 0 
  });

  // State lưu 5 trận đánh gần nhất
  const [recentMatches, setRecentMatches] = useState<QuizResult[]>([]);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationsEnabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const router = useRouter();

  const isAdmin = user?.email === ADMIN_EMAIL;

  const getRemainingTime = () => {
    if (!lastNameChangeAt) return null;
    let lastChangeMs: number;
    if (lastNameChangeAt && typeof lastNameChangeAt.toMillis === 'function') {
      lastChangeMs = lastNameChangeAt.toMillis();
    } else if (lastNameChangeAt instanceof Date) {
      lastChangeMs = lastNameChangeAt.getTime();
    } else if (typeof lastNameChangeAt === 'number') {
      lastChangeMs = lastNameChangeAt;
    } else {
      lastChangeMs = new Date(lastNameChangeAt).getTime();
    }
    
    const elapsed = Date.now() - lastChangeMs;
    const remaining = COOLDOWN_MS - elapsed;
    if (remaining <= 0) return null;
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  };

  const canChangeName = () => {
    if (isAdmin) return true;
    if (!lastNameChangeAt) return true;
    return getRemainingTime() === null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/");
      } else {
        setUser(currentUser);
        setNewName(currentUser.displayName || "");
        
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile && profile.last_name_change_at) {
            setLastNameChangeAt(profile.last_name_change_at);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }

        // Tụ khí lấy Điểm tổng & Lịch sử
        try {
          const { data: quizResults, error: fetchError } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('user_id', currentUser.uid)
            .order('created_at', { ascending: false });

          if (fetchError) {
            console.error("Error fetching points:", fetchError);
          } else if (quizResults) {
            const totalPoints = quizResults.reduce((sum, item) => sum + (item.score || 0), 0);
            const totalMatches = quizResults.length;
            
            setStats(prev => ({
              ...prev,
              exp: totalPoints,
              lessonsCompleted: totalMatches
            }));

            // Chỉ lấy 5 trận gần nhất đưa vào Bảng Chiến Tích
            setRecentMatches(quizResults.slice(0, 5) as QuizResult[]);
          }
        } catch (error) {
          console.error("Error connecting to Supabase:", error);
        }
        
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    if (!isAdmin && !canChangeName()) {
      const remaining = getRemainingTime();
      setErrorMessage(`Môn quy: Bạn chỉ được đổi danh xưng 7 ngày một lần. Vui lòng quay lại sau! (Còn ${remaining})`);
      return;
    }
    
    try {
      await updateProfile(user, { displayName: newName.trim() });
      setUser({ ...user, displayName: newName.trim() });
      await updateUserProfile(user.uid, { last_name_change_at: serverTimestamp() });
      setLastNameChangeAt(serverTimestamp());
      setEditingName(false);
      setErrorMessage("");
    } catch (error) {
      console.error("Update name error:", error);
      setErrorMessage("Đã xảy ra lỗi khi cập nhật tên. Vui lòng thử lại.");
    }
  };

  const handleEditNameClick = () => {
    if (!isAdmin && !canChangeName()) {
      const remaining = getRemainingTime();
      setErrorMessage(`Môn quy: Bạn chỉ được đổi danh xưng 7 ngày một lần. Vui lòng quay lại sau! (Còn ${remaining})`);
      return;
    }
    setErrorMessage("");
    setEditingName(true);
  };

  // Helper format ngày tháng
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a10] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userInitial = user?.displayName?.charAt(0).toUpperCase() || "Đ";
  const userName = user?.displayName || "Đại Sư";
  const userEmail = user?.email || "Chưa cập nhật";
  const rankInfo = getUserRank(stats.exp);

  return (
    <div className="min-h-screen bg-[#0a0a10] text-slate-100 py-8 px-4 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10 pt-16">
        <div className="absolute top-8 left-8 z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all text-slate-300 hover:text-cyan-400 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
        </div>

        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 w-28 h-28 mx-auto bg-gradient-to-br from-violet-500 to-cyan-500 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <span className="text-4xl font-black text-white text-center leading-none">
                {userInitial}
              </span>
            </div>
          </div>

          {editingName ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-cyan-500/50 rounded-xl text-white text-center font-bold text-xl focus:ring-2 focus:ring-cyan-500/50 outline-none"
                placeholder="Nhập danh xưng mới"
              />
              <button onClick={handleSaveName} className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-500 transition-colors">
                Lưu
              </button>
              <button onClick={() => setEditingName(false)} className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl font-medium hover:bg-white/20 transition-colors">
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-3xl font-black text-white">{userName}</h1>
              <button onClick={handleEditNameClick} className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-all">
                <Edit3 size={18} />
              </button>
            </div>
          )}

          {errorMessage && <p className="text-red-400 text-sm mt-2">{errorMessage}</p>}

          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Mail size={14} />
            <span className="text-sm">{userEmail}</span>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-cyan-500 rounded-full" />
            Căn Cơ Tu Luyện
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={`bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 hover:${rankInfo.borderColor} transition-colors`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${rankInfo.bgColor} ${rankInfo.textColor}`}>
                  <Star size={20} />
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Cảnh Giới</span>
              </div>
              <p className={`text-2xl font-black ${rankInfo.textColor}`}>{rankInfo.title}</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Zap size={20} />
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Tổng Công Lực</span>
              </div>
              <p className="text-2xl font-black text-white">{stats.exp.toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <BookOpen size={20} />
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Trận Đã Đánh</span>
              </div>
              <p className="text-2xl font-black text-white">{stats.lessonsCompleted}</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 hover:border-green-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                  <Trophy size={20} />
                </div>
                <span className="text-xs text-slate-400 uppercase tracking-wide">Ngày Luyện</span>
              </div>
              <p className="text-2xl font-black text-white">{stats.streak} 🔥</p>
            </div>
          </div>
        </div>

        {/* BẢNG CHIẾN TÍCH (THÊM MỚI Ở ĐÂY) */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
            Lịch Sử Lôi Đài
          </h2>
          
          <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden">
            {recentMatches.length === 0 ? (
              <div className="p-8 text-center">
                <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Chưa có ghi chép chiến tích</p>
                <p className="text-sm text-slate-500 mt-1">Hãy tiến vào Mật Thất Luyện Công để ghi danh!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {recentMatches.map((match, idx) => (
                  <div key={match.id || idx} className="p-4 sm:p-5 hover:bg-white/5 transition-colors flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 hidden sm:block">
                        <Swords size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-200 flex items-center gap-2">
                          Thử Thách Hán Tự
                          <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {match.total_questions || 10} câu
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                          <Calendar size={13} />
                          {formatDate(match.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-amber-400 font-black text-lg">
                        +{match.score} <Zap size={16} className="fill-amber-400" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Công lực thu được</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {recentMatches.length > 0 && (
              <div className="p-4 bg-white/[0.02] border-t border-slate-700/50 text-center">
                <Link href="/quiz/1" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                  Tiếp Tục Luyện Công &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-purple-500 rounded-full" />
            Môn Phái Settings
          </h2>

          <div className="space-y-3">
            <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-slate-700/50 hover:bg-white/10 hover:border-cyan-500/30 transition-all group">
              <div className="p-2 rounded-lg bg-slate-500/10 text-slate-400 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                <Settings size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-slate-200">Cài Đặt</p>
                <p className="text-xs text-slate-500">Cấu hình môn phái</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </button>

            <button onClick={handleSignOut} className="w-full flex items-center gap-4 px-6 py-4 bg-red-500/10 backdrop-blur-md rounded-2xl border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all group">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <LogOut size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-red-400">Thoát Khỏi Môn Phái</p>
                <p className="text-xs text-red-500/70">Đăng xuất khỏi tài khoản</p>
              </div>
            </button>
          </div>
        </div>

        {!user && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a10]/90 z-50">
            <div className="text-center">
              <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
              <p className="text-xl font-bold text-white mb-2">Chưa Đăng Nhập</p>
              <p className="text-slate-400 mb-4">Vui lòng đăng nhập để xem hồ sơ</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-500 transition-colors">
                <User size={18} />
                Đăng Nhập
              </Link>
            </div>
          </div>
        )}

        {settingsOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <div className="relative w-full max-w-md bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-white">Cài Đặt</h2>
                <button onClick={() => setSettingsOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 size={20} className="text-cyan-400" />
                    <div className="text-left">
                      <p className="font-bold text-white">Âm Thanh</p>
                      <p className="text-xs text-slate-500">Tiếng phát âm khi luyện tập</p>
                    </div>
                  </div>
                  <button onClick={() => { const val = !soundEnabled; setSoundEnabled(val); localStorage.setItem('soundEnabled', String(val)); }} className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-amber-400" />
                    <div className="text-left">
                      <p className="font-bold text-white">Thông Báo</p>
                      <p className="text-xs text-slate-500">Nhắc nhở luyện tập hàng ngày</p>
                    </div>
                  </div>
                  <button onClick={() => { const val = !notificationsEnabled; setNotificationsEnabled(val); localStorage.setItem('notificationsEnabled', String(val)); }} className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-cyan-500' : 'bg-slate-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}