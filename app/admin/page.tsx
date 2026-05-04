"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config'; // Kiểm tra lại tên file config của bạn
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { seedHanziData } from '@/lib/seed-hanzi';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSeed = async () => {
    if (!confirm("⚠️ Chắc chắn muốn bơm 3000 chữ Hán vào Firestore?")) return;
    setLoading(true);
    try {
      const total = await seedHanziData();
      alert(`🎉 Thành công! Đã thêm ${total} chữ.`);
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) return <div className="p-20 text-center">Đang kiểm tra trạng thái...</div>;

  // TRƯỜNG HỢP 1: CHƯA ĐĂNG NHẬP
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center border border-gray-100">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Quản trị hệ thống</h1>
          <button 
            onClick={handleLogin}
            className="px-6 py-3 bg-white border border-gray-300 rounded-lg flex items-center gap-3 hover:bg-gray-50 transition-all mx-auto font-medium shadow-sm"
          >
            <img src="https://www.gstatic.com/firebase/anonymous-scan.png" className="w-6 h-6" alt="" />
            Đăng nhập bằng Google để tiếp tục
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user.email === adminEmail;

  // TRƯỜNG HỢP 2: ĐÃ ĐĂNG NHẬP NHƯNG SAI EMAIL ADMIN
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center border border-red-50">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-500 mb-6">Email <b>{user.email}</b> không có quyền quản trị.</p>
          <button onClick={handleLogout} className="text-blue-600 hover:underline font-medium">
            Đăng xuất và thử tài khoản khác
          </button>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 3: LÀ ADMIN XỊN
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-800">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-blue-50 text-center">
        <div className="flex justify-between items-center mb-8">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">ADMIN ACTIVE</span>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors underline">Đăng xuất</button>
        </div>
        <h1 className="text-2xl font-black mb-2">Chào mừng Master!</h1>
        <p className="text-sm text-gray-500 mb-8">Tài khoản: {user.email}</p>
        
        <button 
          onClick={handleSeed} disabled={loading}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-200"
        >
          {loading ? "⏳ Đang xử lý dữ liệu..." : "🚀 一键导入3000汉字数据"}
        </button>
      </div>
    </div>
  );
}