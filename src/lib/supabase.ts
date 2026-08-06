import { createClient } from '@supabase/supabase-js';

// These variables should be added to .env.example
// The client is initialized lazily to avoid crashing on startup if variables are missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Ensures the Supabase client is available before use.
 * Throws a clear error if the environment variables are not set.
 */
export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured.');
  }
  return supabase;
}
