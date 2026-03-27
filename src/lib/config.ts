import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

export const apiBaseUrl: string = env.PUBLIC_API_BASE_URL ||
	(browser ? `http://${window.location.hostname}:8000` : 'http://127.0.0.1:8000');
export const mcpBaseUrl: string = env.PUBLIC_MCP_BASE_URL || `${apiBaseUrl}/mcp`;
export const supabaseUrl = env.PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || '';
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigError = hasSupabaseConfig
	? null
	: 'Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY in the frontend environment.';
