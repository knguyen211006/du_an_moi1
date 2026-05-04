"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  ArrowLeft,
  Sparkles,
  Zap,
  Library,
  User,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Moon,
  Eye,      // Thêm Linh Nhãn
  EyeOff    // Thêm Linh Nhãn đóng
} from 'lucide-react'; 
import { auth, googleProvider } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile 
} from 'firebase/auth';
import Link from 'next/link';
import { updateUserProfile } from '@/lib/firebase/firestore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
// 👇 TRẠNG THÁI HIỆN/ẨN LINH NHÃN 👇
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        // Đăng nhập với Firebase
        await signInWithEmailAndPassword(auth, email, password);
        
// Đăng nhập thành công, chuyển hướng về trang chủ
        router.push('/');
      } else {
        // Đăng ký với Firebase
        if (password !== confirmPassword) {
          setError('Mật Pháp xác nhận không đồng nhất!');
          setLoading(false);
          return;
        }

const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Cập nhật display name nếu có
        if (fullName && userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: fullName,
          });
        }
        
        // Tạo Firestore user document để leaderboard có thể đọc tên
        if (userCredential.user) {
          await updateUserProfile(userCredential.user.uid, {
            uid: userCredential.user.uid,
            email: userCredential.user.email || email,
            displayName: fullName || userCredential.user.displayName || "",
          });
        }

        setSuccess('Khai Nhãn thành công! Hãy Thần Nhập bằng Pháp Hiệu mới.');
        
        setIsLogin(true);
        setFullName(''); setPassword(''); setConfirmPassword('');
      }
    } catch (err: any) {
      // Firebase error codes
      if (err.code === 'auth/invalid-email') {
        setError('Pháp Hiệu không hợp lệ!');
      } else if (err.code === 'auth/user-not-found') {
        setError('Linh hồn này chưa được khai Nhãn.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Mật Pháp không chính xác.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Pháp Hiệu này đã có người sở hữu.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật Pháp quá yếu, cần cường hóa hơn.');
      } else {
        setError(err.message || 'Cú pháp Mật Pháp không chính xác hoặc linh lực suy kiệt.');
      }
    } finally {
      setLoading(false);
    }
  };

