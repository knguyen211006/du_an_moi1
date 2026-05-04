'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Hanzi {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Hanzi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHanzi = async () => {
      if (!query.trim()) {
        if (isMounted) {
          setResults([]);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const snapshot = await getDocs(collection(db, 'hanzi'));
        const allHanzi: Hanzi[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Hanzi;
          allHanzi.push(data);
        });

        const lowerQuery = query.trim().toLowerCase();
        const filtered = allHanzi.filter((item) => {
          const safeHanzi = (item.hanzi || "").toLowerCase();
          const safePinyin = (item.pinyin || "").toLowerCase();
          const safeMeaning = (item.meaning || "").toLowerCase();
          
          return safeHanzi.includes(lowerQuery) || 
                 safePinyin.includes(lowerQuery) || 
                 safeMeaning.includes(lowerQuery);
        });

        if (isMounted) {
          setResults(filtered);
        }
      } catch (err) {
        if (isMounted) {
          setError('Lỗi khi tìm kiếm. Vui lòng thử lại.');
          console.error('Search error:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHanzi();

    return () => {
      isMounted = false;
    };
  }, [query]); // ONLY primitive query string

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-12 text-center bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
        Kết quả tìm kiếm cho: "{query}"
      </h1>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-lg text-muted-foreground">Đang tìm kiếm...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-destructive/10 p-8 rounded-2xl border border-destructive/20">
          <p className="text-xl font-semibold text-destructive mb-2">{error}</p>
          <p className="text-muted-foreground">Vui lòng thử lại sau.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-3xl p-12 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-slate-400/20 to-slate-500/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-slate-300/30">
            <span className="text-4xl text-slate-500/50">🔍</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Không tìm thấy kết quả cho "{query}"
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Thử tìm kiếm với các từ khóa khác như "爱", "ài", "love", hoặc chữ Hán khác.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {results.map((hanzi, index) => (
            <Link
              key={`${hanzi.hanzi}-${index}`}
              href={`/hanzi/${encodeURIComponent(hanzi.hanzi)}`}
              className="group block p-6 md:p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 hover:border-primary/50 overflow-hidden"
            >
              <div className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300 origin-center">
                {hanzi.hanzi}
              </div>
              <div className="font-semibold text-lg text-blue-600 dark:text-blue-400 mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {hanzi.pinyin}
              </div>
              <div className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3 group-hover:line-clamp-none">
                {hanzi.meaning}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

