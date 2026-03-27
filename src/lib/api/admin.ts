import { apiBaseUrl } from '$lib/config';

// ── Types ────────────────────────────────────────────────────────────────────

export type RuntimeSettings = {
	chat_model: string;
	text_gen_model: string;
	image_gen_model: string;
	sse_keepalive_seconds: number;
	job_status_poll_seconds: number;
};

export type AdminSettingsResponse = {
	runtime: RuntimeSettings;
	available_text_models: string[];
	available_image_models: Record<string, string>;
};

export type AdminSettingsUpdateRequest = Partial<RuntimeSettings>;

export type HealthComponent = {
	status: 'ok' | 'degraded' | 'error';
	[key: string]: unknown;
};

export type AdminHealthDetail = {
	status: 'ok' | 'degraded' | 'error';
	components: Record<string, HealthComponent>;
	python_version: string;
	platform: string;
};

export type AdminEnvSnapshot = {
	app_name: string;
	project_name: string;
	api_prefix: string;
	storage_bucket: string;
	sse_keepalive_seconds: number;
	job_status_poll_seconds: number;
	storage_signed_url_ttl_seconds: number;
	providers_configured: Record<string, boolean>;
};

// ── Client ───────────────────────────────────────────────────────────────────

export class AdminApiClient {
	private token: string;
	private base: string;

	constructor(token: string) {
		this.token = token;
		this.base = apiBaseUrl;
	}

	private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
		const res = await fetch(`${this.base}${path}`, {
			method,
			headers: {
				Authorization: `Bearer ${this.token}`,
				'Content-Type': 'application/json'
			},
			body: body !== undefined ? JSON.stringify(body) : undefined
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({ detail: res.statusText }));
			throw new Error((err as { detail?: string }).detail ?? res.statusText);
		}
		if (res.status === 204) return undefined as T;
		return res.json() as Promise<T>;
	}

	getSettings(): Promise<AdminSettingsResponse> {
		return this.request('GET', '/admin/settings');
	}

	updateSettings(patch: AdminSettingsUpdateRequest): Promise<AdminSettingsResponse> {
		return this.request('PUT', '/admin/settings', patch);
	}

	getHealth(): Promise<AdminHealthDetail> {
		return this.request('GET', '/admin/health/detail');
	}

	getEnv(): Promise<AdminEnvSnapshot> {
		return this.request('GET', '/admin/env');
	}

	logout(): Promise<void> {
		return this.request('POST', '/admin/logout');
	}
}

// ── Login helper (no token needed) ───────────────────────────────────────────

export async function adminLogin(password: string): Promise<string> {
	const res = await fetch(`${apiBaseUrl}/admin/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ password })
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ detail: 'Login failed' }));
		throw new Error((err as { detail?: string }).detail ?? 'Login failed');
	}
	const data = (await res.json()) as { token: string };
	return data.token;
}
