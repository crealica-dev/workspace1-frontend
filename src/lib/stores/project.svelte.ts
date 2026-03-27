import {
	checkBackendHealth,
	getOrCreateDefaultProject,
	listProjects,
	listSessions,
	createSession,
	deleteSession,
	createProject as createProjectApi,
	updateProject as updateProjectApi,
	deleteProject as deleteProjectApi,
	listSessionEvents,
	getConnectionStatusFromError,
	mapSessionEventToConversationItem,
	normalizeWorkspaceError,
	type Project,
	type ChatSession,
	type ConversationItem,
	type WorkspaceApiErrorDetails,
	type WorkspaceConnectionStatus,
} from '$lib/api/projects';

export type ChatMessage = ConversationItem;

class ProjectStore {
	projects = $state<Project[]>([]);
	currentProject = $state<Project | null>(null);
	sessions = $state<ChatSession[]>([]);
	currentSession = $state<ChatSession | null>(null);
	status = $state<WorkspaceConnectionStatus>('idle');
	statusMessage = $state('Checking Acheulit connection...');
	lastError = $state<WorkspaceApiErrorDetails | null>(null);
	isInitialized = $state(false);

	private initInProgress = false;

	reset(): void {
		this.projects = [];
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
			const allProjects = await listProjects(accessToken);
			let project: Project;
			if (allProjects.length > 0) {
				project = allProjects[0];
			} else {
				project = await getOrCreateDefaultProject(accessToken);
				allProjects.push(project);
			}
			const sessionList = await listSessions(project.id, accessToken);

			this.projects = allProjects;
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
			const events = await listSessionEvents(projectId, sessionId, accessToken);
			this.setReady('Acheulit is connected and ready.');
			return events
				.filter((event) =>
					['user_message', 'assistant_message', 'tool_call', 'tool_result', 'asset'].includes(
						event.event_type,
					),
				)
				.map(mapSessionEventToConversationItem);
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

	async createProject(
		name: string,
		accessToken: string,
		options: { description?: string } = {},
	): Promise<Project> {
		try {
			const project = await createProjectApi(name, accessToken, options);
			this.projects = [project, ...this.projects];
			this.currentProject = project;
			this.sessions = [];
			this.currentSession = null;
			this.setReady('Project created successfully.');
			return project;
		} catch (error) {
			this.reportRuntimeError(error, 'The project could not be created.');
			throw error;
		}
	}

	async switchProject(projectId: string, accessToken: string): Promise<void> {
		const project = this.projects.find((p) => p.id === projectId);
		if (!project) return;
		try {
			const sessionList = await listSessions(project.id, accessToken);
			this.currentProject = project;
			this.sessions = sessionList;
			this.syncCurrentSession(sessionList);
			this.setReady('Acheulit is connected and ready.');
		} catch (error) {
			this.reportRuntimeError(error, 'Could not switch project.');
			throw error;
		}
	}

	async renameProject(
		projectId: string,
		name: string,
		accessToken: string,
	): Promise<Project> {
		try {
			const updated = await updateProjectApi(projectId, accessToken, { name });
			this.projects = this.projects.map((p) => (p.id === projectId ? updated : p));
			if (this.currentProject?.id === projectId) this.currentProject = updated;
			this.setReady('Project renamed.');
			return updated;
		} catch (error) {
			this.reportRuntimeError(error, 'The project could not be renamed.');
			throw error;
		}
	}

	async deleteProject(projectId: string, accessToken: string): Promise<void> {
		try {
			await deleteProjectApi(projectId, accessToken);
			const nextProjects = this.projects.filter((p) => p.id !== projectId);
			this.projects = nextProjects;
			if (this.currentProject?.id === projectId) {
				const next = nextProjects[0] ?? null;
				if (next) {
					const sessionList = await listSessions(next.id, accessToken);
					this.currentProject = next;
					this.sessions = sessionList;
					this.syncCurrentSession(sessionList);
				} else {
					this.currentProject = null;
					this.sessions = [];
					this.currentSession = null;
				}
			}
			this.setReady('Project deleted.');
		} catch (error) {
			this.reportRuntimeError(error, 'The project could not be deleted.');
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
