import { supabase } from './supabaseClient';

export interface UserProfile {
  exp: number;
  level: number;
}

/**
 * Fetches user profile from Supabase profiles table.
 *
 * @param userId - Supabase auth user UUID
 * @returns UserProfile object or null if not found / error
 */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('exp, level')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile from Supabase:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      exp: typeof data.exp === 'number' ? data.exp : Number(data.exp || 0),
      level: typeof data.level === 'number' ? data.level : Number(data.level || 1),
    };
  } catch (err: unknown) {
    console.error('Unexpected error in fetchProfile:', err);
    return null;
  }
}

/**
 * Upserts user profile in Supabase profiles table.
 *
 * @param userId - Supabase auth user UUID
 * @param exp - Cumulative or current level experience
 * @param level - Player level
 * @returns Updated UserProfile or null on failure
 */
export async function upsertProfile(
  userId: string,
  exp: number,
  level: number
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, exp, level })
      .select('exp, level')
      .single();

    if (error) {
      console.error('Error upserting profile in Supabase:', error.message);
      return null;
    }

    return {
      exp: typeof data?.exp === 'number' ? data.exp : exp,
      level: typeof data?.level === 'number' ? data.level : level,
    };
  } catch (err: unknown) {
    console.error('Unexpected error in upsertProfile:', err);
    return null;
  }
}

/**
 * Inserts a completed quiz session into the learning_sessions table.
 *
 * @param userId - Supabase auth user UUID
 * @param category - Problem category (e.g., 'gugudan', '2x1', etc.)
 * @param total - Total number of questions (e.g. 10)
 * @param correct - Number of correct answers
 * @param earned_exp - Experience points earned during the session
 * @returns True if successfully inserted, false otherwise
 */
export async function insertSession(
  userId: string,
  category: string,
  total: number,
  correct: number,
  earned_exp: number
): Promise<boolean> {
  try {
    const { error } = await supabase.from('learning_sessions').insert({
      user_id: userId,
      category,
      total_questions: total,
      correct_count: correct,
      earned_exp,
    });

    if (error) {
      console.error('Error inserting learning session in Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err: unknown) {
    console.error('Unexpected error in insertSession:', err);
    return false;
  }
}
