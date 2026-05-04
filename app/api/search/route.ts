import { NextRequest, NextResponse } from 'next/server';
import { searchHanzi } from '@/lib/firebase/firestore';

// Backend fallback mock data (larger set)
const fallbackMockData = [
  { hanzi: '爱', pinyin: 'ài', meaning: 'yêu' },
  { hanzi: '喜欢', pinyin: 'xǐ huān', meaning: 'thích' },
  { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào' },
  { hanzi: '猫', pinyin: 'māo', meaning: 'mèo' },
  { hanzi: '狗', pinyin: 'gǒu', meaning: 'chó' },
  { hanzi: '朋友', pinyin: 'péng you', meaning: 'bạn bè' },
  { hanzi: '学习', pinyin: 'xué xí', meaning: 'học tập' },
  { hanzi: '水', pinyin: 'shuǐ', meaning: 'nước' },
  { hanzi: '人', pinyin: 'rén', meaning: 'người' },
  { hanzi: '大', pinyin: 'dà', meaning: 'lớn' },
];

// Simple fuzzy filter for fallback
const filterFallback = (items: any[], query: string): any[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return items.filter(item =>
    item.hanzi.toLowerCase().includes(q) ||
    item.pinyin.toLowerCase().includes(q) ||
    (item.meaning || '').toLowerCase().includes(q)
  );
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    // Attempt Firestore query first
    try {
      const firestoreResults = await searchHanzi(q);
      // Map to consistent shape if needed, filter empty
      const validResults = firestoreResults.filter((item: any) => item.hanzi);
      if (validResults.length > 0) {
        return NextResponse.json(validResults.slice(0, 10)); // Limit results
      }
    } catch (firestoreError) {
      console.warn('Firestore search failed (quota/other issue), using fallback:', firestoreError);
      // Continue to fallback
    }

    // Fallback to mock data filtering
    const fallbackResults = filterFallback(fallbackMockData, q).slice(0, 10);
    return NextResponse.json(fallbackResults);

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

