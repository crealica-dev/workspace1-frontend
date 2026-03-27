import { apiBaseUrl } from '$lib/config';

export type Project = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	owner_user_id: string;
	workspace_id: string | null;
	metadata: Record<string, unknown>;
	created_at: string | null;
	updated_at: string | null;
};

export type ChatSession = {
	id: string;
	project_id: string;
	owner_user_id: string;
	session_type: string;
	title: string | null;
	status: string;
	created_at: string | null;
	updated_at: string | null;
};

export type SessionEvent = {
	id: string;
	project_id: string;
	session_id: string;
	owner_user_id: string;
	auth_session_id?: string;
	event_type: string;
	role: string | null;
	name?: string | null;
	content: string | null;
	job_id?: string | null;
	asset_version_id?: string | null;
	payload: Record<string, unknown>;
	metadata: Record<string, unknown>;
	created_at: string | null;
};

export type ConversationAttachment = {
	key?: string | null;
	asset_id?: string | null;
	asset_version_id: string;
	display_name: string;
	asset_type: string;
	mime_type: string | null;
	size_bytes?: number | null;
	signed_url?: string | null;
	preview_kind?: string | null;
	storage_path?: string | null;
};

export type ToolDescriptor = {
	id: string;
	name: string;
	server: string;
	description: string;
	inputSchema: Record<string, unknown>;
	outputHints: string[];
	enabled: boolean;
	supportsFiles: boolean;
};

export type ToolInvocation = {
	tool_name: string;
	arguments: Record<string, unknown>;
	attachment_version_ids: string[];
};

export type ToolResult = {
	tool_name: string;
	value: unknown;
	content: string;
	text?: string | null;
	assets: ConversationAttachment[];
};

export type ConversationItem = {
	id: string;
	eventType: string;
	role: 'user' | 'assistant' | 'tool' | null;
	name: string | null;
	content: string;
	payload: Record<string, unknown>;
	assetVersionId: string | null;
	attachments: ConversationAttachment[];
	toolInvocation: ToolInvocation | null;
	toolResult: ToolResult | null;
	preview: ConversationAttachment | null;
	createdAt: string | null;
};

export type ProjectAsset = {
	id: string;
	project_id: string;
	owner_user_id: string;
	asset_type: string;
	display_name: string;
	mime_type: string | null;
	library_path: string | null;
	latest_version_id: string | null;
	metadata: Record<string, unknown>;
	created_at: string | null;
	updated_at: string | null;
};

export type AssetVersion = {
	id: string;
	asset_id: string;
	project_id: string;
	owner_user_id: string;
	storage_bucket: string;
	storage_path: string;
	mime_type: string | null;
	size_bytes: number | null;
	version_label: string | null;
	checksum: string | null;
	metadata: Record<string, unknown>;
	created_at: string | null;
};

export type AssetUploadResponse = {
	asset: ProjectAsset;
	asset_version: AssetVersion;
};

export type ToolRunResponse = {
	tool_call_event: SessionEvent;
	tool_result_event: SessionEvent;
	asset_events: SessionEvent[];
	result: Record<string, unknown>;
};

export type BackendHealth = {
	status: string;
	app_name: string;
	project_name: string;
	storage_bucket: string;
};

export type WorkspaceConnectionStatus =
	| 'idle'
	| 'checking'
	| 'ready'
	| 'backend_down'
	| 'auth_error'
	| 'bootstrap_error';

export type WorkspaceApiErrorKind = 'network' | 'auth' | 'http' | 'invalid_response';

export type WorkspaceApiErrorDetails = {
	kind: WorkspaceApiErrorKind;
	message: string;
	userMessage: string;
	status?: number;
	path?: string;
	detail?: string;
};

export class WorkspaceApiError extends Error implements WorkspaceApiErrorDetails {
	kind: WorkspaceApiErrorKind;
	userMessage: string;
	status?: number;
	path?: string;
	detail?: string;

	constructor({
		kind,
		message,
		userMessage,
		status,
		path,
		detail,
	}: WorkspaceApiErrorDetails) {
		super(message);
		this.name = 'WorkspaceApiError';
		this.kind = kind;
		this.userMessage = userMessage;
		this.status = status;
		this.path = path;
		this.detail = detail;
	}
}

/** Extract the Supabase auth session_id from the JWT payload (no verification needed). */
function decodeJwtSessionId(jwt: string): string {
	try {
		const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
		return payload.session_id ?? payload.sub ?? 'unknown';
	} catch {
		return 'unknown';
	}
}

