<script lang="ts">
	import ConversationBlock from "$lib/components/prompt-kit-blocks/conversation-with-prompt-input.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { auth } from "$lib/auth";
	import {
		normalizeWorkspaceError,
		streamChat,
		type WorkspaceConnectionStatus,
	} from "$lib/api/projects";
	import { projectStore, type ChatMessage } from "$lib/stores/project.svelte";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import {
		Bot,
		ChevronDown,
		MessageSquare,
		Plus,
		RefreshCw,
		ServerCrash,
		ShieldAlert,
		Sparkles,
		Trash2,
		WifiOff,
		X,
	} from "@lucide/svelte";

	const SUGGESTIONS = [
		"Create a new project",
		"Summarize recent activity",
		"Start a new workflow",
		"Show my sessions",
	];

	let panelWidth = $state(420);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartWidth = $state(0);

	let localMessages = $state<ChatMessage[]>([]);
	let isLoading = $state(false);
	let reconnecting = $state(false);
	let chatError = $state<string | null>(null);

	const isOpen = $derived(agentPanelState.isOpen);
	const currentProject = $derived(projectStore.currentProject);
	const sessions = $derived(projectStore.sessions);
	const currentSession = $derived(projectStore.currentSession);
	const workspaceStatus = $derived(projectStore.status);
	const workspaceStatusMessage = $derived(projectStore.statusMessage);
	const showWelcome = $derived(localMessages.length === 0 && !isLoading);
	const canStartChats = $derived(workspaceStatus === 'ready' && !!currentProject);
	const statusMeta = $derived(getStatusMeta(workspaceStatus, workspaceStatusMessage));
	const composerHelper = $derived(
		canStartChats
			? 'Send a project-aware prompt, or choose one of the suggestions above.'
			: statusMeta.description,
	);

	function getAccessToken(): string | null {
		return auth.getSessionSnapshot()?.access_token ?? null;
	}

	function getStatusMeta(status: WorkspaceConnectionStatus, message: string) {
		switch (status) {
			case 'ready':
				return {
					label: 'Connected',
					description: message || 'Projects, sessions, and chat are ready.',
					badgeClass:
						'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
					panelClass:
						'border-emerald-200/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
					iconClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
				};
			case 'checking':
				return {
					label: 'Syncing workspace',
					description: message || 'Checking backend connection and loading project data.',
					badgeClass:
						'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
					panelClass:
						'border-sky-200/80 bg-sky-50/80 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100',
					iconClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
				};
			case 'auth_error':
				return {
					label: 'Authentication issue',
					description: message || 'The API rejected this sign-in session.',
					badgeClass:
						'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
					panelClass:
						'border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100',
					iconClass:
						'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
				};
			case 'backend_down':
				return {
					label: 'Backend unavailable',
					description: message || 'The app cannot reach the API right now.',
					badgeClass:
						'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
					panelClass:
						'border-rose-200/80 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100',
					iconClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
				};
			default:
				return {
					label: 'Workspace sync failed',
					description: message || 'The backend responded, but the workspace could not be prepared.',
					badgeClass:
						'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300',
					panelClass:
						'border-orange-200/80 bg-orange-50/80 text-orange-900 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100',
					iconClass:
						'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
				};
		}
	}

	$effect(() => {
		const session = currentSession;
		const project = currentProject;
		const token = getAccessToken();
		let cancelled = false;

		if (!session || !project || !token) {
			if (!session) {
				localMessages = [];
			}
			return () => {
				cancelled = true;
			};
		}

		projectStore
			.loadSessionMessages(session.id, project.id, token)
			.then((messages) => {
				if (cancelled) return;
				localMessages = messages;
				chatError = null;
			})
			.catch((error) => {
				if (cancelled) return;
				const report = projectStore.reportRuntimeError(
					error,
					'The session history could not be loaded.',
				);
				chatError = report.userMessage;
			});

		return () => {
			cancelled = true;
		};
	});

	function onResizePointerDown(e: PointerEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartWidth = panelWidth;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onResizePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const delta = dragStartX - e.clientX;
		panelWidth = Math.min(760, Math.max(380, dragStartWidth + delta));
	}

	function onResizePointerUp() {
		isDragging = false;
	}

	async function handleReconnect() {
		const token = getAccessToken();
		if (!token || reconnecting) return;

		reconnecting = true;
		try {
			await projectStore.reconnect(token);
			if (projectStore.status === 'ready') {
				chatError = null;
			}
		} finally {
			reconnecting = false;
		}
	}

	async function handleNewSession() {
		if (!canStartChats) {
			chatError = statusMeta.description;
			return;
		}

		const token = getAccessToken();
		const project = currentProject;
		if (!token || !project) return;

		chatError = null;
		await projectStore.createNewSession('New Chat', project.id, token);
		localMessages = [];
	}

	async function handleLoadSession(sessionId: string) {
		const session = sessions.find((item) => item.id === sessionId);
		if (!session) return;
		chatError = null;
		projectStore.currentSession = session;
	}

	async function handleDeleteSession(sessionId: string, e: MouseEvent) {
		e.stopPropagation();

		const token = getAccessToken();
		const project = currentProject;
		if (!token || !project) return;

		try {
			await projectStore.removeSession(sessionId, project.id, token);
			if (!projectStore.currentSession) {
				localMessages = [];
			}
		} catch (error) {
			const report = projectStore.reportRuntimeError(
				error,
				'The chat session could not be removed.',
			);
			chatError = report.userMessage;
		}
	}

	async function handleSend(content: string) {
		if (!canStartChats) {
			chatError = statusMeta.description;
			return;
		}

		const token = getAccessToken();
		const project = currentProject;
		if (!token || !project) return;

		chatError = null;

		let session = currentSession;

		try {
			if (!session) {
				session = await projectStore.createNewSession(
					content.slice(0, 40) || 'New Chat',
					project.id,
					token,
				);
			}

			const userMessageId = `local-${Date.now()}`;
			const assistantMessageId = `streaming-${Date.now()}`;

			localMessages = [...localMessages, { id: userMessageId, role: 'user', content }];
			isLoading = true;

			await streamChat(project.id, session.id, content, token, {
				onUserEvent(eventId) {
					localMessages = localMessages.map((message) =>
						message.id === userMessageId ? { ...message, id: eventId } : message,
					);
					localMessages = [
						...localMessages,
						{ id: assistantMessageId, role: 'assistant', content: '' },
					];
				},
				onChunk(text) {
					localMessages = localMessages.map((message) =>
						message.id === assistantMessageId
							? { ...message, content: `${message.content}${text}` }
							: message,
					);
				},
				onDone(eventId) {
					localMessages = localMessages.map((message) =>
						message.id === assistantMessageId ? { ...message, id: eventId } : message,
					);
					chatError = null;
					isLoading = false;
				},
				onError(message) {
					localMessages = localMessages.map((message) =>
						message.id === assistantMessageId
							? { ...message, content: `Request failed: ${message}` }
							: message,
					);
					chatError = message;
					isLoading = false;
				},
			});
		} catch (error) {
			const normalized = normalizeWorkspaceError(error);
			const failureText =
				normalized.kind === 'network' || normalized.kind === 'auth'
					? projectStore.reportRuntimeError(error, 'The chat request could not be sent.')
							.userMessage
					: normalized.userMessage;
			const assistantMessageId = `error-${Date.now()}`;

			localMessages = [
				...localMessages,
				{ id: assistantMessageId, role: 'assistant', content: `Request failed: ${failureText}` },
			];
			chatError = failureText;
			isLoading = false;
		}
	}
