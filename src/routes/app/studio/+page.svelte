<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import {
		eyebrowBadgeClass,
		iconContainerLgClass,
		interactiveItemVariants,
		sectionTitleClass,
		supportingCopyClass,
		surfaceVariants,
	} from "$lib/design/index.js";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { cn } from "$lib/utils.js";
	import {
		Type,
		Image,
		Mic,
		Music2,
		ImageOff,
		Sparkles,
	} from "@lucide/svelte";

	type ServiceCard = {
		id: string;
		title: string;
		description: string;
		icon: typeof Type;
		badge: string;
		category: "text" | "image" | "audio";
	};

	const services: ServiceCard[] = [
		{
			id: "text-generation",
			title: "Text Generation",
			description: "Generate creative copy, summaries, scripts, and more using Gemini.",
			icon: Type,
			badge: "Gemini",
			category: "text",
		},
		{
			id: "image-generation",
			title: "Image Generation",
			description: "Create images from text prompts using Google Imagen.",
			icon: Image,
			badge: "Imagen",
			category: "image",
		},
		{
			id: "image-editing",
			title: "Image Editing",
			description: "Edit and retouch existing images with AI-powered tools.",
			icon: ImageOff,
			badge: "Imagen",
			category: "image",
		},
		{
			id: "audio-transcription",
			title: "Audio Transcription",
			description: "Transcribe spoken audio to text using WhisperX.",
			icon: Mic,
			badge: "WhisperX",
			category: "audio",
		},
		{
			id: "audio-diarization",
			title: "Speaker Diarization",
			description: "Identify and separate speakers in audio recordings.",
			icon: Music2,
			badge: "pyannote",
			category: "audio",
		},
		{
			id: "audio-utility",
			title: "Audio Utility",
			description: "Enhance, clean, normalize, and prepare audio files.",
			icon: Music2,
			badge: "DeepFilterNet",
			category: "audio",
		},
	];

	let activeTab = $state<"all" | "text" | "image" | "audio">("all");
	const filtered = $derived(
		activeTab === "all" ? services : services.filter((s) => s.category === activeTab),
	);
	const heroSurfaceClass = surfaceVariants({
		tone: "hero",
		radius: "panel",
		padding: "lg",
		emphasis: "soft",
	});
	const toolCardClass = cn(
		interactiveItemVariants({ tone: "card", density: "spacious" }),
		"group flex h-full flex-col",
	);
</script>

<svelte:head>
	<title>Studio - Acheulit</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
	<Card.Root class={heroSurfaceClass}>
		<Card.Content class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div class="space-y-3">
				<div class="space-y-2">
					<span class={eyebrowBadgeClass}>Studio</span>
					<h1 class="text-3xl font-semibold tracking-tight">Tool shelf</h1>
					<p class={supportingCopyClass}>
						A focused tool shelf for the current project. Use chat to choose the right tool,
						then come here when you are ready to stage the next step.
					</p>
				</div>
			</div>
			<Button
				href="/app/chat"
				onclick={() =>
					assistantIntentState.queue(
						"Help me choose the best Studio tool for the current project and explain why.",
						"studio-surface",
					)}
				class="gap-2 rounded-full px-4"
			>
				<Sparkles class="size-4" />
				Chat
			</Button>
		</Card.Content>
	</Card.Root>

	<div class="min-h-0 flex-1 overflow-hidden">
		<Tabs.Root bind:value={activeTab} class="flex h-full flex-col overflow-hidden">
			<Tabs.List>
				<Tabs.Trigger value="all">All</Tabs.Trigger>
				<Tabs.Trigger value="text">Text</Tabs.Trigger>
				<Tabs.Trigger value="image">Image</Tabs.Trigger>
				<Tabs.Trigger value="audio">Audio</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value={activeTab} class="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each filtered as service (service.id)}
						<a
							href="/app/chat"
							class={toolCardClass}
							onclick={() =>
								assistantIntentState.queue(
									`Prepare a ${service.title.toLowerCase()} step for this project and tell me the best prompt or setup to use.`,
									`studio:${service.id}`,
								)}
						>
							<div class="flex items-start justify-between gap-3">
								<div class="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-primary/10">
									<service.icon class="size-5 text-primary" />
								</div>
								<span class="rounded-full border border-border/70 bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-medium text-muted-foreground">
									{service.badge}
								</span>
							</div>
							<div class="mt-4">
								<p class={sectionTitleClass}>{service.title}</p>
								<p class="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
							</div>
						</a>
					{/each}
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
