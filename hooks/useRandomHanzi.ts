import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';

interface HanziData {
  hanzi: string;
  pinyin: string;
  meaning: string;
  level: number;
}

const DEFAULT_MOCK: HanziData = {
  hanzi: '爱',
  pinyin: 'ài',
  meaning: 'yêu, tình yêu',
  level: 3
};

export const useRandomHanzi = () => {
  const [wordData, setWordData] = useState<HanziData>(DEFAULT_MOCK);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRandomHanzi = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Fetch limited docs and pick random
      const q = query(
        collection(db, 'hanzi'),
        orderBy('__name__'), // Use doc ID for randomness
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      if (docs.length === 0) {
        console.warn('No documents in dictionary collection, using fallback');
        setWordData(DEFAULT_MOCK);
        return;
      }
      
      // Pick random document
      const randomIndex = Math.floor(Math.random() * docs.length);
      const randomDoc = docs[randomIndex];
      const data = randomDoc.data() as HanziData;
      
      setWordData({
        hanzi: data.hanzi || DEFAULT_MOCK.hanzi,
        pinyin: data.pinyin || DEFAULT_MOCK.pinyin,
        meaning: data.meaning || DEFAULT_MOCK.meaning,
        level: data.level || DEFAULT_MOCK.level
      });
      
    } catch (error) {
      console.error('Firestore fetch failed:', error);
      // Graceful fallback to mock
      setWordData(DEFAULT_MOCK);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRandomHanzi();
  }, [fetchRandomHanzi]);

  return {
    wordData,
    isLoading,
    fetchNewWord: fetchRandomHanzi
  };
};

