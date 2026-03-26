<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import {
		Type,
		Image,
		Mic,
		Music2,
		ImageOff,
		Sparkles,
		ArrowRight,
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
</script>

<svelte:head>
	<title>Studio - Acheulit</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Studio</h1>
			<p class="text-muted-foreground text-sm">
				Use Studio as the tool shelf for the main workspace, then return to chat to shape the
				next prompt or refinement step.
			</p>
		</div>
		<Button
			href="/app"
			onclick={() =>
				assistantIntentState.queue(
					"Help me choose the best Studio tool for the current project and explain why.",
					"studio-surface",
				)}
			class="gap-2"
		>
			<Sparkles class="size-4" />
			Continue in Chat
		</Button>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="all">All</Tabs.Trigger>
			<Tabs.Trigger value="text">Text</Tabs.Trigger>
			<Tabs.Trigger value="image">Image</Tabs.Trigger>
			<Tabs.Trigger value="audio">Audio</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value={activeTab} class="mt-4">
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filtered as service (service.id)}
					<Card.Root class="group relative flex flex-col">
						<Card.Header>
							<div class="flex items-start justify-between">
								<div
									class="bg-primary/10 flex size-10 items-center justify-center rounded-lg"
								>
									<service.icon class="text-primary size-5" />
								</div>
								<span
									class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium"
								>
									{service.badge}
								</span>
							</div>
							<Card.Title class="mt-3 text-base">{service.title}</Card.Title>
							<Card.Description>{service.description}</Card.Description>
						</Card.Header>
						<Card.Content class="mt-auto pt-0">
							<Button
								variant="outline"
								size="sm"
								class="w-full gap-1.5"
								href="/app"
								onclick={() =>
									assistantIntentState.queue(
										`Prepare a ${service.title.toLowerCase()} step for this project and tell me the best prompt or setup to use.`,
										`studio:${service.id}`,
									)}
							>
								Use in Chat
								<ArrowRight class="size-3.5" />
							</Button>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
