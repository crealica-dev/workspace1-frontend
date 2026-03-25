import { env } from '$env/dynamic/public';

export const apiBaseUrl = env.PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
export const supabaseUrl = env.PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || '';
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigError = hasSupabaseConfig
	? null
	: 'Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in the frontend environment.';
