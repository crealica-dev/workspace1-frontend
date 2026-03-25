import { browser } from '$app/environment';
import type { Session } from '@supabase/supabase-js';
import { derived, get, writable } from 'svelte/store';

import { getSupabaseClient, hasSupabaseConfig, supabaseConfigError } from '$lib/supabase/client';

export type AuthNotice = {
	type: 'success' | 'error' | 'info';
	message: string;
};

const sessionStore = writable<Session | null>(null);
const loadingStore = writable(true);
const noticeStore = writable<AuthNotice | null>(null);

let initialized = false;
let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
	if (!browser) {
		return;
	}

	if (initialized && initPromise) {
		await initPromise;
		return;
	}

	initPromise = (async () => {
		if (!hasSupabaseConfig) {
			noticeStore.set({
				type: 'error',
				message: supabaseConfigError ?? 'Supabase configuration is missing.',
			});
			loadingStore.set(false);
			initialized = true;
			return;
		}

		const supabase = getSupabaseClient();
		const {
			data: { session },
			error,
		} = await supabase.auth.getSession();

		if (error) {
			noticeStore.set({ type: 'error', message: error.message });
		}

		sessionStore.set(session);
		loadingStore.set(false);

		supabase.auth.onAuthStateChange((_event, nextSession) => {
			sessionStore.set(nextSession);
			loadingStore.set(false);
		});

		initialized = true;
	})();

	await initPromise;
}

function clearNotice() {
	noticeStore.set(null);
}

async function signInWithPassword(email: string, password: string): Promise<boolean> {
	await init();

	if (!hasSupabaseConfig) {
		return false;
	}

	const supabase = getSupabaseClient();
	loadingStore.set(true);
	clearNotice();

	const { error } = await supabase.auth.signInWithPassword({ email, password });

	if (error) {
		noticeStore.set({ type: 'error', message: error.message });
		loadingStore.set(false);
		return false;
	}

	noticeStore.set({ type: 'success', message: 'Signed in successfully.' });
	loadingStore.set(false);
	return true;
}

async function signUpWithPassword(email: string, password: string): Promise<boolean> {
	await init();

	if (!hasSupabaseConfig) {
		return false;
	}

	const supabase = getSupabaseClient();
	loadingStore.set(true);
	clearNotice();

	const { data, error } = await supabase.auth.signUp({ email, password });

	if (error) {
		noticeStore.set({ type: 'error', message: error.message });
		loadingStore.set(false);
		return false;
	}

	if (data.session) {
		sessionStore.set(data.session);
		noticeStore.set({ type: 'success', message: 'Account created and signed in.' });
	} else {
		noticeStore.set({
			type: 'info',
			message: 'Account created. Check your email to confirm your address.',
		});
	}

	loadingStore.set(false);
	return true;
}

async function signOut(): Promise<boolean> {
	await init();

	if (!hasSupabaseConfig) {
		sessionStore.set(null);
		return false;
	}

	const supabase = getSupabaseClient();
	loadingStore.set(true);
	clearNotice();

	const { error } = await supabase.auth.signOut();

	if (error) {
		noticeStore.set({ type: 'error', message: error.message });
		loadingStore.set(false);
		return false;
	}

	sessionStore.set(null);
	noticeStore.set({ type: 'info', message: 'Signed out.' });
	loadingStore.set(false);
	return true;
}

function getSessionSnapshot(): Session | null {
	return get(sessionStore);
}

export const auth = {
	session: sessionStore,
	user: derived(sessionStore, ($session) => $session?.user ?? null),
	loading: loadingStore,
	notice: noticeStore,
	init,
	clearNotice,
	signInWithPassword,
	signUpWithPassword,
	signOut,
	getSessionSnapshot,
};