function isAuthStatus(status: number): boolean {
	return status === 401 || status === 403;
}

function createNetworkError(path: string, error: unknown): WorkspaceApiError {
	const detail = error instanceof Error ? error.message : 'Network request failed.';
	return new WorkspaceApiError({
		kind: 'network',
		path,
		detail,
		message: detail,
		userMessage: 'Acheulit cannot reach the backend right now. Check the API and retry.',
	});
}

function createInvalidResponseError(path: string): WorkspaceApiError {
	return new WorkspaceApiError({
		kind: 'invalid_response',
		path,
		message: 'The backend returned an invalid response.',
		userMessage: 'Acheulit received an incomplete backend response. Please retry.',
	});
}

async function readErrorDetail(res: Response): Promise<string | undefined> {
	const cloned = res.clone();
	const contentType = cloned.headers.get('content-type') ?? '';

	try {
		if (contentType.includes('application/json')) {
			const payload = await cloned.json();
			if (typeof payload?.detail === 'string') return payload.detail;
			if (typeof payload?.message === 'string') return payload.message;
			return JSON.stringify(payload);
		}

		const text = (await cloned.text()).trim();
		return text || undefined;
	} catch {
		return undefined;
	}
}

async function createResponseError(res: Response, path: string): Promise<WorkspaceApiError> {
	const detail = await readErrorDetail(res);
	const kind: WorkspaceApiErrorKind = isAuthStatus(res.status) ? 'auth' : 'http';
	const message = detail
		? `Request to ${path} failed with ${res.status}: ${detail}`
		: `Request to ${path} failed with ${res.status}`;
	const userMessage =
		kind === 'auth'
			? 'Your sign-in session was rejected by Acheulit. Sign in again and retry.'
			: detail
				? `The Acheulit API returned ${res.status}: ${detail}`
				: `The Acheulit API returned ${res.status}.`;

	return new WorkspaceApiError({
		kind,
		status: res.status,
		path,
		detail,
		message,
		userMessage,
	});
}

export function normalizeWorkspaceError(error: unknown): WorkspaceApiErrorDetails {
	if (error instanceof WorkspaceApiError) {
		return {
			kind: error.kind,
			message: error.message,
			userMessage: error.userMessage,
			status: error.status,
			path: error.path,
			detail: error.detail,
		};
	}

	if (error instanceof Error) {
		return {
			kind: 'http',
			message: error.message,
			userMessage: error.message || 'An unexpected Acheulit error occurred.',
		};
	}

	return {
		kind: 'http',
		message: 'Unknown workspace error',
		userMessage: 'An unexpected Acheulit error occurred.',
	};
}

function classifyStatusFromError(error: WorkspaceApiErrorDetails): Exclude<
	WorkspaceConnectionStatus,
	'idle' | 'checking' | 'ready'
> {
	if (error.kind === 'network') return 'backend_down';
	if (error.kind === 'auth') return 'auth_error';
	return 'bootstrap_error';
}

export function getConnectionStatusFromError(
	error: unknown,
): Exclude<WorkspaceConnectionStatus, 'idle' | 'checking' | 'ready'> {
	return classifyStatusFromError(normalizeWorkspaceError(error));
}

async function fetchWithAuth(path: string, token: string, init: RequestInit = {}): Promise<Response> {
	const sessionId = decodeJwtSessionId(token);
	let res: Response;
	const headers = new Headers(init.headers ?? {});

	if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	headers.set('Authorization', `Bearer ${token}`);
	headers.set('X-Auth-Session-Id', sessionId);

	try {
		res = await fetch(`${apiBaseUrl}${path}`, {
			...init,
			headers,
		});
	} catch (error) {
		throw createNetworkError(path, error);
	}

	if (!res.ok) {
		throw await createResponseError(res, path);
	}

	return res;
}

async function fetchWithAuthTimeout(
	path: string,
	token: string,
	timeoutMs: number,
	init: RequestInit = {},
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);

	try {
		return await fetchWithAuth(path, token, {
			...init,
			signal: controller.signal,
		});
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new WorkspaceApiError({
				kind: 'network',
				path,
				message: error.message,
				detail: error.message,
				userMessage: 'The MCP tool catalog timed out while loading. Please retry.',
			});
		}
		throw error;
	} finally {
		clearTimeout(timer);
	}
}

