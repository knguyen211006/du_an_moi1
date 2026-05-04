# Project Name: 汉字大师 (Hanzi Master)
# Goal: Create a professional modern Hanzi learning platform, inspired by nhaikanji.com.

## 1. Tech Stack
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand.
- Backend: Firebase 10 (Firestore, Firebase Auth, Firebase Functions).
- AI Assistant: Google Gemini API (integrated via Firebase Functions).
- Handwriting & Animation: HanziLookupJS, hanzi-writer.
- Audio: Web Speech API (SpeechSynthesis).

## 2. Visual Style & UI/UX
- Language: 100% Simplified Chinese (简体中文) for all UI elements, tooltips, modals.
- Vibe: Clean, minimal, modern, highly educational.
- Colors: 
  - Primary: Deep Blue (#1e40af)
  - Accent: Warm Orange (#f59e0b)
  - Background: Soft off-white (#f8f5f0) with subtle paper texture.
- Dark Mode: Supported (Toggle in header).
- Typography: Noto Sans SC (for Chinese), Inter (for Pinyin/Latin).
- Elements: Massive Hanzi display (4rem+), rounded-2xl cards, soft shadows, hover lift effects. Smooth Framer Motion animations.

## 3. Core Features
1. Navigation: Top nav with Logo, huge Search Bar, Links (首页, 按级别, 部首, 练字, 闪卡, 我的进度, AI助手).
2. Global Search: Includes text search and a "手写搜索" (Handwriting search) button that opens a canvas.
3. Browse: By HSK 1-6 levels and 214 Radicals.
4. Hanzi Detail Page: Huge Hanzi, stroke order animation, pinyin (color-coded by tone), meanings, 3-5 example sentences (with audio playback), decomposition (拆字).
5. Writing Practice: Guided stroke-by-stroke drawing with real-time feedback.
6. Flashcards: Spaced repetition system (Anki-like), public/private decks.
7. Dashboard: User streak, heatmap, learned count.
8. AI Chatbot (Gemini): Floating pulsing orb (blue-orange). User highlights text -> clicks "问 Gemini" -> popup explains Hanzi, pinyin, meaning, usage, and mnemonics in natural Chinese. Max 50 requests/day/user (rate limited via Firestore).