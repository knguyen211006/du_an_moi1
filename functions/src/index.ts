import { onRequest } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import Groq from "groq-sdk";

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

export const groqChat = onRequest(
  {
    cors: true, // Firebase v2 sẽ tự động cho phép mọi Origin (localhost:3000)
    region: "asia-southeast1", // stream sẽ nhanh hơn
    secrets: ["GROQ_API_KEY"]  // Load biến môi trường chứa API Key
  },
  async (request: any, response: any) => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      // Extract and verify Firebase Auth Bearer token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = await auth.verifyIdToken(token);
      const uid = decoded.uid;

      // Rate limiting with Firestore transaction
      const userLimitsRef = db.collection('userLimits').doc(uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of day UTC

      await db.runTransaction(async (transaction: any) => {
        const doc = await transaction.get(userLimitsRef);
        const now = admin.firestore.Timestamp.now();
        let dailyCount = 0;
        let lastReset: admin.firestore.Timestamp | null = null;

        if (doc.exists) {
          const data = doc.data()!;
          lastReset = data.lastReset;
          dailyCount = data.dailyCount || 0;

          // Reset if new day (compare seconds to avoid timezone issues)
          if (lastReset && lastReset.toDate() < today) {
            dailyCount = 0;
          }
        }

        if (dailyCount >= 50) {
          throw new Error('Rate limit exceeded');
        }

        transaction.set(userLimitsRef, {
          dailyCount: dailyCount + 1,
          lastReset: admin.firestore.Timestamp.fromDate(today),
          updatedAt: now,
        });
      });

      // Parse request body for message
      let messages: any[] = [{ role: "system", content: "..." }];
      try {
        const body = await new Promise<any>((resolve, reject) => {
          let data = '';
          request.on('data', (chunk: any) => data += chunk);
          request.on('end', () => resolve(JSON.parse(data)));
          request.on('error', reject);
        });
        if (body.messages && Array.isArray(body.messages)) {
          messages = body.messages;
        } else if (body.message) {
          messages = [{ role: "user", content: body.message }];
        }
      } catch (e) {
        console.error('Invalid JSON body', e);
      }

      // Initialize Groq and stream
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY!,
      });

      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      try {
        const stream = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a friendly Chinese language tutor for the Hanzi Master app. Help users learn Hanzi, Pinyin, vocabulary, grammar. Provide clear explanations, examples, and practice tips. Respond naturally and engagingly in the user's preferred language (default to English if unclear). Be encouraging and patient.",
            },
            ...messages,
          ],
          max_tokens: 2048,
          stream: true,
        });

        let fullText = '';

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            response.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
          }
        }

        response.write('data: [DONE]\n\n');
      } catch (streamError: any) {
        console.error('Groq stream error:', streamError);
        response.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      }

      response.end();
      return;

    } catch (error: any) {
      console.error('GroqChat endpoint error:', error);

      if (error.code === 'auth/invalid-id-token' || error.message.includes('verifyIdToken')) {
        response.status(401).json({ error: 'Invalid token' });
      } else if (error.message === 'Rate limit exceeded') {
        response.status(429).json({ error: 'Rate limit exceeded (50 reqs/day). Try again tomorrow.' });
      } else {
        response.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);