async function fetchWithoutAuth(path: string, init: RequestInit = {}): Promise<Response> {
	let res: Response;

	try {
		res = await fetch(`${apiBaseUrl}${path}`, init);
	} catch (error) {
		throw createNetworkError(path, error);
	}

	if (!res.ok) {
		throw await createResponseError(res, path);
	}

	return res;
}

export async function checkBackendHealth(): Promise<BackendHealth> {
	const res = await fetchWithoutAuth('/health');
	return res.json();
}

export async function listProjects(token: string): Promise<Project[]> {
	const res = await fetchWithAuth('/projects', token);
	return res.json();
}

export async function updateProject(
	projectId: string,
	token: string,
	updates: { name?: string; description?: string; metadata?: Record<string, unknown> },
): Promise<Project> {
	const res = await fetchWithAuth(`/projects/${projectId}`, token, {
		method: 'PATCH',
		body: JSON.stringify(updates),
	});
	return res.json();
}

export async function deleteProject(projectId: string, token: string): Promise<void> {
	await fetchWithAuth(`/projects/${projectId}`, token, { method: 'DELETE' });
}

export async function getOrCreateDefaultProject(token: string): Promise<Project> {
	const res = await fetchWithAuth('/projects', token);
	const projects: Project[] = await res.json();
	if (projects.length > 0) return projects[0];

	const createRes = await fetchWithAuth('/projects', token, {
		method: 'POST',
		body: JSON.stringify({ name: 'My First Project', slug: 'my-first-project' }),
	});
	return createRes.json();
}

export async function createProject(
	name: string,
	token: string,
	options: { description?: string } = {},
): Promise<Project> {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'new-project';
	const body: Record<string, string> = { name: name.trim(), slug };
	if (options.description) body.description = options.description;
	const res = await fetchWithAuth('/projects', token, {
		method: 'POST',
		body: JSON.stringify(body),
	});
	return res.json();
}

export async function listSessions(projectId: string, token: string): Promise<ChatSession[]> {
	const res = await fetchWithAuth(`/projects/${projectId}/sessions`, token);
	return res.json();
}

export async function listProjectAssets(projectId: string, token: string): Promise<ProjectAsset[]> {
	const res = await fetchWithAuth(`/projects/${projectId}/assets`, token);
	return res.json();
}

export async function listAssetVersions(
	projectId: string,
	assetId: string,
	token: string,
): Promise<AssetVersion[]> {
	const res = await fetchWithAuth(`/projects/${projectId}/assets/${assetId}/versions`, token);
	return res.json();
}

export async function uploadProjectAsset(
	projectId: string,
	file: File,
	token: string,
	options: {
		assetType?: string;
		displayName?: string;
		folder?: string;
		source?: string;
	} = {},
): Promise<AssetUploadResponse> {
	const body = new FormData();
	body.append('file', file);
	body.append('asset_type', options.assetType ?? 'binary');
	body.append('display_name', options.displayName ?? file.name);
	if (options.folder) body.append('folder', options.folder);
	if (options.source) body.append('source', options.source);

	const res = await fetchWithAuth(`/projects/${projectId}/assets`, token, {
		method: 'POST',
		body,
	});
	return res.json();
}

export async function createSession(
	projectId: string,
	title: string,
	token: string,
): Promise<ChatSession> {
	const res = await fetchWithAuth(`/projects/${projectId}/sessions`, token, {
		method: 'POST',
		body: JSON.stringify({ session_type: 'chat', title }),
	});
	return res.json();
}

export async function deleteSession(
	projectId: string,
	sessionId: string,
	token: string,
): Promise<void> {
	await fetchWithAuth(`/projects/${projectId}/sessions/${sessionId}`, token, {
		method: 'DELETE',
	});
}

export async function listSessionEvents(
	projectId: string,
	sessionId: string,
	token: string,
): Promise<SessionEvent[]> {
	const res = await fetchWithAuth(
		`/projects/${projectId}/sessions/${sessionId}/events`,
		token,
	);
	return res.json();
}

export async function listMcpTools(
	projectId: string,
	token: string,
): Promise<ToolDescriptor[]> {
	const res = await fetchWithAuthTimeout(`/projects/${projectId}/mcp/tools`, token, 10000);
	return res.json();
}

