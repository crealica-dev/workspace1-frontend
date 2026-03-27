<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		ChatContainerContent,
		ChatContainerRoot,
	} from "$lib/components/prompt-kit/chat-container";
	import AssetPreviewCard from "$lib/components/asset-preview-card.svelte";
	import {
		Message,
		MessageContent,
		MessageActions,
		MessageAction,
	} from "$lib/components/prompt-kit/message";
	import {
		PromptInput,
		PromptInputAction,
		PromptInputActions,
		PromptInputTextarea,
	} from "$lib/components/prompt-kit/prompt-input";
	import { ScrollButton, setScrollContext } from "$lib/components/prompt-kit/scroll-button";
	import { Button } from "$lib/components/ui/button/index.js";
	import type { ConversationAttachment, ConversationItem } from "$lib/api/projects";
	import { cn } from "$lib/utils";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import CameraIcon from "@lucide/svelte/icons/camera";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import ImageIcon from "@lucide/svelte/icons/image";
	import MicIcon from "@lucide/svelte/icons/mic";
	import MicOffIcon from "@lucide/svelte/icons/mic-off";
	import PaperclipIcon from "@lucide/svelte/icons/paperclip";
	import PlayIcon from "@lucide/svelte/icons/play";
	import AtSignIcon from "@lucide/svelte/icons/at-sign";
	import XIcon from "@lucide/svelte/icons/x";
	import { watch } from "runed";

	import CopyIcon from "@lucide/svelte/icons/copy";
	import ThumbsUpIcon from "@lucide/svelte/icons/thumbs-up";
	import ThumbsDownIcon from "@lucide/svelte/icons/thumbs-down";
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
	import BotIcon from "@lucide/svelte/icons/bot";
	import CircleUserIcon from "@lucide/svelte/icons/circle-user";
	import type { Snippet } from "svelte";

	type PromptDraft = {
		id: string;
		text: string;
	};

	type ConversationVariant = "main" | "side-panel";

	type Props = {
		messages?: ConversationItem[];
		isLoading?: boolean;
		onSend?: (content: string, attachments: ConversationAttachment[]) => void;
		showMessages?: boolean;
		disabled?: boolean;
		disabledMessage?: string;
		placeholder?: string;
		queuedDraft?: PromptDraft | null;
		attachments?: ConversationAttachment[];
		availableAttachments?: ConversationAttachment[];
		attachmentsLoading?: boolean;
		onAttachFiles?: (files: File[]) => void | Promise<void>;
		onToggleAttachment?: (attachment: ConversationAttachment) => void;
		onRemoveAttachment?: (attachmentVersionId: string) => void;
		afterInput?: Snippet;
		emptyState?: Snippet;
		variant?: ConversationVariant;
		children?: Snippet;
	};

	let {
		messages = [],
		isLoading = false,
		onSend,
		showMessages = true,
		disabled = false,
		disabledMessage = '',
		placeholder = 'Message agent...',
		queuedDraft = null,
		attachments = [],
		availableAttachments = [],
		attachmentsLoading = false,
		onAttachFiles,
		onToggleAttachment,
		onRemoveAttachment,
		afterInput,
		emptyState,
		variant = "main",
		children,
	}: Props = $props();

	const scrollContext = setScrollContext();
	const variantClasses = $derived(
		variant === "side-panel"
			? {
					frame: "bg-[var(--surface-muted)] px-3 pb-0 pt-3",
					scroll: "rounded-2xl border border-[var(--shell-border-soft)] bg-background",
					composer:
						"bg-[var(--surface-muted)] px-3 pb-3 pt-2",
					input: "bg-background shadow-sm",
				}
			: {
					frame: "bg-transparent",
					scroll: "",
					composer: "",
					input: "bg-popover shadow-xs",
				},
	);

	let prompt = $state("");
	let isRecording = $state(false);
	let containerRef = $state<HTMLDivElement | null>(null);
	let attachMenuOpen = $state(false);
	let attachMenuRef = $state<HTMLDivElement | null>(null);
	let fileInputRef = $state<HTMLInputElement | null>(null);
	let lastQueuedDraftId = $state<string | null>(null);

	watch(
		() => containerRef,
		() => {
			if (containerRef) {
				scrollContext.setElement(containerRef);
			}
		}
	);

	$effect(() => {
		if (!attachMenuOpen || typeof document === "undefined") return;

		const handlePointerDown = (event: MouseEvent) => {
			const target = event.target;
			if (target instanceof Node && attachMenuRef?.contains(target)) return;
			attachMenuOpen = false;
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				attachMenuOpen = false;
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	});

	$effect(() => {
		const draft = queuedDraft;
		if (!draft || draft.id === lastQueuedDraftId) return;

		prompt = prompt.trim() ? `${prompt.trim()}\n${draft.text}` : draft.text;
		lastQueuedDraftId = draft.id;
	});

	function handleSubmit() {
		if (disabled) return;
		if (!prompt.trim()) return;
		if (onSend) {
			onSend(prompt.trim(), attachments);
		}
		prompt = "";
		attachMenuOpen = false;
	}

	function handleCopy(content: string) {
		navigator.clipboard.writeText(content);
	}

	function handleLike(id: string | number) {
		console.log("Liked message:", id);
	}

	function handleDislike(id: string | number) {
		console.log("Disliked message:", id);
	}

	function handleRegenerate(id: string | number) {
		console.log("Regenerate message:", id);
	}

	function toggleMic() {
		isRecording = !isRecording;
	}

	function handleFilesSelected(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		input.value = "";
		if (!files.length || !onAttachFiles) return;
		void onAttachFiles(files);
	}

	async function openLibraryImport() {
		attachMenuOpen = !attachMenuOpen;

		if (!availableAttachments.length && typeof window !== "undefined" && window.location.pathname !== "/app/library") {
			await goto("/app/library#library");
		}
	}

	function queueImportPrompt(source: string) {
		const promptText =
			source === "instagram"
				? "Import from Instagram: paste the post, reel, or profile URL and tell me what to extract."
				: source === "youtube"
					? "Import from YouTube: paste the video URL and describe the clip, transcript, or summary you want."
					: 'Import from X: paste the post URL and tell me what context or media to capture.';

		prompt = prompt.trim() ? `${prompt}\n${promptText}` : promptText;
		attachMenuOpen = false;
	}
</script>

<div class="flex h-full w-full flex-col">
	{#if showMessages}
		<div class={cn("relative flex-1 overflow-hidden", variantClasses.frame)}>
			<div bind:this={containerRef} class={cn("h-full overflow-y-auto", variant === "side-panel" ? "py-0" : "py-4", variantClasses.scroll)}>
				<ChatContainerRoot class={cn("relative h-full w-full flex-1 space-y-0 overflow-y-auto", variant === "side-panel" ? "px-1" : "px-3")}>
					<ChatContainerContent class={cn("min-w-full space-y-6", variant === "side-panel" ? "px-1 py-2" : "px-2 py-4")}>
						{#if emptyState && messages.length === 0 && !isLoading}
							<div class="flex min-h-full items-center justify-center">
								<div class="w-full">
									{@render emptyState()}
								</div>
							</div>
						{/if}
						{#each messages as message, index (message.id)}
							{@const isAssistant = message.role === "assistant"}
							{@const isTool = message.eventType === "tool_call" || message.eventType === "tool_result"}
							{@const isAssetOnly = message.eventType === "asset"}
							{@const isLastMessage = index === messages.length - 1}
							<Message
								class={cn(
								"mx-auto flex w-full max-w-full flex-col gap-2 px-0",
									isAssistant || isTool || isAssetOnly ? "items-start" : "items-end"
								)}
							>
								{#if isTool}
									<div class="group flex w-full gap-3">
										<div class="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
											<BotIcon class="size-4 text-primary" />
										</div>
										<div class="min-w-0 flex-1 rounded-2xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)] p-3">
											<p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
												{message.eventType === "tool_call" ? "Tool call" : "Tool result"}
											</p>
											<p class="mt-1 text-sm font-medium">
												{message.toolInvocation?.tool_name ?? message.toolResult?.tool_name ?? message.name ?? "Tool"}
											</p>
											{#if message.toolInvocation && Object.keys(message.toolInvocation.arguments).length > 0}
												<details class="mt-2">
													<summary class="cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">Arguments</summary>
													<pre class="mt-1 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-background p-3 font-mono text-xs text-muted-foreground">{JSON.stringify(message.toolInvocation.arguments, null, 2)}</pre>
												</details>
											{/if}
											{#if message.toolResult}
												{#if message.toolResult.assets.length}
													<div class="mt-3 space-y-2">
														{#each message.toolResult.assets as attachment (attachment.asset_version_id)}
															<AssetPreviewCard attachment={attachment} compact={true} />
														{/each}
													</div>
												{:else if message.toolResult.content}
													<p class="mt-2 text-sm leading-6">{message.toolResult.content}</p>
												{/if}
											{/if}
										</div>
									</div>
								{:else if isAssetOnly && message.preview}
									<div class="group flex w-full gap-3">
										<div class="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
											{#if message.role === "user"}
												<CircleUserIcon class="size-4 text-primary" />
											{:else}
												<BotIcon class="size-4 text-primary" />
											{/if}
										</div>
										<div class="min-w-0 flex-1">
											<AssetPreviewCard attachment={message.preview} compact={true} />
										</div>
									</div>
								{:else if isAssistant}
								<div class="group flex w-full gap-3">
									<div class="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<BotIcon class="size-4 text-primary" />
									</div>
									<div class="min-w-0 flex-1 flex flex-col gap-0">
										{#if message.content}
											<MessageContent
												class="text-foreground prose w-full flex-1 rounded-lg bg-transparent p-0"
												markdown={true}
												content={message.content}
											></MessageContent>
										{/if}
										{#if message.attachments.length}
											<div class="mt-3 space-y-2">
												{#each message.attachments as attachment (attachment.asset_version_id)}
													<AssetPreviewCard attachment={attachment} compact={true} />
												{/each}
											</div>
										{/if}
										<MessageActions
											class={cn(
												"-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
												isLastMessage && "opacity-100"
											)}
										>
											<MessageAction>
												{#snippet tooltip()}
													<p>Copy</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleCopy(message.content)}
												>
													<CopyIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
											<MessageAction>
												{#snippet tooltip()}
													<p>Like</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleLike(message.id)}
												>
													<ThumbsUpIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
											<MessageAction>
												{#snippet tooltip()}
													<p>Dislike</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleDislike(message.id)}
												>
													<ThumbsDownIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
											<MessageAction>
												{#snippet tooltip()}
													<p>Regenerate</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleRegenerate(message.id)}
												>
													<RefreshCwIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
										</MessageActions>
									</div>
								</div>
								{:else}
									<div class="group flex w-full flex-col items-end gap-1">
										<div class="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
											<div class="flex-1 space-y-2">
												{#if message.content}
													<MessageContent
														class="bg-muted text-primary flex-1 rounded-3xl px-5 py-2.5"
													>
														{message.content}
													</MessageContent>
												{/if}
												{#if message.attachments.length}
													<div class="space-y-2">
														{#each message.attachments as attachment (attachment.asset_version_id)}
															<AssetPreviewCard attachment={attachment} compact={true} />
														{/each}
													</div>
												{/if}
											</div>
											<div class="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
												<CircleUserIcon class="size-4 text-muted-foreground" />
											</div>
										</div>
										<MessageActions
											class={cn(
												"flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
											)}
										>
											<MessageAction>
												{#snippet tooltip()}
													<p>Copy</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleCopy(message.content)}
												>
													<CopyIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
											<MessageAction>
												{#snippet tooltip()}
													<p>Like</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleLike(message.id)}
												>
													<ThumbsUpIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
											<MessageAction>
												{#snippet tooltip()}
													<p>Dislike</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleDislike(message.id)}
												>
													<ThumbsDownIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
											<MessageAction>
												{#snippet tooltip()}
													<p>Regenerate</p>
												{/snippet}
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => handleRegenerate(message.id)}
												>
													<RefreshCwIcon class="h-4 w-4" />
												</Button>
											</MessageAction>
										</MessageActions>
									</div>
								{/if}
							</Message>
						{/each}
						{#if isLoading}
							<Message class="mx-auto flex w-full max-w-full flex-col items-start gap-2 px-0">
								<div class="flex items-center gap-3 px-1 py-2">
									<div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
										<BotIcon class="size-4 text-primary" />
									</div>
									<div class="flex items-center gap-1.5">
										<span class="bg-muted-foreground/40 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]"></span>
										<span class="bg-muted-foreground/40 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]"></span>
										<span class="bg-muted-foreground/40 size-1.5 animate-bounce rounded-full"></span>
									</div>
								</div>
							</Message>
						{/if}
					</ChatContainerContent>
				</ChatContainerRoot>
			</div>
			<div class="absolute right-4 bottom-4">
				<ScrollButton class="shadow-sm" />
			</div>
		</div>
	{/if}

	<div class={cn("z-10 shrink-0", variant === "side-panel" ? "" : "bg-background px-3 pb-3", variantClasses.composer)}>
		<div class="mx-auto max-w-full">
			<PromptInput
				{isLoading}
				{disabled}
				value={prompt}
				onValueChange={(v) => (prompt = v)}
				onSubmit={handleSubmit}
				class={cn(
					"border-input bg-popover relative z-10 w-full border p-0 pt-1 shadow-xs",
					variant === "side-panel" ? "rounded-2xl" : "rounded-3xl",
					variantClasses.input,
				)}
			>
				<div class="flex flex-col">
					<PromptInputTextarea
						placeholder={disabled && disabledMessage ? disabledMessage : placeholder}
						class="min-h-[44px] pt-3 pl-4 text-sm leading-[1.3]"
					/>

					<PromptInputActions
						class="mt-2 flex w-full items-center justify-between gap-2 px-3 pb-3"
					>
						<div class="flex items-center gap-1.5">
							<div bind:this={attachMenuRef} class="relative">
								{#if attachMenuOpen}
									<div class="absolute bottom-11 left-0 z-20 w-72 rounded-xl border border-[var(--shell-border-soft)] bg-background p-1 shadow-lg">
										<button
											type="button"
											class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-[var(--surface-muted)]"
											disabled={disabled}
											onclick={openLibraryImport}
										>
											<FolderIcon class="size-4 text-muted-foreground" />
											Browse library
										</button>
										<button
											type="button"
											class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-[var(--surface-muted)]"
											disabled={disabled}
											onclick={() => fileInputRef?.click()}
										>
											<ImageIcon class="size-4 text-muted-foreground" />
											Upload files
										</button>
										<input
											bind:this={fileInputRef}
											type="file"
											multiple
											class="hidden"
											onchange={handleFilesSelected}
										/>
										<div class="my-1 h-px bg-[var(--shell-border-soft)]"></div>
										<div class="max-h-56 overflow-y-auto px-1 py-1">
											<p class="px-1.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Attach from project</p>
											{#if attachments.length}
												<div class="mb-2 flex flex-wrap gap-1 px-1.5 py-1">
													{#each attachments as attachment (attachment.asset_version_id)}
														<button
															type="button"
															class="inline-flex items-center gap-1 rounded-full border border-[var(--shell-border-soft)] bg-[var(--surface-muted)] px-2 py-1 text-[11px]"
															onclick={() => onRemoveAttachment?.(attachment.asset_version_id)}
														>
															<span class="max-w-28 truncate">{attachment.display_name}</span>
															<XIcon class="size-3" />
														</button>
													{/each}
												</div>
											{/if}
											{#if attachmentsLoading}
												<p class="px-1.5 py-2 text-xs text-muted-foreground">Loading assets…</p>
											{:else if availableAttachments.length}
												<div class="space-y-1">
													{#each availableAttachments as attachment (attachment.asset_version_id)}
														<button
															type="button"
															class="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-muted)]"
															onclick={() => onToggleAttachment?.(attachment)}
														>
															<div class="min-w-0">
																<p class="truncate">{attachment.display_name}</p>
																<p class="truncate text-[11px] text-muted-foreground">
																	{attachment.mime_type ?? attachment.asset_type}
																</p>
															</div>
															{#if attachments.some((item) => item.asset_version_id === attachment.asset_version_id)}
																<XIcon class="size-3.5 text-muted-foreground" />
															{/if}
														</button>
													{/each}
												</div>
											{:else}
												<p class="px-1.5 py-2 text-xs text-muted-foreground">
													Open the library or upload files to attach them here.
												</p>
											{/if}
										</div>
										<div class="my-1 h-px bg-[var(--shell-border-soft)]"></div>
										<p class="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Import from</p>
										<button
											type="button"
											class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-[var(--surface-muted)]"
											disabled={disabled}
											onclick={() => queueImportPrompt("instagram")}
										>
											<CameraIcon class="size-4 text-muted-foreground" />
											Instagram
										</button>
										<button
											type="button"
											class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-[var(--surface-muted)]"
											disabled={disabled}
											onclick={() => queueImportPrompt("youtube")}
										>
											<PlayIcon class="size-4 text-muted-foreground" />
											YouTube
										</button>
										<button
											type="button"
											class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-[var(--surface-muted)]"
											disabled={disabled}
											onclick={() => queueImportPrompt("x")}
										>
											<AtSignIcon class="size-4 text-muted-foreground" />
											X (Twitter)
										</button>
									</div>
								{/if}

								<PromptInputAction>
									{#snippet tooltip()}
										<p>Attach / import</p>
									{/snippet}
									<Button
										variant="outline"
										size="icon"
										class="size-9 rounded-full"
										aria-label="Open import sources"
										aria-expanded={attachMenuOpen}
										aria-haspopup="menu"
										onclick={() => {
											attachMenuOpen = !attachMenuOpen;
										}}
										disabled={disabled}
									>
										<PaperclipIcon class="h-[18px] w-[18px]" />
									</Button>
								</PromptInputAction>
							</div>
						</div>
						<div class="flex items-center gap-1.5">
							<PromptInputAction>
								{#snippet tooltip()}
									<p>{isRecording ? 'Stop recording' : 'Voice input'}</p>
								{/snippet}
								<Button
									variant="outline"
									size="icon"
									class="size-9 rounded-full {isRecording ? 'border-red-400 bg-red-50 text-red-500 dark:bg-red-950/30' : ''}"
									onclick={toggleMic}
									disabled={disabled}
								>
									{#if isRecording}
										<MicOffIcon class="h-[18px] w-[18px]" />
									{:else}
										<MicIcon class="h-[18px] w-[18px]" />
									{/if}
								</Button>
							</PromptInputAction>

							<Button
								size="icon"
								disabled={!prompt.trim() || isLoading || disabled}
								onclick={handleSubmit}
								class="size-9 rounded-full"
							>
								{#if !isLoading}
									<ArrowUpIcon class="h-[18px] w-[18px]" />
								{:else}
									<span class="size-3 rounded-xs bg-white"></span>
								{/if}
							</Button>
						</div>
					</PromptInputActions>
				</div>
			</PromptInput>
			{#if afterInput}
				<div class="pt-3">
					{@render afterInput()}
				</div>
			{/if}
			{#if disabled && disabledMessage}
				<p class="text-muted-foreground px-1 pt-2 text-xs leading-5">
					{disabledMessage}
				</p>
			{/if}
		</div>
	</div>
</div>
