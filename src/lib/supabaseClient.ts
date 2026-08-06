// Re-export from root supabaseClient to avoid duplicate clients
export { supabase, checkSupabaseConnection, isSupabaseConfigured } from '../supabaseClient';
export { supabase as default } from '../supabaseClient';