export async function runSessionTool(
	projectId: string,
	sessionId: string,
	token: string,
	body: {
		tool_name: string;
		arguments: Record<string, unknown>;
		attachment_version_ids: string[];
	},
): Promise<ToolRunResponse> {
	const res = await fetchWithAuth(`/projects/${projectId}/sessions/${sessionId}/tools/run`, token, {
		method: 'POST',
		body: JSON.stringify(body),
	});
	return res.json();
}

export async function createSessionEvent(
	projectId: string,
	sessionId: string,
	content: string,
	role: string,
	token: string,
): Promise<SessionEvent> {
	const res = await fetchWithAuth(
		`/projects/${projectId}/sessions/${sessionId}/events`,
		token,
		{
			method: 'POST',
			body: JSON.stringify({ event_type: 'message', role, content }),
		},
	);
	return res.json();
}

export type ChatStreamCallbacks = {
	onChunk: (text: string) => void;
	onUserEvent?: (event: SessionEvent) => void;
	onAsset?: (event: SessionEvent) => void;
	onToolCall?: (event: SessionEvent) => void;
	onToolResult?: (event: SessionEvent) => void;
	onDone?: (event: SessionEvent, fullText: string) => void;
	onError?: (message: string) => void;
};

/**
 * POST to the chat SSE endpoint and invoke callbacks as events arrive.
 * Resolves when the stream closes. Throws if the request itself fails.
 */
