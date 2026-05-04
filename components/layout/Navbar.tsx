"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  Menu,
  X,
  BookOpen,
  Map,
  BookText,
  Sun,
  Moon,
  ChevronDown,
  Type,
  PenTool,
  Layers,
  Sword,
  Brain,
  LogOut,
  Trophy
} from "lucide-react";

// Các liên kết chính
const navItems = [
  { name: "Bài Học", href: "/lessons", icon: BookOpen },
  { name: "Lộ Trình", href: "/levels", icon: Map },
  { name: "Bảng Phong Thần", href: "/leaderboard", icon: Trophy },
  // Công cụ sẽ được xử lý riêng bằng Dropdown
  { name: "Sổ Tay", href: "/notebook", icon: BookText },
];

// Danh sách các công cụ trong Dropdown
const toolsMenu = [
  { name: "Pinyin", href: "/pinyin", icon: Type, desc: "Phát âm chuẩn" },
  { name: "Ngữ Pháp", href: "/grammar", icon: BookOpen, desc: "Tâm pháp ghép câu" },
  { name: "Luyện Chữ", href: "/hanzi", icon: PenTool, desc: "Thư pháp võ công" },
{ name: "Sổ Tay", href: "/notebook", icon: BookText, desc: "Ghi nhớ thần tốc" },
{ name: "Trắc Nghiệm", href: "/quiz/1", icon: Sword, desc: "Thực chiến lôi đài" },
  { name: "AI Đại Sư", href: "/ai-chat", icon: Brain, desc: "Vấn đạo tinh linh" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false); // Quản lý mở rộng Công Cụ trên Mobile
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  // Khắc phục lỗi Hydration cho nút Dark/Light mode
  useEffect(() => {
    setMounted(true);
  }, []);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Tự động đóng menu trên mobile khi chuyển trang
  useEffect(() => {
    setIsOpen(false);
    setIsMobileToolsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* ==========================================
          MAIN NAVBAR (Desktop & Mobile Header)
      ========================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09060f]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* 1. Logo Section */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all">
                <span className="font-serif text-white font-bold leading-none select-none">漢</span>
              </div>
              <span className="font-bold text-lg tracking-wide text-slate-100 group-hover:text-amber-400 transition-colors">
                Hán Tự Đại Sư
              </span>
            </Link>

            {/* 2. Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8 h-full">
              {/* Render Bài Học và Lộ Trình */}
              {navItems.slice(0, 2).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-cyan-400 flex items-center h-full ${
                      isActive ? "text-cyan-400" : "text-slate-300"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {/* 👇 ĐÂY LÀ CHIÊU THỨC DROPDOWN CÔNG CỤ TỐI THƯỢNG 👇 */}
              <div className="relative h-full flex items-center group cursor-pointer">
                <div className="text-sm font-medium text-slate-300 transition-colors group-hover:text-cyan-400 flex items-center gap-1">
                  Công Cụ
                  <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                </div>
                
                {/* Dropdown Panel */}
                <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[420px] opacity-0 invisible translate-y-4 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 ease-out z-50">
                  <div className="p-4 bg-[#110d1c]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-cyan-900/20 rounded-2xl grid grid-cols-2 gap-2">
                    {toolsMenu.map((tool) => {
                      const ToolIcon = tool.icon;
                      return (
                        <Link 
                          key={tool.name} 
                          href={tool.href} 
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group/item"
                        >
                          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover/item:bg-cyan-500 group-hover/item:text-white transition-colors">
                            <ToolIcon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-200 group-hover/item:text-cyan-400 transition-colors">{tool.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{tool.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

{/* Render Bảng Phong Thần & Sổ Tay */}
              {navItems.slice(2).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-cyan-400 flex items-center h-full ${
                      isActive ? "text-cyan-400" : "text-slate-300"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* 3. Right Side Actions (Theme, Avatar, Hamburger) */}
            <div className="flex items-center gap-4">
{/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-full text-slate-400 hover:text-amber-400 hover:bg-white/5 transition-all"
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              )}

              {/* Conditional: Login Button for Guests / Avatar for Logged In Users */}
              {!authLoading && (
                user ? (
// Logged In - Show Avatar with Sign Out
                  <div className="hidden sm:flex items-center gap-2">
                    <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-md shadow-violet-500/20 cursor-pointer hover:scale-105 transition-transform">
                      <span className="text-sm font-bold text-white select-none text-center leading-none">
                        {user.displayName?.charAt(0).toUpperCase() || "Đ"}
                      </span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
                      title="Đăng xuất"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                ) : (
                  // Not Logged In - Show Login Button
                  <Link
                    href="/login"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded-full hover:bg-cyan-600/40 transition-all font-medium text-sm"
                  >
                    Bái Sư
                  </Link>
                )
              )}

              {/* Hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ==========================================
          MOBILE SLIDE-OVER MENU
      ========================================== */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Sliding Sheet */}
      <aside
        className={`fixed top-0 right-0 z-50 w-72 h-full bg-[#110d1c] border-l border-white/5 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/5">
          <span className="font-bold text-amber-500">Môn Phái</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {/* Bài học & Lộ trình */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? "bg-cyan-500/10 text-cyan-400" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-cyan-400" : "text-slate-500"} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}

          {/* Công Cụ Accordion (Mobile) */}
          <div className="pt-2">
            <button 
              onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <PenTool size={18} className="text-slate-500" />
                <span className="font-medium">Công Cụ</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 ${isMobileToolsOpen ? "rotate-180 text-cyan-400" : ""}`} />
            </button>
            
            {/* Các công cụ con */}
            <div className={`overflow-hidden transition-all duration-300 ${isMobileToolsOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
              <div className="pl-11 pr-2 pb-2 space-y-1">
                {toolsMenu.map((tool) => {
                  const ToolIcon = tool.icon;
                  return (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-cyan-400 transition-all"
                    >
                      <ToolIcon size={16} />
                      {tool.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sổ Tay */}
          {navItems.slice(2).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? "bg-cyan-500/10 text-cyan-400" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-cyan-400" : "text-slate-500"} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-white/5 flex items-center gap-3 bg-white/[0.02]">
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-md">
             <span className="font-bold text-white select-none text-center leading-none">Đ</span>
           </div>
           <div>
             <p className="text-sm font-bold text-slate-200">Đại Sư</p>
             <p className="text-xs text-slate-400">Trúc Cơ Kỳ</p>
           </div>
        </div>
      </aside>
    </>
  );
}