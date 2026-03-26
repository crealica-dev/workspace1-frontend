import {
	checkBackendHealth,
	getOrCreateDefaultProject,
	listSessions,
	createSession,
	deleteSession,
	listSessionEvents,
	getConnectionStatusFromError,
	normalizeWorkspaceError,
	type Project,
	type ChatSession,
	type SessionEvent,
	type WorkspaceApiErrorDetails,
	type WorkspaceConnectionStatus,
} from '$lib/api/projects';

export type ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
};

class ProjectStore {
	currentProject = $state<Project | null>(null);
	sessions = $state<ChatSession[]>([]);
	currentSession = $state<ChatSession | null>(null);
	status = $state<WorkspaceConnectionStatus>('idle');
	statusMessage = $state('Checking Acheulit connection...');
	lastError = $state<WorkspaceApiErrorDetails | null>(null);
	isInitialized = $state(false);

	private initInProgress = false;

	reset(): void {
		this.currentProject = null;
		this.sessions = [];
		this.currentSession = null;
		this.status = 'idle';
		this.statusMessage = 'Checking Acheulit connection...';
		this.lastError = null;
		this.isInitialized = false;
		this.initInProgress = false;
	}

	get isReady(): boolean {
		return this.status === 'ready';
	}

	private setReady(message = 'Acheulit is connected and ready.'): void {
		this.status = 'ready';
		this.statusMessage = message;
		this.lastError = null;
		this.isInitialized = true;
	}

	private syncCurrentSession(nextSessions: ChatSession[]): void {
		if (this.currentSession) {
			const matchingSession = nextSessions.find((session) => session.id === this.currentSession?.id);
			if (matchingSession) {
				this.currentSession = matchingSession;
				return;
			}
		}

		this.currentSession = nextSessions[0] ?? null;
	}

	reportRuntimeError(
		error: unknown,
		fallbackMessage?: string,
	): WorkspaceApiErrorDetails {
		const normalized = normalizeWorkspaceError(error);
		const userMessage =
			fallbackMessage && normalized.kind === 'http'
				? fallbackMessage
				: normalized.userMessage;

		const report: WorkspaceApiErrorDetails = {
			...normalized,
			userMessage,
		};

		this.status = getConnectionStatusFromError(report);
		this.statusMessage = userMessage;
		this.lastError = report;
		this.isInitialized = true;

		return report;
	}

	async init(accessToken: string, options: { force?: boolean } = {}): Promise<void> {
		if (this.isInitialized && this.isReady && !options.force) return;
		if (this.initInProgress) return;
		this.initInProgress = true;

		this.status = 'checking';
		this.statusMessage = 'Checking Acheulit connection...';
		this.lastError = null;

		try {
			await checkBackendHealth();
			this.statusMessage = 'Syncing Acheulit...';
			const project = await getOrCreateDefaultProject(accessToken);
			const sessionList = await listSessions(project.id, accessToken);

			this.currentProject = project;
			this.sessions = sessionList;
			this.syncCurrentSession(sessionList);
			this.setReady('Acheulit is connected and ready.');
		} catch (error) {
			const normalized = normalizeWorkspaceError(error);
			const status = getConnectionStatusFromError(normalized);

			this.status = status;
			this.statusMessage =
				status === 'backend_down'
					? 'The backend is unavailable right now. Retry when it is running again.'
					: status === 'auth_error'
						? 'Your session could not be verified by the API. Sign in again and retry.'
						: 'The backend is reachable, but Acheulit could not load your project space.';
			this.lastError = normalized;
			this.isInitialized = true;
		} finally {
			this.initInProgress = false;
		}
	}

	/** Force a fresh connection attempt regardless of current state. */
	async reconnect(accessToken: string): Promise<void> {
		await this.init(accessToken, { force: true });
	}

	async loadSessionMessages(
		sessionId: string,
		projectId: string,
		accessToken: string,
	): Promise<ChatMessage[]> {
		try {
			const events: SessionEvent[] = await listSessionEvents(projectId, sessionId, accessToken);
			this.setReady('Acheulit is connected and ready.');
			return events
				.filter((e) => e.role === 'user' || e.role === 'assistant')
				.map((e) => ({
					id: e.id,
					role: e.role as 'user' | 'assistant',
					content: e.content ?? '',
				}));
		} catch (error) {
			this.reportRuntimeError(error, 'The session history could not be loaded.');
			throw error;
		}
	}

	async createNewSession(
		title: string,
		projectId: string,
		accessToken: string,
	): Promise<ChatSession> {
		try {
			const session = await createSession(projectId, title, accessToken);
			this.sessions = [session, ...this.sessions];
			this.currentSession = session;
			this.setReady('Acheulit is connected and ready.');
			return session;
		} catch (error) {
			this.reportRuntimeError(error, 'A new chat could not be created.');
			throw error;
		}
	}

	async removeSession(
		sessionId: string,
		projectId: string,
		accessToken: string,
	): Promise<void> {
		try {
			await deleteSession(projectId, sessionId, accessToken);
			const nextSessions = this.sessions.filter((s) => s.id !== sessionId);
			this.sessions = nextSessions;
			if (this.currentSession?.id === sessionId) {
				this.currentSession = nextSessions[0] ?? null;
			}
			this.setReady('Acheulit is connected and ready.');
		} catch (error) {
			this.reportRuntimeError(error, 'The chat session could not be removed.');
			throw error;
		}
	}
}

export const projectStore = new ProjectStore();
