"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, BookOpen, ArrowLeft, Trash2, Play } from 'lucide-react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { db } from '@/lib/firebase/firestore';

interface SavedWord {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

const MyWordsPage = () => {
  const [user, setUser] = useState<any>(null);
  const [words, setWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchSavedWords(currentUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchSavedWords = async (userId: string) => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'saved_words'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const wordList: SavedWord[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as SavedWord[];
      setWords(wordList);
    } catch (error) {
      console.error('Error fetching saved words:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWord = async (wordId: string) => {
    if (!confirm('Xóa từ này khỏi sổ tay?')) return;

    try {
      await deleteDoc(doc(db, 'saved_words', wordId));
      setWords(words.filter((word) => word.id !== wordId));
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  };

  const practiceWord = (hanzi: string) => {
    router.push(`/hanzi/${encodeURIComponent(hanzi)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-xl text-slate-600 font-medium">Đang tải sổ tay từ vựng...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-12 text-center border border-slate-100">
          <BookOpen className="w-24 h-24 text-slate-300 mx-auto mb-8" />
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Sổ tay từ vựng của bạn</h1>
          <p className="text-lg text-slate-600 mb-8 max-w-sm mx-auto">
            Đăng nhập để lưu và xem lại những từ Hán tự bạn đã học.
          </p>
          <p className="text-sm text-slate-500 mb-8">Google account hoạt động tốt nhất!</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              ← Về trang chủ học từ mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-slate-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Sổ tay từ vựng</h1>
            <p className="text-xl text-slate-600">
              {words.length} từ đã lưu • Chọn từ để luyện viết hoặc xóa
            </p>
          </div>
        </div>

        {/* Words Grid */}
        {words.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-16 text-center border border-slate-100 max-w-2xl mx-auto">
            <BookOpen className="w-24 h-24 text-slate-300 mx-auto mb-8" />
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Sổ tay trống</h2>
            <p className="text-lg text-slate-600 mb-12 max-w-md mx-auto">
              Bạn chưa lưu từ nào. Học và lưu từ trên trang chủ để xem ở đây!
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 px-8 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
            >
              🎯 Học từ mới ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {words.map((word) => (
              <div key={word.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:border-blue-200">
                {/* Delete Button */}
                <button
                  onClick={() => deleteWord(word.id)}
                  className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:scale-110 z-10"
                  title="Xóa từ này"
                >
                  <Trash2 className="w-5 h-5 text-slate-500 hover:text-red-500" />
                </button>

                <div className="p-8 text-center relative z-0">
                  <div className="text-[100px] leading-none font-black text-slate-800 mb-6 drop-shadow-lg group-hover:text-blue-600 transition-colors">
                    {word.hanzi}
                  </div>
                  
                  <div className="space-y-2 mb-8">
                    <p className="text-2xl font-semibold text-blue-600 tracking-wide">
                      {word.pinyin}
                    </p>
                    <p className="text-lg text-slate-700 leading-relaxed line-clamp-3">
                      {word.meaning}
                    </p>
                  </div>

                  <button
                    onClick={() => practiceWord(word.hanzi)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Luyện viết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWordsPage;