</script>

{#if isOpen}
	<div
		role="presentation"
		onclick={() => agentPanelState.close()}
		class="fixed inset-0 z-40 bg-black/12 backdrop-blur-[2px]"
	></div>
{/if}

<div
	class="fixed top-0 right-0 z-50 flex h-full flex-col border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out {isOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	style="width: {panelWidth}px"
	aria-hidden={!isOpen}
>
	<div
		role="separator"
		aria-orientation="vertical"
		class="absolute top-0 left-0 h-full w-1.5 cursor-col-resize transition-colors hover:bg-primary/15 {isDragging
			? 'bg-primary/25'
			: ''}"
		onpointerdown={onResizePointerDown}
		onpointermove={onResizePointerMove}
		onpointerup={onResizePointerUp}
	></div>

	<div class="border-b bg-background/90 px-5 py-4 backdrop-blur">
		<div class="flex items-start gap-3">
			<div class="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
				<Bot class="size-5 text-primary" />
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-sm font-semibold tracking-tight">Workspace Agent</p>
					<Badge variant="outline" class={statusMeta.badgeClass}>
						{statusMeta.label}
					</Badge>
				</div>
				<p class="text-muted-foreground mt-1 text-xs leading-5">
					{currentProject
						? `Working inside ${currentProject.name}.`
						: 'Project-aware chat, sessions, and workflow guidance.'}
				</p>
			</div>
			<button
				onclick={() => agentPanelState.close()}
				class="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl p-2 transition-colors"
				aria-label="Close agent"
			>
				<X class="size-4" />
			</button>
		</div>

		<div class="mt-4 flex items-center gap-2">
			{#if canStartChats}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="border-border bg-muted/40 text-foreground hover:bg-muted flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors"
					>
						<MessageSquare class="text-muted-foreground size-4 shrink-0" />
						<span class="min-w-0 flex-1 truncate text-left">
							{currentSession?.title ?? 'Choose a chat session'}
						</span>
						<ChevronDown class="text-muted-foreground size-4 shrink-0" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-72" align="start">
						<DropdownMenu.Item onclick={handleNewSession} class="gap-2">
							<Plus class="size-3.5" />
							New chat
						</DropdownMenu.Item>
						{#if sessions.length > 0}
							<DropdownMenu.Separator />
							{#each sessions as session (session.id)}
								<DropdownMenu.Item
									onclick={() => handleLoadSession(session.id)}
									class="group flex items-center justify-between gap-2 pr-1"
								>
									<span class="min-w-0 flex-1 truncate text-xs">
										{session.title ?? 'Untitled'}
									</span>
									<button
										onclick={(e) => handleDeleteSession(session.id, e)}
										class="text-muted-foreground hover:text-destructive shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
										aria-label="Delete session"
									>
										<Trash2 class="size-3" />
									</button>
								</DropdownMenu.Item>
							{/each}
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{:else}
				<div class="border-border bg-muted/30 text-muted-foreground flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs leading-5">
					<MessageSquare class="size-4 shrink-0" />
					<span class="min-w-0 flex-1 truncate">
						Chat sessions unlock once the workspace is ready.
					</span>
				</div>
			{/if}

			<Button
				variant="outline"
				size="icon-sm"
				class="shrink-0 rounded-xl"
				disabled={!canStartChats}
				onclick={handleNewSession}
			>
				<Plus class="size-4" />
			</Button>
		</div>
	</div>

	{#if workspaceStatus !== 'ready'}
		<div class="border-b px-4 py-4">
			<div class="rounded-2xl border px-4 py-3 {statusMeta.panelClass}">
				<div class="flex items-start gap-3">
					<div class="flex size-9 items-center justify-center rounded-full {statusMeta.iconClass}">
						{#if workspaceStatus === 'auth_error'}
							<ShieldAlert class="size-4" />
						{:else if workspaceStatus === 'backend_down'}
							<ServerCrash class="size-4" />
						{:else if workspaceStatus === 'checking'}
							<RefreshCw class="size-4 {reconnecting ? 'animate-spin' : ''}" />
						{:else}
							<WifiOff class="size-4" />
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<p class="text-sm font-semibold">{statusMeta.label}</p>
						<p class="mt-1 text-xs leading-5 opacity-90">{statusMeta.description}</p>
					</div>
				</div>
				<div class="mt-3 flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						class="rounded-xl"
						disabled={reconnecting || !getAccessToken()}
						onclick={handleReconnect}
					>
						<RefreshCw class="size-3.5 {reconnecting ? 'animate-spin' : ''}" />
						{reconnecting ? 'Retrying...' : 'Retry connection'}
					</Button>
					{#if workspaceStatus === 'auth_error'}
						<Button variant="ghost" size="sm" class="rounded-xl" href="/">
							Return to sign in
						</Button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if chatError}
		<div class="border-b px-4 py-3">
			<div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
				{chatError}
			</div>
		</div>
	{/if}

	<div class="min-h-0 flex-1 overflow-hidden">
		{#if showWelcome}
			<div class="flex h-full flex-col">
				<div class="flex flex-1 flex-col justify-center gap-6 px-6 py-8">
					<div class="space-y-4 text-center">
						<div
							class="mx-auto flex size-16 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5"
						>
							<Sparkles class="size-7 text-primary" />
						</div>
						<div class="space-y-2">
							<h3 class="text-foreground text-lg font-semibold tracking-tight">
								Start a workspace conversation
							</h3>
							<p class="text-muted-foreground mx-auto max-w-sm text-sm leading-6">
								Open a project-aware chat, review recent activity, or use a prompt to
								kick off the next workflow.
							</p>
						</div>
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						{#each SUGGESTIONS as suggestion}
							<button
								onclick={() => handleSend(suggestion)}
								disabled={!canStartChats}
								class="border-border bg-card hover:bg-accent hover:border-primary/30 flex min-h-24 flex-col items-start justify-between rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55"
							>
								<MessageSquare class="text-muted-foreground size-4" />
								<span class="text-sm font-medium leading-6">{suggestion}</span>
							</button>
						{/each}
					</div>

					<div class="rounded-2xl border border-dashed px-4 py-3 text-xs leading-5 text-muted-foreground">
						{composerHelper}
					</div>
				</div>

				<ConversationBlock
					messages={[]}
					isLoading={false}
					onSend={handleSend}
					showMessages={false}
					disabled={!canStartChats}
					disabledMessage={composerHelper}
				/>
			</div>
		{:else}
			<ConversationBlock
				messages={localMessages}
				{isLoading}
				onSend={handleSend}
				showMessages={true}
				disabled={!canStartChats}
				disabledMessage={composerHelper}
			/>
		{/if}
	</div>
</div>
