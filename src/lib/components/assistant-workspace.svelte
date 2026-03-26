<script lang="ts">
	import { goto } from "$app/navigation";
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
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { projectStore, type ChatMessage } from "$lib/stores/project.svelte";
	import {
		Bot,
		ChevronDown,
		ExternalLink,
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

	type Variant = "main" | "drawer";
	type WorkflowMode = "guided" | "manual";
	type WorkflowStep = "plan" | "sources" | "generate" | "refine";

	type Props = {
		variant?: Variant;
		showCloseButton?: boolean;
		onClose?: () => void;
	};

const SUGGESTIONS = [
		"Create a project brief from the context I already have.",
		"Summarize the latest conversation and list next steps.",
		"Review my source library and tell me what is missing.",
		"Help me choose the right generation workflow for this project.",
	];

	let {
		variant = "main",
		showCloseButton = false,
		onClose,
	}: Props = $props();

	let localMessages = $state<ChatMessage[]>([]);
	let isLoading = $state(false);
	let reconnecting = $state(false);
	let chatError = $state<string | null>(null);
	let workflowMode = $state<WorkflowMode>("guided");
	let activeStep = $state<WorkflowStep>("plan");

	const isMain = $derived(variant === "main");
	const currentProject = $derived(projectStore.currentProject);
	const sessions = $derived(projectStore.sessions);
	const currentSession = $derived(projectStore.currentSession);
	const workspaceStatus = $derived(projectStore.status);
	const workspaceStatusMessage = $derived(projectStore.statusMessage);
	const showWelcome = $derived(localMessages.length === 0 && !isLoading);
	const canStartChats = $derived(workspaceStatus === "ready" && !!currentProject);
	const statusMeta = $derived(getStatusMeta(workspaceStatus, workspaceStatusMessage));
	const composerHelper = $derived(
		canStartChats
			? workflowMode === "guided"
				? "Guided mode keeps the next step, source review, and refinement prompts close to the composer."
				: "Manual mode keeps the chat open while you decide the next command yourself."
			: statusMeta.description,
	);
	const queuedDraft = $derived(assistantIntentState.draft);
	const drawerSuggestions = $derived(SUGGESTIONS.slice(0, 4));

	function getAccessToken(): string | null {
		return auth.getSessionSnapshot()?.access_token ?? null;
	}

	function getStatusMeta(status: WorkspaceConnectionStatus, message: string) {
		switch (status) {
			case "ready":
				return {
					label: "Connected",
					description: message || "Projects, sessions, and the assistant are ready.",
					badgeClass:
						"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
					panelClass:
						"border-emerald-200/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
					iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
				};
			case "checking":
				return {
					label: "Syncing Acheulit",
					description: message || "Checking backend connection and loading project data.",
					badgeClass:
						"border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
					panelClass:
						"border-sky-200/80 bg-sky-50/80 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100",
					iconClass: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
				};
			case "auth_error":
				return {
					label: "Authentication issue",
					description: message || "The API rejected this sign-in session.",
					badgeClass:
						"border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
					panelClass:
						"border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
					iconClass:
						"bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
				};
			case "backend_down":
				return {
					label: "Backend unavailable",
					description: message || "The app cannot reach the API right now.",
					badgeClass:
						"border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
					panelClass:
						"border-rose-200/80 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100",
					iconClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
				};
			default:
				return {
					label: "Acheulit sync failed",
					description: message || "The backend responded, but Acheulit could not finish loading.",
					badgeClass:
						"border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
					panelClass:
						"border-orange-200/80 bg-orange-50/80 text-orange-900 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100",
					iconClass:
						"bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
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
					"The session history could not be loaded.",
				);
				chatError = report.userMessage;
			});

		return () => {
			cancelled = true;
		};
	});

	async function handleReconnect() {
		const token = getAccessToken();
		if (!token || reconnecting) return;

		reconnecting = true;
		try {
			await projectStore.reconnect(token);
			if (projectStore.status === "ready") {
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
		await projectStore.createNewSession("New Chat", project.id, token);
		localMessages = [];
	}

	function handleLoadSession(sessionId: string) {
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
				"The chat session could not be removed.",
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
					content.slice(0, 40) || "New Chat",
					project.id,
					token,
				);
			}

			const userMessageId = `local-${Date.now()}`;
			const assistantMessageId = `streaming-${Date.now()}`;

			localMessages = [...localMessages, { id: userMessageId, role: "user", content }];
			isLoading = true;

			await streamChat(project.id, session.id, content, token, {
				onUserEvent(eventId) {
					localMessages = localMessages.map((message) =>
						message.id === userMessageId ? { ...message, id: eventId } : message,
					);
					localMessages = [
						...localMessages,
						{ id: assistantMessageId, role: "assistant", content: "" },
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
				normalized.kind === "network" || normalized.kind === "auth"
					? projectStore.reportRuntimeError(error, "The chat request could not be sent.")
							.userMessage
					: normalized.userMessage;
			const assistantMessageId = `error-${Date.now()}`;

			localMessages = [
				...localMessages,
				{
					id: assistantMessageId,
					role: "assistant",
					content: `Request failed: ${failureText}`,
				},
			];
			chatError = failureText;
			isLoading = false;
		}
	}

	function queueWorkflowPrompt(step: WorkflowStep) {
		activeStep = step;

		const promptByStep: Record<WorkflowStep, string> = {
			plan:
				workflowMode === "guided"
					? "Plan the next best step for this project and explain what information you need from me."
					: "I want to decide the next step manually. Help me compare the possible directions for this project.",
			sources:
				"Review the current project library, tell me what source material is missing, and suggest the next uploads or imports.",
			generate:
				"Prepare the next generation step for this project, including the best prompt structure and recommended tool.",
			refine:
				"Review the latest output, point out weak spots, and suggest the best refinement pass before I continue.",
		};

		assistantIntentState.queue(promptByStep[step], `workflow:${step}`);
	}

	const workflowSteps = $derived([
		{
			id: "plan" as const,
			label: "Plan next step",
			description: "Frame the next move before you commit effort.",
			state: currentProject ? "ready" : "waiting",
		},
		{
			id: "sources" as const,
			label: "Review sources",
			description: "Check what is in the library and what is still missing.",
			state: currentProject ? "ready" : "waiting",
		},
		{
			id: "generate" as const,
			label: workflowMode === "guided" ? "Guided generation" : "Manual generation",
			description:
				workflowMode === "guided"
					? "Let the assistant stage the generation flow."
					: "Stay in manual control while the chat helps with choices.",
			state: currentSession ? "active" : "next",
		},
		{
			id: "refine" as const,
			label: "Review + refine",
			description: "Loop back through decisions instead of stopping at the first output.",
			state: localMessages.length > 1 ? "active" : "next",
		},
	]);

	function getStepTone(step: { state: string; id: WorkflowStep }) {
		if (step.id === activeStep) {
			return "border-primary/35 bg-primary/8 text-foreground";
		}
		if (step.state === "ready" || step.state === "active") {
			return "border-border/70 bg-background/80 text-foreground hover:border-primary/25 hover:bg-primary/[0.04]";
		}
		return "border-dashed border-border/70 bg-muted/25 text-muted-foreground";
	}
</script>

{#snippet workflowTray()}
	<div class="rounded-[1.5rem] border border-border/70 bg-muted/25 px-4 py-4">
		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Workflow tray
					</p>
					<p class="mt-1 text-sm font-medium">
						Keep decisions, previews, and next-step prompts attached to the chat.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {workflowMode === 'guided'
							? 'border-primary/30 bg-primary/10 text-foreground'
							: 'border-border/70 bg-background text-muted-foreground'}"
						onclick={() => (workflowMode = 'guided')}
					>
						Guided mode
					</button>
					<button
						type="button"
						class="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors {workflowMode === 'manual'
							? 'border-primary/30 bg-primary/10 text-foreground'
							: 'border-border/70 bg-background text-muted-foreground'}"
						onclick={() => (workflowMode = 'manual')}
					>
						Manual mode
					</button>
				</div>
			</div>

			<div class="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
				{#each workflowSteps as step (step.id)}
					<button
						type="button"
						class="rounded-2xl border px-3 py-3 text-left transition-colors {getStepTone(step)}"
						onclick={() => queueWorkflowPrompt(step.id)}
					>
						<div class="flex items-center justify-between gap-2">
							<p class="text-sm font-medium">{step.label}</p>
							<span class="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
								{step.state}
							</span>
						</div>
						<p class="mt-2 text-xs leading-5 text-muted-foreground">
							{step.description}
						</p>
					</button>
				{/each}
			</div>

			<div class="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
				<div class="rounded-2xl border border-border/70 bg-background/80 px-3 py-3">
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Preview
					</p>
					<p class="mt-2 text-sm font-medium">
						{currentProject?.name ?? "No active project yet"}
					</p>
					<p class="text-muted-foreground mt-1 text-xs leading-5">
						{currentProject?.description ??
							"Once the project context loads, this tray stays attached to the conversation."}
					</p>
				</div>
				<div class="rounded-2xl border border-border/70 bg-background/80 px-3 py-3">
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Current thread
					</p>
					<p class="mt-2 text-sm font-medium">
						{currentSession?.title ?? "Start a new conversation"}
					</p>
					<p class="text-muted-foreground mt-1 text-xs leading-5">
						Workflow choices will prefill the composer so you can send them when ready.
					</p>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet mainEmptyState()}
	<div class="flex h-full flex-col justify-center gap-6 px-4 py-6">
		<div class="space-y-4 text-center">
			<div
				class="mx-auto flex size-16 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]"
			>
				<Sparkles class="size-7 text-primary" />
			</div>
			<div class="space-y-2">
				<h3 class="text-foreground text-lg font-semibold tracking-tight">
					Start in the main Acheulit workspace
				</h3>
				<p class="text-muted-foreground mx-auto max-w-xl text-sm leading-6">
					Chat stays central here while project context, sources, and workflow decisions stay within reach.
				</p>
			</div>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			{#each SUGGESTIONS as suggestion}
				<button
					onclick={() => handleSend(suggestion)}
					disabled={!canStartChats}
					class="border-border/80 bg-card/95 hover:bg-accent hover:border-primary/30 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.2)] flex min-h-24 flex-col items-start justify-between rounded-2xl border px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55"
				>
					<MessageSquare class="text-muted-foreground size-4" />
					<span class="text-sm font-medium leading-6">{suggestion}</span>
				</button>
			{/each}
		</div>

		<div class="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
			<div class="rounded-2xl border border-border/80 bg-muted/25 px-4 py-4 text-left shadow-[0_16px_40px_-34px_rgba(15,23,42,0.28)]">
				<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					Main canvas
				</p>
				<p class="mt-2 text-sm font-medium">
					Keep planning, generation, and refinement inside the same thread.
				</p>
				<p class="text-muted-foreground mt-1 text-xs leading-5">
					Use the tray below the composer to stage the next micro-step before you send it.
				</p>
			</div>
			<div class="rounded-2xl border border-dashed border-border/70 px-4 py-4 text-left">
				<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					Supporting surfaces
				</p>
				<p class="mt-2 text-sm font-medium">Library, Studio, and Flows stay connected.</p>
				<button
					class="mt-3 inline-flex items-center gap-2 text-xs font-medium text-primary"
					onclick={() => goto("/app/projects")}
				>
					Open the library
					<ExternalLink class="size-3.5" />
				</button>
			</div>
		</div>
	</div>
{/snippet}

{#snippet drawerEmptyState()}
	<div class="flex h-full flex-col gap-5 px-3 py-3">
		<div class="rounded-[1.75rem] border border-border/80 bg-gradient-to-b from-background to-muted/45 px-4 py-5 text-center shadow-[0_22px_45px_-32px_rgba(15,23,42,0.28)]">
			<div
				class="mx-auto mb-4 flex size-14 items-center justify-center rounded-[1.5rem] border border-white/70 bg-white shadow-[0_16px_36px_-26px_rgba(15,23,42,0.35)]"
			>
				<Sparkles class="size-6 text-primary" />
			</div>
			<h3 class="text-foreground text-lg font-semibold tracking-tight">
				Start a conversation in Acheulit
			</h3>
			<p class="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-6">
				Open a project-aware chat, review recent activity, or use a prompt to kick off the next workflow.
			</p>
		</div>

		<div class="grid gap-3">
			{#each drawerSuggestions as suggestion}
				<button
					onclick={() => handleSend(suggestion)}
					disabled={!canStartChats}
					class="group rounded-[1.4rem] border border-border/80 bg-white/90 px-4 py-4 text-left shadow-[0_18px_36px_-32px_rgba(15,23,42,0.3)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_24px_44px_-30px_rgba(15,23,42,0.32)] disabled:cursor-not-allowed disabled:opacity-55 dark:bg-background/90"
				>
					<div class="flex items-start gap-3">
						<div class="mt-0.5 rounded-full border border-border/70 bg-muted/55 p-2 shadow-sm">
							<MessageSquare class="text-muted-foreground size-4" />
						</div>
						<span class="text-sm font-medium leading-7">{suggestion}</span>
					</div>
				</button>
			{/each}
		</div>

		<div class="rounded-[1.4rem] border border-dashed border-border/80 bg-background/80 px-4 py-4 text-xs leading-6 text-muted-foreground">
			{composerHelper}
		</div>
	</div>
{/snippet}

<div
	class="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-background shadow-[0_22px_50px_-36px_rgba(15,23,42,0.28)] {isMain
		? 'min-h-[720px]'
		: 'rounded-none border-0 border-l border-l-border/80 bg-gradient-to-b from-background via-background to-muted/30 shadow-[-24px_0_56px_-42px_rgba(15,23,42,0.55)]'}"
>
	<div class="shrink-0 border-b border-border/80 bg-background/95 px-5 py-4 backdrop-blur {isMain ? '' : 'shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]'}">
		<div class="flex items-start gap-3">
			<div
				class="flex size-10 items-center justify-center rounded-2xl {isMain ? 'bg-primary/[0.08]' : 'bg-primary/10'}"
			>
				<Bot class="size-5 text-primary" />
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-sm font-semibold tracking-tight">
						{isMain ? "Main workspace" : "Acheulit Assistant"}
					</p>
					<Badge variant="outline" class={statusMeta.badgeClass}>
						{statusMeta.label}
					</Badge>
					{#if isMain}
						<Badge
							variant="outline"
							class="rounded-full border-border/70 bg-muted/40 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
						>
							Chat-first
						</Badge>
					{/if}
				</div>
				<p class="text-muted-foreground mt-1 text-xs leading-5">
					{#if currentProject}
						{isMain
							? `Work inside ${currentProject.name} with project context, chat history, and workflow steps in one place.`
							: `Working inside ${currentProject.name}.`}
					{:else}
						{isMain
							? "Use the main workspace to plan work, prepare prompts, and keep project context aligned."
							: "Project-aware chat, sessions, and workflow guidance inside Acheulit."}
					{/if}
				</p>
			</div>
			{#if showCloseButton}
				<button
					onclick={() => onClose?.()}
					class="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl p-2 transition-colors"
					aria-label="Close assistant"
				>
					<X class="size-4" />
				</button>
			{/if}
		</div>

		<div class="mt-4 flex items-center gap-2">
			{#if canStartChats}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="border-border bg-muted/40 text-foreground hover:bg-muted flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors"
					>
						<MessageSquare class="text-muted-foreground size-4 shrink-0" />
						<span class="min-w-0 flex-1 truncate text-left">
							{currentSession?.title ?? "Choose a conversation"}
						</span>
						<ChevronDown class="text-muted-foreground size-4 shrink-0" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-80" align="start">
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
										{session.title ?? "Untitled"}
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
						Chat sessions unlock once Acheulit is ready.
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

	{#if workspaceStatus !== "ready"}
		<div class="border-b px-4 py-4">
			<div class="rounded-2xl border px-4 py-3 {statusMeta.panelClass}">
				<div class="flex items-start gap-3">
					<div class="flex size-9 items-center justify-center rounded-full {statusMeta.iconClass}">
						{#if workspaceStatus === "auth_error"}
							<ShieldAlert class="size-4" />
						{:else if workspaceStatus === "backend_down"}
							<ServerCrash class="size-4" />
						{:else if workspaceStatus === "checking"}
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
						{reconnecting ? "Retrying..." : "Retry connection"}
					</Button>
					{#if workspaceStatus === "auth_error"}
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
		<ConversationBlock
			messages={localMessages}
			{isLoading}
			onSend={handleSend}
			showMessages={true}
			disabled={!canStartChats}
			disabledMessage={composerHelper}
			{queuedDraft}
			conversationFrameClass={isMain
				? "bg-transparent"
				: "bg-gradient-to-b from-muted/30 via-muted/10 to-background px-3 pb-0 pt-3"}
			scrollRegionClass={isMain
				? ""
				: "rounded-[1.9rem] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.86))] px-2 pb-2 pt-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_46px_-34px_rgba(15,23,42,0.3)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.84))]"}
			composerShellClass={isMain
				? ""
				: "border-t border-border/80 bg-background/96 px-3 pb-3 pt-3 shadow-[0_-14px_30px_-24px_rgba(15,23,42,0.32)]"}
			promptInputClass={isMain
				? ""
				: "rounded-[1.75rem] border-border/85 bg-background/96 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.35)]"}
		>
			{#snippet emptyState()}
				{#if isMain}
					{@render mainEmptyState()}
				{:else}
					{@render drawerEmptyState()}
				{/if}
			{/snippet}
			{#if isMain}
				{#snippet afterInput()}
					{@render workflowTray()}
				{/snippet}
			{/if}
		</ConversationBlock>
	</div>
</div>
