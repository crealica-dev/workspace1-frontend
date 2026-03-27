<script lang="ts">
	import { goto } from "$app/navigation";
	import ConversationBlock from "$lib/components/prompt-kit-blocks/conversation-with-prompt-input.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { auth } from "$lib/auth";
	import {
		interactiveItemVariants,
		metricLabelClass,
		shellLayoutVariants,
		surfaceVariants,
		workspaceStatusTone,
	} from "$lib/design/index.js";
	import {
		listMcpTools,
		listProjectAssets,
		normalizeWorkspaceError,
		mapSessionEventToConversationItem,
		streamChat,
		uploadProjectAsset,
		type ConversationAttachment,
		type ProjectAsset,
	} from "$lib/api/projects";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { projectStore, type ChatMessage } from "$lib/stores/project.svelte";
	import { cn } from "$lib/utils.js";
	import {
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
	} from "@lucide/svelte";
	import { untrack } from "svelte";

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
	let outputExpanded = $state(false);
	let availableAttachments = $state<ConversationAttachment[]>([]);
	let attachmentsLoading = $state(false);
	let composerAttachments = $state<ConversationAttachment[]>([]);

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
	const lastAssistantMessage = $derived(
		[...localMessages].reverse().find((m) => m.role === "assistant" && m.content) ?? null,
	);
	const hasAssistantMessages = $derived(
		localMessages.some((m) => m.role === "assistant"),
	);
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

	$effect(() => {
		const project = currentProject;
		const token = getAccessToken();
		let cancelled = false;
		const alreadyLoadedForProject = untrack(
			() => agentPanelState.loadedProjectId === project?.id && agentPanelState.tools.length > 0,
		);

		if (!project || !token || workspaceStatus !== "ready") {
			agentPanelState.setToolLoading(false);
			return;
		}
		if (alreadyLoadedForProject) return;

		agentPanelState.setToolLoading(true);
		agentPanelState.setToolError(null);

		void listMcpTools(project.id, token)
			.then((tools) => {
				if (cancelled) return;
				agentPanelState.setToolLoading(false);
				agentPanelState.setTools(project.id, tools);
			})
			.catch((error) => {
				if (cancelled) return;
				agentPanelState.setToolLoading(false);
				agentPanelState.setToolError(
					normalizeWorkspaceError(error).userMessage || "The MCP tool catalog could not be loaded.",
				);
			});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		const project = currentProject;
		const token = getAccessToken();
		let cancelled = false;

		if (!project || !token || workspaceStatus !== "ready") {
			availableAttachments = [];
			composerAttachments = [];
			return;
		}

		attachmentsLoading = true;
		void listProjectAssets(project.id, token)
			.then((assets) => {
				if (cancelled) return;
				availableAttachments = assets
					.map((asset) => projectAssetToAttachment(asset))
					.filter((item): item is ConversationAttachment => !!item);
			})
			.catch(() => {
				if (cancelled) return;
				availableAttachments = [];
			})
			.finally(() => {
				if (!cancelled) attachmentsLoading = false;
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

	async function handleSend(content: string, attachments: ConversationAttachment[] = []) {
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
			const attachmentIds = attachments.map((attachment) => attachment.asset_version_id);

			localMessages = [
				...localMessages,
				createLocalMessage(userMessageId, "user", content, attachments),
			];
			composerAttachments = [];
			isLoading = true;

			await streamChat(
				project.id,
				session.id,
				content,
				token,
				{
					enabledTools: agentPanelState.automatedToolUsage
						? agentPanelState.tools.map((t) => t.id)
						: agentPanelState.enabledToolIds,
					attachmentVersionIds: attachmentIds,
					automatedToolUsage: true,
				},
				{
				onUserEvent(event) {
					const actual = mapSessionEventToConversationItem(event);
					localMessages = localMessages.map((message) =>
						message.id === userMessageId ? actual : message,
					);
					localMessages = [
						...localMessages,
						createLocalMessage(assistantMessageId, "assistant", ""),
					];
				},
				onAsset(event) {
					appendConversationItem(mapSessionEventToConversationItem(event));
				},
				onToolCall(event) {
					appendConversationItem(mapSessionEventToConversationItem(event));
				},
				onToolResult(event) {
					appendConversationItem(mapSessionEventToConversationItem(event));
				},
				onChunk(text) {
					localMessages = localMessages.map((message) =>
						message.id === assistantMessageId
							? { ...message, content: `${message.content}${text}` }
							: message,
					);
				},
				onDone(event, fullText) {
					const actual = mapSessionEventToConversationItem(event);
					localMessages = localMessages.map((message) =>
						message.id === assistantMessageId
							? { ...actual, content: fullText || actual.content }
							: message,
					);
					chatError = null;
					isLoading = false;
				},
				onError(message) {
					localMessages = localMessages.map((item) =>
						item.id === assistantMessageId
							? { ...item, content: `Request failed: ${message}` }
							: item,
					);
					chatError = message;
					isLoading = false;
				},
			},
			);
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
				createLocalMessage(assistantMessageId, "assistant", `Request failed: ${failureText}`),
			];
			chatError = failureText;
			isLoading = false;
		}
	}

	async function handleAttachFiles(files: File[]) {
		const token = getAccessToken();
		const project = currentProject;
		if (!token || !project || !files.length) return;

		const uploaded: ConversationAttachment[] = [];
		for (const file of files) {
			const response = await uploadProjectAsset(project.id, file, token, {
				displayName: file.name,
				assetType: inferAssetType(file),
				source: "chat",
			});
			const attachment = projectAssetToAttachment(response.asset, response.asset_version.id);
			if (attachment) uploaded.push(attachment);
		}
		availableAttachments = [...uploaded, ...availableAttachments];
		composerAttachments = [...composerAttachments, ...uploaded];
	}

	function toggleComposerAttachment(attachment: ConversationAttachment) {
		if (composerAttachments.some((item) => item.asset_version_id === attachment.asset_version_id)) {
			composerAttachments = composerAttachments.filter(
				(item) => item.asset_version_id !== attachment.asset_version_id,
			);
			return;
		}
		composerAttachments = [...composerAttachments, attachment];
	}

	function removeComposerAttachment(assetVersionId: string) {
		composerAttachments = composerAttachments.filter(
			(attachment) => attachment.asset_version_id !== assetVersionId,
		);
	}

	function inferAssetType(file: File): string {
		if (file.type.startsWith("image/")) return "image";
		if (file.type.startsWith("video/")) return "video";
		if (file.type.startsWith("audio/")) return "audio";
		if (
			file.type.startsWith("text/") ||
			file.type.includes("pdf") ||
			file.type.includes("json") ||
			file.type.includes("document")
		) {
			return "document";
		}
		return "binary";
	}

	function projectAssetToAttachment(asset: ProjectAsset, versionIdOverride?: string): ConversationAttachment | null {
		const assetVersionId = versionIdOverride ?? asset.latest_version_id;
		if (!assetVersionId) return null;
		const signedUrl = typeof asset.metadata?.signed_url === "string" ? asset.metadata.signed_url : null;
		return {
			asset_id: asset.id,
			asset_version_id: assetVersionId,
			display_name: asset.display_name,
			asset_type: asset.asset_type,
			mime_type: asset.mime_type,
			signed_url: signedUrl,
			preview_kind: inferPreviewKind(asset.mime_type ?? asset.asset_type),
			storage_path: asset.library_path,
		};
	}

	function inferPreviewKind(value: string): string {
		const lowered = value.toLowerCase();
		if (lowered.startsWith("image/") || lowered.includes("image")) return "image";
		if (lowered.startsWith("video/") || lowered.includes("video")) return "video";
		if (lowered.startsWith("audio/") || lowered.includes("audio")) return "audio";
		if (
			lowered.startsWith("text/") ||
			lowered.includes("pdf") ||
			lowered.includes("json") ||
			lowered.includes("markdown") ||
			lowered.includes("document")
		) {
			return "document";
		}
		return "file";
	}

	function createLocalMessage(
		id: string,
		role: "user" | "assistant",
		content: string,
		attachments: ConversationAttachment[] = [],
	): ChatMessage {
		return {
			id,
			eventType: role === "user" ? "user_message" : "assistant_message",
			role,
			name: null,
			content,
			payload: {},
			assetVersionId: null,
			attachments,
			toolInvocation: null,
			toolResult: null,
			preview: attachments[0] ?? null,
			createdAt: new Date().toISOString(),
		};
	}

	function isRecord(value: unknown): value is Record<string, unknown> {
		return !!value && typeof value === "object" && !Array.isArray(value);
	}

	function appendConversationItem(item: ChatMessage) {
		if (
			item.eventType === "asset" &&
			item.assetVersionId &&
			localMessages.some(
				(message) =>
					message.assetVersionId === item.assetVersionId ||
					message.attachments.some((attachment) => attachment.asset_version_id === item.assetVersionId) ||
					message.toolResult?.assets.some((attachment) => attachment.asset_version_id === item.assetVersionId),
			)
		) {
			return;
		}
		localMessages = [...localMessages, item];
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
				<div class="relative mt-1 h-4">
					<p
						class="absolute text-[11px] text-muted-foreground leading-4 transition-all duration-200"
						class:opacity-0={workflowMode !== "guided"}
					>
						Assistant stages each step and prompts before continuing.
					</p>
					<p
						class="absolute text-[11px] text-muted-foreground leading-4 transition-all duration-200"
						class:opacity-0={workflowMode !== "manual"}
					>
						You control the sequence; the assistant helps when asked.
					</p>
				</div>
			</div>

			<p class="text-[11px] text-muted-foreground">
				Need help? <a href="/app/help" class="font-medium text-primary hover:underline">View tutorials →</a>
			</p>

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

			{#if activeStep === "generate" && hasAssistantMessages}
				<div class="flex flex-wrap items-center gap-2">
					<p class="mr-1 text-xs text-muted-foreground">Output review:</p>
					<button
						type="button"
						class={cn(
							interactiveItemVariants({ tone: "pill", density: "compact" }),
							"border-primary/30 bg-primary/10 text-xs font-medium text-foreground",
						)}
						onclick={() =>
							assistantIntentState.queue(
								"The output looks good. Continue to the next step.",
								"workflow:approve",
							)}
					>
						Approve &amp; continue
					</button>
					<button
						type="button"
						class={cn(
							interactiveItemVariants({ tone: "pill", density: "compact" }),
							"text-xs font-medium",
						)}
						onclick={() =>
							assistantIntentState.queue(
								"The output needs revision. Here is what to change: ",
								"workflow:revise",
							)}
					>
						Request revision
					</button>
				</div>
			{/if}

			<div class="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
				<div class={supportingBlockClass}>
					<p class={metricLabelClass}>
						Latest output
					</p>
					{#if lastAssistantMessage}
						<p
							class={cn(
								"mt-2 text-xs leading-5 text-foreground",
								!outputExpanded && "line-clamp-3",
							)}
						>
							{lastAssistantMessage.content}
						</p>
						<button
							type="button"
							class="mt-1.5 text-xs font-medium text-primary"
							onclick={() => (outputExpanded = !outputExpanded)}
						>
							{outputExpanded ? "Collapse" : "See full"}
						</button>
					{:else}
						<p class="mt-2 text-sm font-medium">
							{currentProject?.name ?? "No active project yet"}
						</p>
						<p class="text-muted-foreground mt-1 text-xs leading-5">
							{currentProject?.description ??
								"Once the project context loads, this tray stays attached to the conversation."}
						</p>
					{/if}
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

			{#if localMessages.length > 2 && activeStep === "refine"}
				<div class={surfaceVariants({ tone: "accent", radius: "block", padding: "md", emphasis: "flat" })}>
					<p class={metricLabelClass}>Refine loop</p>
					<p class="mt-2 text-sm font-medium">Review before you continue</p>
					<div class="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							class={cn(
								interactiveItemVariants({ tone: "pill", density: "compact" }),
								"text-xs font-medium",
							)}
							onclick={() =>
								assistantIntentState.queue(
									"Save the current output as a draft and summarize what was accomplished.",
									"refine:save",
								)}
						>
							Save this draft
						</button>
						<button
							type="button"
							class={cn(
								interactiveItemVariants({ tone: "pill", density: "compact" }),
								"text-xs font-medium",
							)}
							onclick={() =>
								assistantIntentState.queue(
									"Start the next refinement pass. Focus on improving quality and filling any gaps.",
									"refine:next",
								)}
						>
							Start next pass
						</button>
					</div>
				</div>
			{/if}

			<div class="flex items-center justify-end gap-3">
				<a
					href="/app/library"
					class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<ExternalLink class="size-3" />
					Open full library
				</a>
				<a
					href="/app/studio"
					class="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<ExternalLink class="size-3" />
					Open Studio
				</a>
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
					onclick={() => goto("/app/library")}
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

		{#if canStartChats}
			<div class="grid gap-2">
				{#each drawerSuggestions as suggestion}
					<button
						onclick={() => handleSend(suggestion)}
						class={cn(
							interactiveItemVariants({ tone: "card", density: "compact" }),
							"group flex items-start gap-2.5",
						)}
					>
						<div class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-[var(--shell-border-soft)] bg-[var(--surface-muted)]">
							<MessageSquare class="text-muted-foreground size-3.5" />
						</div>
						<span class="text-sm leading-6">{suggestion}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}


<div
	class={workspaceFrameClass}
>
	<div class={shell.assistantHeader()}>
		<div class="flex w-full items-center gap-2">
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
			attachments={composerAttachments}
			availableAttachments={availableAttachments}
			{attachmentsLoading}
			onAttachFiles={handleAttachFiles}
			onToggleAttachment={toggleComposerAttachment}
			onRemoveAttachment={removeComposerAttachment}
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
