import { browser } from '$app/environment';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { hasSupabaseConfig, supabaseAnonKey, supabaseConfigError, supabaseUrl } from '$lib/config';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
	if (!browser) {
		throw new Error('Supabase client is only available in the browser.');
	}

	if (!hasSupabaseConfig) {
		throw new Error(supabaseConfigError ?? 'Supabase configuration is missing.');
	}

	client ??= createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			autoRefreshToken: true,
			detectSessionInUrl: true,
			persistSession: true,
		},
	});

	return client;
}

export { hasSupabaseConfig, supabaseConfigError };
