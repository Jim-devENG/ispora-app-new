import { createClient } from '@supabase/supabase-js';
import { publicAnonKey, supabaseUrl } from '/utils/supabase/info';

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    storageKey: 'sb-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
  },
});
