export interface HanziData {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  isLearned?: boolean;
}

// Unified mock data - single source of truth
export const MOCK_HANZI_DATA: HanziData[] = [
  { id: '1', hanzi: '早', pinyin: 'zǎo', meaning: 'sáng sớm', hskLevel: 1 },
  { id: '2', hanzi: '餐', pinyin: 'cān', meaning: 'bữa ăn', hskLevel: 1 },
  { id: '3', hanzi: '包子', pinyin: 'bāo zi', meaning: 'bánh bao', hskLevel: 1 },
  { id: '4', hanzi: '豆浆', pinyin: 'dòu jiāng', meaning: 'sữa đậu nành', hskLevel: 1 },
  { id: '5', hanzi: '很好', pinyin: 'hěn hǎo', meaning: 'rất tốt', hskLevel: 2 },
  { id: '6', hanzi: '吃', pinyin: 'chī', meaning: 'ăn', hskLevel: 1 },
  { id: '7', hanzi: '喝', pinyin: 'hē', meaning: 'uống', hskLevel: 2 },
  { id: '8', hanzi: '朋友', pinyin: 'péng yǒu', meaning: 'bạn bè', hskLevel: 2 },
  { id: '9', hanzi: '爱', pinyin: 'ài', meaning: 'yêu', hskLevel: 1 },
  { id: '10', hanzi: '喜欢', pinyin: 'xǐ huān', meaning: 'thích', hskLevel: 2 },
  { id: '11', hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', hskLevel: 1 },
  { id: '12', hanzi: '猫', pinyin: 'māo', meaning: 'mèo', hskLevel: 1 },
  { id: '13', hanzi: '狗', pinyin: 'gǒu', meaning: 'chó', hskLevel: 1 },
  { id: '14', hanzi: '学习', pinyin: 'xué xí', meaning: 'học tập', hskLevel: 2 },
  { id: '15', hanzi: '早餐', pinyin: 'zǎo cān', meaning: 'bữa sáng', hskLevel: 2 },
  { id: '16', hanzi: '便宜', pinyin: 'pián yi', meaning: 'rẻ', hskLevel: 2 },
];

// HSK-filtered subsets
export const HSK1_DATA = MOCK_HANZI_DATA.filter(d => d.hskLevel === 1);
export const HSK2_DATA = MOCK_HANZI_DATA.filter(d => d.hskLevel === 2);

// Quiz data compatible with lessons/[id]/quiz format
export const QUIZ_DATA = [
  {
    id: '1',
    hanzi: "早餐",
    pinyin: "zǎo cān",
    question: "What does 早餐 mean?",
    options: ["Bữa trưa", "Bữa sáng", "Bữa tối", "Ăn nhẹ"],
    correctAnswer: "Bữa sáng"
  },
  {
    id: '2',
    hanzi: "豆浆",
    pinyin: "dòu jiāng", 
    question: "What does 豆浆 mean?",
    options: ["Trà sữa", "Sữa bò", "Sữa đậu nành", "Nước ép"],
    correctAnswer: "Sữa đậu nành"
  },
  {
    id: '3',
    hanzi: "便宜",
    pinyin: "pián yí",
    question: "What does 便宜 mean?",
    options: ["Đắt đỏ", "Ngon miệng", "Nhanh chóng", "Rẻ"],
    correctAnswer: "Rẻ"
  }
];

