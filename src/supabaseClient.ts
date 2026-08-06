import { createClient } from '@supabase/supabase-js';

// Values injected from VITE_ env vars — never hardcoded in source
const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const isSupabaseConfigured = Boolean(
  rawUrl && 
  rawKey && 
  !rawUrl.includes('placeholder') && 
  !rawUrl.includes('your-supabase') && 
  rawUrl.startsWith('https://')
);

if (!isSupabaseConfigured) {
  console.log('ℹ️ [Delta Stars] Supabase not active or using fallback offline catalog mode.');
}

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: { persistSession: true, autoRefreshToken: isSupabaseConfigured },
    realtime: {
      params: { eventsPerSecond: 10 },
      // Disable realtime auto-connect if Supabase is not properly configured
      timeout: 5000,
    },
    global: {
      headers: {
        'x-application-name': 'delta-stars-store',
        'x-application-version': import.meta.env.VITE_APP_VERSION || '1.0.0',
      },
    },
  }
);

export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  // Fast 1.5-second timeout race to prevent network timeout stalls from blocking app boot
  const timeoutPromise = new Promise<boolean>((resolve) => 
    setTimeout(() => {
      console.warn('⚠️ [Supabase] Connection check timed out after 1500ms. Defaulting to fallback catalog.');
      resolve(false);
    }, 1500)
  );

  const queryPromise = (async () => {
    try {
      const { error } = await supabase.from('products').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  })();

  return Promise.race([queryPromise, timeoutPromise]);
}

