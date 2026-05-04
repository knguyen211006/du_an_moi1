import { useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { User } from 'firebase/auth';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function useGroqStream() {
  const getFunctionUrl = useCallback(() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost') {
      // Firebase Emulator
      return 'http://localhost:5001/hanzi-master-ff916/us-central1/groqChat';
    } else {
      // Production - replace with your region/project
      return 'https://us-central1-hanzi-master-ff916.cloudfunctions.net/groqChat';
    }
  }, []);

const sendMessage = useCallback(async (messages: GroqMessage[], onChunk?: (chunk: string) => void) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const idToken = await currentUser.getIdToken();

    const response = await fetch(getFunctionUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Max 50 requests per day.');
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              onChunk?.('');
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                onChunk?.(data.text);
              }
            } catch (e) {
              console.error('JSON parse error:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }, [getFunctionUrl]);

  return { sendMessage };
}

