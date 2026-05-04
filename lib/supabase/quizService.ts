import { supabase } from './client';

// Quiz question type matching the format used in app/lessons/[id]/quiz/page.tsx
export interface QuizQuestion {
  id: number;
  word_id?: string;
  hanzi: string;
  pinyin: string;
  question: string;
  options: string[];
  correctAnswer: string;
}


// Word type from the words table
interface Word {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  level: string;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate quiz questions by fetching random words from the database
 * @param limit - Number of questions to generate (default: 3)
 * @returns Array of formatted quiz questions
 */
export async function generateQuizQuestions(limit: number = 3): Promise<QuizQuestion[]> {
  try {
    // Generate a random offset to get random words
    // Assuming approximately 9000 words in the database for random selection
    const randomOffset = Math.floor(Math.random() * 9000);

    // Fetch 20 words from the database using the random offset
    const { data: words, error } = await supabase
      .from('words')
      .select('id, hanzi, pinyin, meaning, level')
      .range(randomOffset, randomOffset + 19);

    if (error) {
      console.error('Error fetching words:', error);
      throw new Error('Failed to fetch words from database');
    }

    if (!words || words.length === 0) {
      console.warn('No words fetched, trying without offset');
      // Fallback: fetch any 20 words
      const { data: fallbackWords, error: fallbackError } = await supabase
        .from('words')
        .select('id, hanzi, pinyin, meaning, level')
        .limit(20);

      if (fallbackError || !fallbackWords || fallbackWords.length === 0) {
        throw new Error('No words available in database');
      }

      return generateQuestionsFromWords(fallbackWords, limit);
    }

    return generateQuestionsFromWords(words, limit);
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw error;
  }
}

/**
 * Generate quiz questions from a list of words
 * @param words - Array of words from database
 * @param limit - Number of questions to generate
 * @returns Array of formatted quiz questions
 */
function generateQuestionsFromWords(words: Word[], limit: number): QuizQuestion[] {
  // Shuffle all words and select the first 'limit' as questions
  const shuffledWords = shuffleArray(words);
  const selectedWords = shuffledWords.slice(0, limit);
  const remainingWords = shuffledWords.slice(limit);

  const questions: QuizQuestion[] = selectedWords.map((word, index) => {
    // Get 3 wrong meanings from remaining words
    const wrongOptions = shuffleArray(remainingWords)
      .slice(0, 3)
      .map((w) => w.meaning);

    // Create options array with correct answer + 3 wrong answers
    const options = shuffleArray([word.meaning, ...wrongOptions]);

    return {
      id: index + 1,
      word_id: word.id,
      hanzi: word.hanzi,
      pinyin: word.pinyin,
      question: `What does ${word.hanzi} mean?`,
      options: options,
      correctAnswer: word.meaning,
    };

  });

  return questions;
}
