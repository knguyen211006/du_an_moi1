import { supabase } from './client';

// Notebook word type
export interface NotebookWord {
  id: string;
  user_id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  word_id?: string;
  fail_count: number;
  last_failed_at?: string;
  is_mastered: boolean;
  created_at: string;
}

/**
 * Add a word to the user's notebook
 * If it already exists, increment fail_count and update last_failed_at
 */
export async function addWordToNotebook(
  userId: string,
  word: {
    hanzi: string;
    pinyin: string;
    meaning: string;
    wordId?: string;
  },
  isError: boolean = false
): Promise<boolean> {
  try {
    // First check if the word already exists
    const { data: existing, error: checkError } = await supabase
      .from('notebook')
      .select('id, fail_count')
      .eq('user_id', userId)
      .eq('hanzi', word.hanzi)
      .single();

    if (checkError && checkError.code !== 'PGRP116') {
      // PGRP116 = no rows returned (not an error, just doesn't exist)
      console.error('Error checking notebook:', checkError);
    }

    if (existing) {
      // Word exists - update fail_count and timestamp
      const { error: updateError } = await supabase
        .from('notebook')
        .update({
          fail_count: existing.fail_count + 1,
          last_failed_at: new Date().toISOString(),
          is_mastered: false, // Reset mastery on wrong answer
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating notebook:', updateError);
        return false;
      }
    } else {
      // Word doesn't exist - insert new row
      const { error: insertError } = await supabase
        .from('notebook')
        .insert({
          user_id: userId,
          hanzi: word.hanzi,
          pinyin: word.pinyin,
          meaning: word.meaning,
          word_id: word.wordId || word.hanzi,
          fail_count: isError ? 1 : 0,
          last_failed_at: isError ? new Date().toISOString() : null,
          is_mastered: false,
        });

      if (insertError) {
        console.error('Error inserting to notebook:', insertError);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Error in addWordToNotebook:', err);
    return false;
  }
}

/**
 * Record a wrong answer - increment fail_count and update timestamp
 */
export async function recordWrongAnswer(
  userId: string,
  word: {
    hanzi: string;
    pinyin: string;
    meaning: string;
    wordId?: string;
  }
): Promise<boolean> {
  return addWordToNotebook(userId, word, true);
}

/**
 * Get all words that need practice (not mastered, sorted by fail_count)
 */
export async function getWrongWords(userId: string): Promise<NotebookWord[]> {
  try {
    const { data, error } = await supabase
      .from('notebook')
      .select('*')
      .eq('user_id', userId)
      .eq('is_mastered', false)
      .order('fail_count', { ascending: false })
      .order('last_failed_at', { ascending: false });

    if (error) {
      console.error('Error fetching wrong words:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getWrongWords:', err);
    return [];
  }
}

/**
 * Get all notebook words for a user
 */
export async function getAllNotebookWords(userId: string): Promise<NotebookWord[]> {
  try {
    const { data, error } = await supabase
      .from('notebook')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notebook words:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getAllNotebookWords:', err);
    return [];
  }
}

/**
 * Mark a word as mastered or not mastered
 */
export async function toggleMastered(
  wordId: string,
  isMastered: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notebook')
      .update({ is_mastered: isMastered })
      .eq('id', wordId);

    if (error) {
      console.error('Error toggling mastered:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in toggleMastered:', err);
    return false;
  }
}

/**
 * Remove a word from notebook
 */
export async function removeFromNotebook(wordId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notebook')
      .delete()
      .eq('id', wordId);

    if (error) {
      console.error('Error removing from notebook:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in removeFromNotebook:', err);
    return false;
  }
}

/**
 * Get practice words - those with fail_count > 0 or recently failed
 */
export async function getPracticeWords(userId: string, limit: number = 10): Promise<NotebookWord[]> {
  try {
    const { data, error } = await supabase
      .from('notebook')
      .select('*')
      .eq('user_id', userId)
      .gt('fail_count', 0)
      .order('last_failed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching practice words:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getPracticeWords:', err);
    return [];
  }
}

/**
 * Record correct answer - decrement fail_count
 * If fail_count reaches 0, set is_mastered = true
 */
export async function recordCorrectAnswer(wordId: string): Promise<boolean> {
  try {
    // First get current fail_count
    const { data: word, error: fetchError } = await supabase
      .from('notebook')
      .select('fail_count')
      .eq('id', wordId)
      .single();

    if (fetchError || !word) {
      console.error('Error fetching word:', fetchError);
      return false;
    }

    const newFailCount = Math.max(0, (word.fail_count || 0) - 1);
    const isMastered = newFailCount === 0;

    const { error: updateError } = await supabase
      .from('notebook')
      .update({
        fail_count: newFailCount,
        is_mastered: isMastered,
      })
      .eq('id', wordId);

    if (updateError) {
      console.error('Error updating correct answer:', updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in recordCorrectAnswer:', err);
    return false;
  }
}

/**
 * Record incorrect answer - increment fail_count
 */
export async function recordIncorrectAnswer(wordId: string): Promise<boolean> {
  try {
    // First get current fail_count
    const { data: word, error: fetchError } = await supabase
      .from('notebook')
      .select('fail_count')
      .eq('id', wordId)
      .single();

    if (fetchError || !word) {
      console.error('Error fetching word:', fetchError);
      return false;
    }

    const { error: updateError } = await supabase
      .from('notebook')
      .update({
        fail_count: (word.fail_count || 0) + 1,
        last_failed_at: new Date().toISOString(),
        is_mastered: false, // Reset mastery on wrong answer
      })
      .eq('id', wordId);

    if (updateError) {
      console.error('Error updating incorrect answer:', updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in recordIncorrectAnswer:', err);
    return false;
  }
}

/**
 * Get all wrong words (not mastered) for practice
 */
export async function getWrongWordsForPractice(userId: string, limit: number = 10): Promise<NotebookWord[]> {
  try {
    const { data, error } = await supabase
      .from('notebook')
      .select('*')
      .eq('user_id', userId)
      .eq('is_mastered', false)
      .order('fail_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching wrong words:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getWrongWordsForPractice:', err);
    return [];
  }
}
