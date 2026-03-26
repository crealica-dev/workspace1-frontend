<script lang="ts">
	import { goto } from "$app/navigation";
	import ConversationBlock from "$lib/components/prompt-kit-blocks/conversation-with-prompt-input.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { auth } from "$lib/auth";
	import {
		iconContainerClass,
		interactiveItemVariants,
		metricLabelClass,
		shellLayoutVariants,
		surfaceVariants,
		workspaceStatusTone,
	} from "$lib/design/index.js";
	import {
		normalizeWorkspaceError,
		streamChat,
	} from "$lib/api/projects";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { projectStore, type ChatMessage } from "$lib/stores/project.svelte";
	import { cn } from "$lib/utils.js";
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
	const shell = shellLayoutVariants();
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
	const canStartChats = $derived(workspaceStatus === "ready" && !!currentProject);
	const statusMeta = $derived(
		workspaceStatusTone(workspaceStatus, workspaceStatusMessage),
	);
	const composerHelper = $derived(
		canStartChats
			? workflowMode === "guided"
				? "Guided mode keeps the next move close."
				: "Manual mode keeps the composer open."
			: statusMeta.description,
	);
	const queuedDraft = $derived(assistantIntentState.draft);
	const drawerSuggestions = $derived(SUGGESTIONS.slice(0, 3));
	const workspaceFrameClass = $derived(
		cn(
			"flex h-full min-h-0 flex-col overflow-hidden",
			isMain
				? surfaceVariants({
						tone: "panel",
						radius: "panel",
						padding: "none",
						emphasis: "soft",
					})
				: "rounded-none border-0 shadow-none",
		),
	);
	const workflowTrayClass = surfaceVariants({
		tone: "muted",
		radius: "panel",
		padding: "md",
		emphasis: "flat",
	});
	const supportingBlockClass = surfaceVariants({
		tone: "muted",
		radius: "block",
		padding: "md",
		emphasis: "flat",
	});
	const suggestionCardClass = interactiveItemVariants({
		tone: "card",
		density: "regular",
	});

	function getAccessToken(): string | null {
		return auth.getSessionSnapshot()?.access_token ?? null;
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
			return "border-primary/30 bg-primary/10 text-foreground shadow-sm";
		}
		if (step.state === "ready" || step.state === "active") {
			return "border-[var(--shell-border-soft)] bg-background text-foreground hover:border-border hover:bg-[var(--surface-muted)]";
		}
		return "border-dashed border-[var(--shell-border-soft)] bg-transparent text-muted-foreground";
	}
</script>

{#snippet workflowTray()}
	<div class={workflowTrayClass}>
		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class={metricLabelClass}>
						Workflow tray
					</p>
					<p class="mt-1 text-sm font-medium">
						Keep decisions, previews, and next-step prompts attached to the chat.
					</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						class={cn(
							interactiveItemVariants({ tone: "pill", density: "compact" }),
							"text-xs font-medium",
							workflowMode === "guided"
								? "border-primary/30 bg-primary/10 text-foreground"
								: "text-muted-foreground",
						)}
						onclick={() => (workflowMode = 'guided')}
					>
						Guided mode
					</button>
					<button
						type="button"
						class={cn(
							interactiveItemVariants({ tone: "pill", density: "compact" }),
							"text-xs font-medium",
							workflowMode === "manual"
								? "border-primary/30 bg-primary/10 text-foreground"
								: "text-muted-foreground",
						)}
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
							class={cn(
								interactiveItemVariants({ tone: "row", density: "regular" }),
								"px-3 py-3",
								getStepTone(step),
							)}
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
				<div class={supportingBlockClass}>
					<p class={metricLabelClass}>
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
				<div class={supportingBlockClass}>
					<p class={metricLabelClass}>
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
			<div class="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/10 shadow-sm">
				<Sparkles class="size-7 text-primary" />
			</div>
			<div class="space-y-2">
			<h3 class="text-foreground text-balance text-lg font-semibold tracking-tight">
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
						class={cn(
							suggestionCardClass,
							"flex min-h-24 flex-col items-start justify-between disabled:cursor-not-allowed disabled:opacity-55",
						)}
					>
						<MessageSquare class="text-muted-foreground size-4" />
						<span class="text-sm font-medium leading-6">{suggestion}</span>
				</button>
			{/each}
		</div>

			<div class="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
				<div class={supportingBlockClass}>
					<p class={metricLabelClass}>
						Main canvas
					</p>
				<p class="mt-2 text-sm font-medium">
					Keep planning, generation, and refinement inside the same thread.
				</p>
				<p class="text-muted-foreground mt-1 text-xs leading-5">
					Use the tray below the composer to stage the next micro-step before you send it.
				</p>
			</div>
				<div class={surfaceVariants({ tone: "ghost", radius: "block", padding: "md", emphasis: "flat" })}>
					<p class={metricLabelClass}>
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
	<div class="flex h-full flex-col gap-3 px-2 py-3">
		<div class="space-y-1 px-2 pt-2 text-center">
			<div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)]">
				<Sparkles class="size-5 text-primary" />
			</div>
			<h3 class="text-foreground text-balance text-base font-semibold tracking-tight">
				Open chat
			</h3>
			<p class="text-muted-foreground mx-auto max-w-xs text-xs leading-5">
				Use the live thread here while the middle panel keeps project context close.
			</p>
		</div>

		<div class="grid gap-2">
			{#each drawerSuggestions as suggestion}
				<button
					onclick={() => handleSend(suggestion)}
					disabled={!canStartChats}
					class={cn(
						interactiveItemVariants({ tone: "card", density: "compact" }),
						"group flex items-start gap-2.5 disabled:cursor-not-allowed disabled:opacity-55",
					)}
				>
					<div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--shell-border-soft)] bg-[var(--surface-muted)]">
						<MessageSquare class="text-muted-foreground size-3.5" />
					</div>
					<span class="text-sm leading-6">{suggestion}</span>
				</button>
			{/each}
		</div>

		<p class="px-2 text-xs leading-5 text-muted-foreground">
			{composerHelper}
		</p>
	</div>
{/snippet}

<div
	class={workspaceFrameClass}
>
	<div class={shell.assistantHeader()}>
		<div class="flex items-start gap-2.5">
		<div class={iconContainerClass}>
				<Bot class="size-5 text-primary" />
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-sm font-semibold tracking-tight">
						{isMain ? "Main workspace" : "Acheulit Assistant"}
					</p>
					{#if isMain}
						<Badge
							variant="outline"
							class="rounded-full border-[var(--shell-border-soft)] bg-[var(--surface-muted)] text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
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

			<div class="mt-3 flex items-center gap-2">
				{#if canStartChats}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="border-[var(--shell-border-soft)] bg-[var(--surface-muted)] text-foreground hover:bg-[var(--surface-accent)] flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors"
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
					<div class="border-[var(--shell-border-soft)] bg-[var(--surface-muted)] text-muted-foreground flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs leading-5">
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
			<div class={cn("rounded-2xl border px-4 py-3", statusMeta.panelClass)}>
				<div class="flex items-start gap-3">
					<div class={cn("flex size-9 items-center justify-center rounded-full", statusMeta.iconClass)}>
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
			variant={isMain ? "main" : "side-panel"}
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
