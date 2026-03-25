<script lang="ts">
	import { goto } from "$app/navigation";
	import {
		ChatContainerContent,
		ChatContainerRoot,
	} from "$lib/components/prompt-kit/chat-container";
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
	import { cn } from "$lib/utils";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import CameraIcon from "@lucide/svelte/icons/camera";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import MicIcon from "@lucide/svelte/icons/mic";
	import MicOffIcon from "@lucide/svelte/icons/mic-off";
	import PaperclipIcon from "@lucide/svelte/icons/paperclip";
	import PlayIcon from "@lucide/svelte/icons/play";
	import XIcon from "@lucide/svelte/icons/x";
	import { watch } from "runed";

	import CopyIcon from "@lucide/svelte/icons/copy";
	import ThumbsUpIcon from "@lucide/svelte/icons/thumbs-up";
	import ThumbsDownIcon from "@lucide/svelte/icons/thumbs-down";
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";

	type ChatMessage = {
		id: string | number;
		role: string;
		content: string;
	};

	type Props = {
		messages?: ChatMessage[];
		isLoading?: boolean;
		onSend?: (content: string) => void;
		showMessages?: boolean;
		disabled?: boolean;
		disabledMessage?: string;
		placeholder?: string;
	};

	let {
		messages = [],
		isLoading = false,
		onSend,
		showMessages = true,
		disabled = false,
		disabledMessage = '',
		placeholder = 'Message agent...',
	}: Props = $props();

	const scrollContext = setScrollContext();

	let prompt = $state("");
	let isRecording = $state(false);
	let containerRef = $state<HTMLDivElement | null>(null);
	let attachMenuOpen = $state(false);
	let attachMenuRef = $state<HTMLDivElement | null>(null);

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

	function handleSubmit() {
		if (disabled) return;
		if (!prompt.trim()) return;
		if (onSend) {
			onSend(prompt.trim());
		}
		prompt = "";
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

	async function openLibraryImport() {
		attachMenuOpen = false;

		if (typeof window !== "undefined" && window.location.pathname === "/app/projects") {
			window.location.hash = "library";
			return;
		}

		await goto("/app/projects#library");
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
		<div class="relative flex-1 overflow-hidden">
			<div bind:this={containerRef} class="h-full overflow-y-auto py-4">
				<ChatContainerRoot class="relative h-full w-full flex-1 space-y-0 overflow-y-auto px-3">
					<ChatContainerContent class="min-w-full space-y-6 px-2 py-4">
						{#each messages as message, index (message.id)}
							{@const isAssistant = message.role === "assistant"}
							{@const isLastMessage = index === messages.length - 1}
							<Message
								class={cn(
								"mx-auto flex w-full max-w-full flex-col gap-2 px-0",
									isAssistant ? "items-start" : "items-end"
								)}
							>
								{#if isAssistant}
									<div class="group flex w-full flex-col gap-0">
										<MessageContent
											class="text-foreground prose w-full flex-1 rounded-lg bg-transparent p-0"
											markdown={true}
											content={message.content}
										></MessageContent>
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
								{:else}
									<div class="group flex w-full flex-col items-end gap-1">
										<MessageContent
											class="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%]"
										>
											{message.content}
										</MessageContent>
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
								<div class="flex items-center gap-1.5 px-1 py-2">
									<span class="bg-muted-foreground/40 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]"></span>
									<span class="bg-muted-foreground/40 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]"></span>
									<span class="bg-muted-foreground/40 size-1.5 animate-bounce rounded-full"></span>
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

	<div class="bg-background z-10 shrink-0 px-3 pb-3">
		<div class="mx-auto max-w-full">
			<PromptInput
				{isLoading}
				{disabled}
				value={prompt}
				onValueChange={(v) => (prompt = v)}
				onSubmit={handleSubmit}
				class="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
			>
				<div class="flex flex-col">
					<PromptInputTextarea
						placeholder={disabled && disabledMessage ? disabledMessage : placeholder}
						class="min-h-[44px] pt-3 pl-4 text-sm leading-[1.3]"
					/>

					<PromptInputActions
						class="mt-4 flex w-full items-center justify-between gap-2 px-3 pb-3"
					>
						<div class="flex items-center gap-1.5">
							<div bind:this={attachMenuRef} class="relative">
								{#if attachMenuOpen}
									<div class="absolute bottom-11 left-0 z-20 flex flex-col gap-1.5 rounded-full border border-border/70 bg-background/92 p-1.5 shadow-lg backdrop-blur">
										<button
											type="button"
											class="flex size-9 items-center justify-center rounded-full border border-border/60 bg-background text-foreground transition hover:bg-muted"
											title="Browse project library"
											disabled={disabled}
											onclick={openLibraryImport}
										>
											<FolderIcon class="size-[18px]" />
										</button>
										<button
											type="button"
											class="flex size-9 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-600 transition hover:bg-pink-100 dark:border-pink-900 dark:bg-pink-950/30 dark:text-pink-300"
											title="Instagram import"
											disabled={disabled}
											onclick={() => queueImportPrompt("instagram")}
										>
											<CameraIcon class="size-[18px]" />
										</button>
										<button
											type="button"
											class="flex size-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
											title="YouTube import"
											disabled={disabled}
											onclick={() => queueImportPrompt("youtube")}
										>
											<PlayIcon class="size-[18px]" />
										</button>
										<button
											type="button"
											class="flex size-9 items-center justify-center rounded-full border border-border/70 bg-foreground text-background transition hover:opacity-90 dark:bg-background dark:text-foreground"
											title="X import"
											disabled={disabled}
											onclick={() => queueImportPrompt("x")}
										>
											<XIcon class="size-[18px]" />
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

							<PromptInputAction>
								{#snippet tooltip()}
									<p>Camera / image</p>
								{/snippet}
								<Button
									variant="outline"
									size="icon"
									class="size-9 rounded-full"
									disabled={disabled}
								>
									<CameraIcon class="h-[18px] w-[18px]" />
								</Button>
							</PromptInputAction>
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
			{#if disabled && disabledMessage}
				<p class="text-muted-foreground px-1 pt-2 text-xs leading-5">
					{disabledMessage}
				</p>
			{/if}
		</div>
	</div>
</div>
