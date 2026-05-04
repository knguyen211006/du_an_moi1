-- ============================================
-- HSK Test Room: RAG Error Ledger Schema
-- Database: Supabase (PostgreSQL + pgvector)
-- ============================================

-- 1. Enable pgvector extension for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the user_mistakes table (Error Ledger)
CREATE TABLE IF NOT EXISTS public.user_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    character TEXT NOT NULL,
    mistake_summary TEXT NOT NULL,
    embedding VECTOR(768), -- Gemini embedding-001 produces 768 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_user_mistakes_user_id ON public.user_mistakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mistakes_character ON public.user_mistakes(character);

-- 4. Create vector similarity search function (RPC)
-- This function will be called from the Next.js API route
CREATE OR REPLACE FUNCTION match_user_mistakes(
    query_embedding VECTOR(768),
    match_user_id TEXT,
    match_character TEXT,
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    character TEXT,
    mistake_summary TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        um.id,
        um.user_id,
        um.character,
        um.mistake_summary,
        1 - (um.embedding <=> query_embedding) AS similarity
    FROM public.user_mistakes um
    WHERE um.user_id = match_user_id
      AND um.character = match_character
      AND 1 - (um.embedding <=> query_embedding) > match_threshold
    ORDER BY um.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 5. Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own mistakes
CREATE POLICY "Users can read own mistakes" ON public.user_mistakes
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Service role can insert/update all (for server-side API)
CREATE POLICY "Service role can insert mistakes" ON public.user_mistakes
    FOR INSERT WITH CHECK (true);

