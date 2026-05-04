"use client";

import { useState, useEffect } from 'react';
import { User, LogOut, LogIn } from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { GoogleAuthProvider } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

const AuthButton = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap"
      >
        <LogIn className="w-4 h-4" />
        Đăng nhập
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 rounded-full overflow-hidden shadow-md ring-2 ring-slate-200 transition-all hover:ring-blue-300 hover:scale-105">
        <img 
          src={user.photoURL || '/default-avatar.png'} 
          alt={user.displayName || 'User'} 
          className="w-full h-full object-cover"
        />
      </div>
      <button
        onClick={handleSignOut}
        className="p-2 hover:bg-slate-100 rounded-xl transition-all hover:scale-110 hover:rotate-3"
        title="Đăng xuất"
      >
        <LogOut className="w-5 h-5 text-slate-600 hover:text-red-500" />
      </button>
    </div>
  );
};

export default AuthButton;

