import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, publicAnonKey, supabaseUrl } from '/utils/supabase/info';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

const resolvedSupabaseUrl = isSupabaseConfigured ? supabaseUrl : FALLBACK_SUPABASE_URL;
const resolvedSupabaseAnonKey = isSupabaseConfigured ? publicAnonKey : FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    storageKey: 'sb-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});
