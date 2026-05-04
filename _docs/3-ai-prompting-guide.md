# Rules for AI Coding Assistant

1. READ CONTEXT FIRST: Always refer to `1-requirements.md` and `2-database-schema.md` before generating code.
2. DIVIDE AND CONQUER: Do NOT write the entire application at once. Write code specifically for the component or feature requested by the user.
3. FIREBASE ONLY: Use Firebase Client SDK for the frontend and Firebase Admin SDK for server-side logic / server actions. Do NOT use Prisma or PostgreSQL.
4. TAILWIND & SHADCN: Use Tailwind CSS for all styling. If UI components are needed, assume we will use shadcn/ui.
5. LANGUAGE: All code comments should be in English. All user-facing UI text, buttons, and placeholders MUST be in Simplified Chinese (简体中文).
6. EXPORTING: Always use standard Next.js App Router conventions (e.g., `export default function Page()`).