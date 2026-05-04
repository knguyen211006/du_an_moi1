-- ============================================
-- Quiz Word Table for Random Vocab Quizzes
-- Database: Supabase (PostgreSQL)
-- ============================================

-- 1. Create the words table for quiz vocabulary
CREATE TABLE IF NOT EXISTS public.words (
    id TEXT PRIMARY KEY,           -- Unique identifier (hanzi character)
    hanzi TEXT NOT NULL,         -- Hanzi character (e.g., "我")
    pinyin TEXT NOT NULL,        -- Pinyin pronunciation (e.g., "wǒ")
    meaning TEXT NOT NULL,         -- Vietnamese meaning (e.g., "tôi, tôi")
    example TEXT,                -- Example sentence in Chinese
    example_translation TEXT,     -- Example sentence translation
    level TEXT,                 -- HSK level (1-6)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Notebook Table with Error Tracking
-- ============================================

-- 2. Create/update notebook table for user's saved vocabulary
CREATE TABLE IF NOT EXISTS public.notebook (
    id TEXT PRIMARY KEY,           -- Unique identifier (auto-generated UUID)
    user_id TEXT NOT NULL,       -- Firebase Auth UID
    hanzi TEXT NOT NULL,         -- Hanzi character
    pinyin TEXT NOT NULL,        -- Pinyin pronunciation
    meaning TEXT NOT NULL,         -- Vietnamese meaning
    word_id TEXT,                -- Reference to words table ID
    fail_count INTEGER DEFAULT 0, -- Number of times user got this wrong
    last_failed_at TIMESTAMPTZ,  -- Last time user got this wrong
    is_mastered BOOLEAN DEFAULT false, -- Whether user has mastered this word
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, hanzi)
);

-- 3. Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notebook_user_id ON public.notebook(user_id);
CREATE INDEX IF NOT EXISTS idx_notebook_fail_count ON public.notebook(fail_count DESC);
CREATE INDEX IF NOT EXISTS idx_notebook_last_failed ON public.notebook(last_failed_at DESC);

-- 4. Enable RLS
ALTER TABLE public.notebook ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notebook
CREATE POLICY "Users can manage own notebook" ON public.notebook
    FOR ALL USING (auth.uid() = user_id);

-- 2. Create index for faster random selection
CREATE INDEX IF NOT EXISTS idx_words_id ON public.words(id);

-- 3. Enable RLS (optional - for production)
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access for quiz
CREATE POLICY "Allow public read words" ON public.words
    FOR SELECT USING (true);

-- 4. Insert sample words (run this separately or via API)
-- Sample 10 words for testing the quiz:
/*
INSERT INTO public.words (id, hanzi, pinyin, meaning, level) VALUES
('早餐', '早餐', 'zǎo cān', 'bữa sáng', '1'),
('豆浆', '豆浆', 'dòu jiāng', 'sữa đậu nành', '1'),
('便宜', '便宜', 'pián yi', 'rẻ', '1'),
('中国', '中国', 'Zhōngguó', 'Trung Quốc', '1'),
('学习', '学习', 'xué xí', 'học', '1'),
('工作', '工作', 'gōng zuò', 'làm việc', '1'),
('朋友', '朋友', 'péng you', 'bạn bè', '1'),
('喜欢', '喜欢', 'xǐ huan', 'yêu thích', '1'),
('吃饭', '吃饭', 'chī fàn', 'ăn cơm', '1'),
('水', '水', 'shuǐ', 'nước', '1')
ON CONFLICT (id) DO NOTHING;
*/

-- To populate with the full ~7700 words from hsk_words_viet.json:
-- You can use the Supabase dashboard or run a script to import the JSON data
