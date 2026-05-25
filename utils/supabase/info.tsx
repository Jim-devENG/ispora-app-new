const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const rawPublicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';
const functionNameEnv =
  import.meta.env.VITE_SUPABASE_FUNCTION_NAME?.trim() || 'make-server-b8526fa6';

export const supabaseUrl = rawSupabaseUrl.replace(/\/+$/, '');
export const publicAnonKey = rawPublicAnonKey;
export const supabaseFunctionName = functionNameEnv;
export const edgeFunctionBaseUrl = supabaseUrl
  ? `${supabaseUrl}/functions/v1/${supabaseFunctionName}`
  : '';

const projectMatch = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co$/);
export const projectId = projectMatch?.[1] || '';

export function getMissingSupabaseConfigKeys(): string[] {
  const missing: string[] = [];

  if (!supabaseUrl) {
    missing.push('VITE_SUPABASE_URL');
  }

  if (!publicAnonKey) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  if (supabaseUrl && !projectMatch) {
    missing.push('VITE_SUPABASE_URL (must be https://<project-ref>.supabase.co)');
  }

  return missing;
}

export const isSupabaseConfigured = getMissingSupabaseConfigKeys().length === 0;

export function buildFunctionHeaders(
  token?: string,
  contentType = 'application/json',
): Record<string, string> {
  const authToken = token || publicAnonKey || '';

  return {
    'Content-Type': contentType,
    // Note: Authorization header is sufficient for our edge function authentication
    // Removed 'apikey' header to avoid CORS preflight issues on platforms with strict CORS rules
    Authorization: `Bearer ${authToken}`,
  };
}