export async function streamChat(
	projectId: string,
	sessionId: string,
	message: string,
	token: string,
	options: {
		enabledTools?: string[];
		attachmentVersionIds?: string[];
		automatedToolUsage?: boolean;
	} = {},
	callbacks: ChatStreamCallbacks,
): Promise<void> {
	const res = await fetchWithAuth(`/projects/${projectId}/sessions/${sessionId}/chat`, token, {
		method: 'POST',
		body: JSON.stringify({
			message,
			enabled_tools: options.enabledTools ?? [],
			attachment_version_ids: options.attachmentVersionIds ?? [],
			automated_tool_usage: options.automatedToolUsage ?? true,
		}),
	});

	if (!res.body) {
		throw createInvalidResponseError(`/projects/${projectId}/sessions/${sessionId}/chat`);
	}

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		// Process complete SSE messages (separated by double newlines)
		const parts = buffer.split('\n\n');
		buffer = parts.pop() ?? '';

		for (const part of parts) {
			const lines = part.trim().split('\n');
			let eventName = '';
			let dataStr = '';
			for (const line of lines) {
				if (line.startsWith('event: ')) eventName = line.slice(7).trim();
				else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
			}
			if (!dataStr) continue;

			try {
				const payload = JSON.parse(dataStr);
				if (eventName === 'delta') {
					callbacks.onChunk(payload.text ?? '');
				} else if (eventName === 'user_event') {
					if (payload.event) callbacks.onUserEvent?.(payload.event as SessionEvent);
				} else if (eventName === 'asset') {
					if (payload.event) callbacks.onAsset?.(payload.event as SessionEvent);
				} else if (eventName === 'tool_call') {
					if (payload.event) callbacks.onToolCall?.(payload.event as SessionEvent);
				} else if (eventName === 'tool_result') {
					if (payload.event) callbacks.onToolResult?.(payload.event as SessionEvent);
				} else if (eventName === 'done') {
					if (payload.event) callbacks.onDone?.(payload.event as SessionEvent, payload.text ?? '');
				} else if (eventName === 'error') {
					callbacks.onError?.(payload.message ?? 'Unknown error');
				}
			} catch {
				// Malformed JSON — skip
			}
		}
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function asConversationAttachment(value: unknown): ConversationAttachment | null {
	if (!isRecord(value)) return null;
	if (typeof value.asset_version_id !== 'string') return null;
	return {
		key: typeof value.key === 'string' ? value.key : null,
		asset_id: typeof value.asset_id === 'string' ? value.asset_id : null,
		asset_version_id: value.asset_version_id,
		display_name: typeof value.display_name === 'string' ? value.display_name : 'Attachment',
		asset_type: typeof value.asset_type === 'string' ? value.asset_type : 'binary',
		mime_type: typeof value.mime_type === 'string' ? value.mime_type : null,
		size_bytes: typeof value.size_bytes === 'number' ? value.size_bytes : null,
		signed_url: typeof value.signed_url === 'string' ? value.signed_url : null,
		preview_kind: typeof value.preview_kind === 'string' ? value.preview_kind : null,
		storage_path: typeof value.storage_path === 'string' ? value.storage_path : null,
	};
}

export function mapSessionEventToConversationItem(event: SessionEvent): ConversationItem {
	const payload = isRecord(event.payload) ? event.payload : {};
	const payloadAssets = Array.isArray(payload.assets)
		? payload.assets.map(asConversationAttachment).filter((item): item is ConversationAttachment => !!item)
		: [];
	const directAttachment = asConversationAttachment(payload);
	const attachments =
		event.event_type === 'asset'
			? directAttachment
				? [directAttachment]
				: []
			: payloadAssets;
	const toolName =
		typeof payload.tool_name === 'string'
			? payload.tool_name
			: typeof event.name === 'string'
				? event.name
				: null;

	return {
		id: event.id,
		eventType: event.event_type,
		role:
			event.role === 'user' || event.role === 'assistant' || event.role === 'tool'
				? event.role
				: null,
		name: typeof event.name === 'string' ? event.name : null,
		content: event.content ?? (typeof payload.content === 'string' ? payload.content : ''),
		payload,
		assetVersionId: event.asset_version_id ?? null,
		attachments,
		toolInvocation:
			event.event_type === 'tool_call' && toolName
				? {
						tool_name: toolName,
						arguments: isRecord(payload.arguments) ? payload.arguments : {},
						attachment_version_ids: Array.isArray(payload.attachment_version_ids)
							? payload.attachment_version_ids.filter((item): item is string => typeof item === 'string')
							: [],
					}
				: null,
		toolResult:
			event.event_type === 'tool_result' && toolName
				? {
						tool_name: toolName,
						value: payload.value,
						content:
							typeof payload.content === 'string'
								? payload.content
								: event.content ?? '',
						text: typeof payload.text === 'string' ? payload.text : null,
						assets: payloadAssets,
					}
				: null,
		preview: attachments[0] ?? null,
		createdAt: event.created_at,
	};
}

/* ------------------------------------------------------------------ */
/*  Workflows                                                         */
/* ------------------------------------------------------------------ */

export type Workflow = {
	id: string;
	project_id: string;
	owner_user_id: string;
	name: string;
	description: string | null;
	version: number;
	nodes: Record<string, any>[];
	edges: Record<string, any>[];
	variables: Record<string, any>[];
	metadata: Record<string, any>;
	created_at: string | null;
	updated_at: string | null;
};

export type WorkflowCreate = {
	name: string;
	description?: string | null;
	nodes?: Record<string, any>[];
	edges?: Record<string, any>[];
	variables?: Record<string, any>[];
	metadata?: Record<string, any>;
};

export type WorkflowUpdate = Partial<WorkflowCreate>;

export type WorkflowRunResult = {
	session_id: string;
	status: string;
};

export async function listWorkflows(
	projectId: string,
	token: string,
): Promise<Workflow[]> {
	const res = await fetchWithAuth(`/projects/${projectId}/workflows`, token);
	return res.json();
}

export async function getWorkflow(
	projectId: string,
	workflowId: string,
	token: string,
): Promise<Workflow> {
	const res = await fetchWithAuth(`/projects/${projectId}/workflows/${workflowId}`, token);
	return res.json();
}

export async function createWorkflow(
	projectId: string,
	token: string,
	data: WorkflowCreate,
): Promise<Workflow> {
	const res = await fetchWithAuth(`/projects/${projectId}/workflows`, token, {
		method: 'POST',
		body: JSON.stringify(data),
	});
	return res.json();
}

export async function updateWorkflow(
	projectId: string,
	workflowId: string,
	token: string,
	data: WorkflowUpdate,
): Promise<Workflow> {
	const res = await fetchWithAuth(`/projects/${projectId}/workflows/${workflowId}`, token, {
		method: 'PATCH',
		body: JSON.stringify(data),
	});
	return res.json();
}

export async function deleteWorkflow(
	projectId: string,
	workflowId: string,
	token: string,
): Promise<void> {
	await fetchWithAuth(`/projects/${projectId}/workflows/${workflowId}`, token, {
		method: 'DELETE',
	});
}

export async function runWorkflow(
	projectId: string,
	workflowId: string,
	token: string,
	variableOverrides: Record<string, any> = {},
): Promise<WorkflowRunResult> {
	const res = await fetchWithAuth(
		`/projects/${projectId}/workflows/${workflowId}/run`,
		token,
		{
			method: 'POST',
			body: JSON.stringify({ variable_overrides: variableOverrides }),
		},
	);
	return res.json();
}
