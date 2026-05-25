const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL?.trim();
const publicAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const functionNameEnv =
  import.meta.env.VITE_SUPABASE_FUNCTION_NAME?.trim() || 'make-server-b8526fa6';

if (!supabaseUrlEnv) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!publicAnonKeyEnv) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

export const supabaseUrl = supabaseUrlEnv.replace(/\/+$/, '');
export const publicAnonKey = publicAnonKeyEnv;
export const supabaseFunctionName = functionNameEnv;
export const edgeFunctionBaseUrl = `${supabaseUrl}/functions/v1/${supabaseFunctionName}`;

export function buildFunctionHeaders(token?: string, contentType = 'application/json'): Record<string, string> {
  const authToken = token || publicAnonKey;

  return {
    'Content-Type': contentType,
    apikey: publicAnonKey,
    Authorization: `Bearer ${authToken}`,
  };
}

const projectMatch = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co$/);

if (!projectMatch) {
  throw new Error('VITE_SUPABASE_URL must look like https://<project-ref>.supabase.co');
}

export const projectId = projectMatch[1];