const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Tạo Firestore user document nếu chưa có (cho Google sign-in)
      if (result.user) {
        await updateUserProfile(result.user.uid, {
          uid: result.user.uid,
          email: result.user.email || "",
          displayName: result.user.displayName || "",
        });
      }
      
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cửa Thần Vực đã đóng bởi người dùng.');
      } else {
        setError('Thần Vực Google từ chối kết nối.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-[#030308] text-[#b060ff] font-serif selection:bg-purple-900 selection:text-white">
      
      {/* 🔮 CỘT TRÁI: VỰC SÂU TRI THỨC */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 overflow-hidden border-r border-purple-500/10">
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.15)_0%,transparent_70%)] animate-pulse-slow" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-500 rounded-full blur-sm animate-float" />
            <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-purple-500 rounded-full blur-md animate-float-delayed" />
        </div>

        <div className="relative z-10 text-center space-y-10 max-w-lg">
          <div className="relative mx-auto w-40 h-40">
            <div className="absolute inset-0 rounded-[3rem] bg-purple-600/20 blur-3xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-t from-[#101020] to-[#202040] border border-purple-500/30 rounded-[2.8rem] flex items-center justify-center text-white text-8xl font-black transform rotate-6 hover:rotate-0 transition-transform duration-700 shadow-2xl shadow-purple-950">
              汉
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-7xl font-black text-white tracking-tighter leading-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              Hán Tự <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400">Đại Sư</span>
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto" />
            <p className="text-xl text-purple-200/70 leading-relaxed font-light italic">
              "Khai mở phong ấn cổ tự, thấu tận huyền cơ ngàn năm. <br />
              Hành trình tìm về cội nguồn linh lực của từng nét chữ."
            </p>
          </div>
        </div>
      </div>

      {/* ⛩️ CỘT PHẢI: PHÁP TRẬN ĐĂNG NHẬP */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        <div className="z-10 w-full max-w-[480px]">
          <Link href="/" className="inline-flex items-center gap-3 text-purple-400/40 hover:text-purple-300 mb-10 transition-all group font-medium text-lg tracking-wide">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
            <span>Thoát ly Ảo Cảnh</span>
          </Link>

          <div className="relative group/card">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-blue-600 to-fuchsia-600 rounded-[3.2rem] opacity-20 group-hover/card:opacity-40 blur-xl transition duration-1000" />
            
            <div className="relative bg-white/5 backdrop-blur-xl/2xl border border-white/10 rounded-2xl p-10 md:p-14">
              
              <div className="relative z-10">
                <div className="mb-10">
                    <h3 className="text-4xl font-black text-white mb-3 tracking-tight">
                      {isLogin ? 'Thần Nhập Pháp Môn' : 'Khai Nhãn Linh Căn'}
                    </h3>
                    <p className="text-purple-400/50 text-sm font-light italic">
                      {isLogin ? 'Dùng Pháp Hiệu để tiếp tục hành trình...' : 'Khởi tạo linh hồn mới trong Vạn Thiên Thư...'}
                    </p>
                </div>

                {success && (
                  <div className="mb-8 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-center gap-3 text-green-400 text-xs font-medium animate-pulse">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    {success}
                  </div>
                )}

                {isLogin && (
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 py-4 border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] rounded-2xl transition-all duration-500 font-bold text-white/90 mb-8"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
                      <path fill="#34A853" d="M16.04 18.013c-1.09.593-2.346.915-3.682.915-2.836 0-5.25-1.852-6.092-4.417L2.24 17.618C4.197 21.57 8.27 24 13 24c3.055 0 5.782-1.145 7.91-3l-4.87-2.987z" />
                      <path fill="#4285F4" d="M24 12c0-.832-.074-1.636-.196-2.422H13v4.594h6.17c-.266 1.418-1.064 2.618-2.262 3.418l4.87 2.988C24.636 17.782 26 15.055 26 12z" />
                      <path fill="#FBBC05" d="M6.266 14.511a7.042 7.042 0 0 1 0-5.022L2.24 6.374a12.022 12.022 0 0 0 0 11.252l4.026-3.115z" />
                    </svg>
                    <span>Tiếp tục với Google</span>
                  </button>
                )}

                <div className="flex items-center my-10 opacity-30">
                  <div className="flex-grow border-t border-purple-500"></div>
                  <span className="px-4 text-[9px] font-black text-purple-300 uppercase tracking-[0.4em]">Pháp Ấn Chi Thuật</span>
                  <div className="flex-grow border-t border-purple-500"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {!isLogin && (
                    <div className="relative group/input">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 group-focus-within/input:text-purple-400 transition-colors" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:ring-2 focus:ring-purple-600/50 outline-none text-white font-medium"
                        placeholder="Pháp Danh (Họ tên)"
                        required
                      />
                    </div>
                  )}

                  <div className="relative group/input">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 group-focus-within/input:text-purple-400 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-black/40 border border-white/5 rounded-2xl focus:ring-2 focus:ring-purple-600/50 outline-none text-white font-medium"
                      placeholder="Pháp Hiệu Email"
                      required
                    />
                  </div>

                  {/* 👁️ MẬT PHẨU CÓ LINH NHÃN 👁️ */}
                  <div className="relative group/input">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 group-focus-within/input:text-purple-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-14 pr-14 py-4 bg-black/40 border border-white/5 rounded-2xl focus:ring-2 focus:ring-purple-600/50 outline-none text-white font-medium"
                      placeholder="Mật Pháp"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-400/40 hover:text-purple-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {!isLogin && (
                    <div className="relative group/input">
                      <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600 group-focus-within/input:text-purple-400 transition-colors" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-14 pr-14 py-4 bg-black/40 border border-white/5 rounded-2xl focus:ring-2 focus:ring-purple-600/50 outline-none text-white font-medium"
                        placeholder="Xác Nhận Mật Pháp"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-400/40 hover:text-purple-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  )}

                  {error && <p className="text-red-500/80 text-[11px] font-bold text-center tracking-wide animate-shake">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group/submit relative w-full py-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white font-bold text-2xl rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/submit:translate-x-full transition-transform duration-1000" />
                    {loading ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <>
                        <span className="tracking-widest">{isLogin ? 'TRIỆU GỌI' : 'KHAI NHÃN'}</span>
                        <Zap className="w-6 h-6 group-hover:scale-125 transition-transform text-yellow-400 shadow-yellow-500" />
                      </>
                    )}
                  </button>
                </form>

                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); setShowPassword(false); setShowConfirmPassword(false); }}
                  className="w-full mt-10 text-[10px] font-black text-purple-500/40 hover:text-white transition-all uppercase tracking-[0.5em]"
                >
                  {isLogin ? '— Khai Nhãn Linh Căn —' : '— Thần Nhập Pháp Môn —'}
                </button>
             </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .font-serif { font-family: var(--font-lora), serif !important; }
        .font-sans { font-family: var(--font-inter), sans-serif !important; }
        h1, h2, h3, h4, span, button, input { font-family: var(--font-lora), serif !important; }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1) translate(-50%, -50%); }
          50% { opacity: 0.25; transform: scale(1.05) translate(-50%, -50%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { transform: translateY(-40px) translateX(20px); opacity: 0.6; }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-60px) translateX(-30px); opacity: 0.7; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-pulse-slow { animation: pulse-slow 10s infinite ease-in-out; }
        .animate-float { animation: float 15s infinite ease-in-out; }
        .animate-float-delayed { animation: float-delayed 20s infinite ease-in-out; }
        .animate-shake { animation: shake 0.2s 3 ease-in-out; }
      `}</style>
    </div>
  );
}