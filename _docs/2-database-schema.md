# Database: Firebase Firestore (NoSQL)

## Collection: `users`
- `uid` (string, Document ID)
- `email` (string)
- `displayName` (string)
- `photoURL` (string)
- `dailyAIRequests` (number, reset daily)
- `lastAIRequestDate` (timestamp)
- `streak` (number)
- `createdAt` (timestamp)

## Collection: `hanzi` (Contains ~3000 HSK 3.0 Hanzi)
- `hanzi` (string, Document ID) - e.g., "我"
- `pinyin` (string)
- `tones` (array of numbers)
- `radical` (string)
- `strokes` (number)
- `hskLevel` (number, 1-6)
- `meaning` (string)
- `decomposition` (string)
- `strokeOrderSVG` (string/array)
- `exampleSentences` (array of objects: { sentence: string, pinyin: string, translation: string })

## Collection: `flashcards` (Spaced Repetition)
- `id` (string, Document ID)
- `userId` (string, references users.uid)
- `hanzi` (string, references hanzi.hanzi)
- `interval` (number, days)
- `repetition` (number)
- `easeFactor` (number)
- `nextReviewDate` (timestamp)

## Collection: `progress_logs` (For Heatmap)
- `id` (string, Document ID)
- `userId` (string)
- `date` (string, YYYY-MM-DD format for easy querying)
- `hanziLearned` (array of strings)

---

# Database: Supabase (PostgreSQL + pgvector) — RAG Error Ledger

Used exclusively for the HSK Test Room's Retrieval-Augmented Generation (RAG) pipeline.

## Table: `user_mistakes`
Stores vector embeddings of user handwriting errors so the AI can remember and reference past mistakes during grading.

- `id` (UUID, Primary Key, auto-generated)
- `user_id` (TEXT, NOT NULL) — Firebase Auth UID
- `character` (TEXT, NOT NULL) — The Hanzi character being tested
- `mistake_summary` (TEXT, NOT NULL) — One-sentence summary of the error (e.g., "Left radical too narrow")
- `embedding` (VECTOR(768)) — Gemini `embedding-001` vector representation
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

## RPC Function: `match_user_mistakes`
Performs vector similarity search with filtering by `user_id` and `character`.

Parameters:
- `query_embedding` (VECTOR(768))
- `match_user_id` (TEXT)
- `match_character` (TEXT)
- `match_threshold` (FLOAT) — minimum cosine similarity (e.g., 0.7)
- `match_count` (INT) — max results to return

Returns: `TABLE(id, user_id, character, mistake_summary, similarity)`

## Setup
Run `_docs/4-rag-schema.sql` in the Supabase SQL Editor to enable `pgvector` and create the table + function.
