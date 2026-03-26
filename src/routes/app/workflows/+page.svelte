<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
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
	import { Workflow, Zap, GitBranch, Clock, Plus } from "@lucide/svelte";

	type WorkflowTemplate = {
		id: string;
		title: string;
		description: string;
		icon: typeof Workflow;
		steps: number;
		category: string;
	};

	const templates: WorkflowTemplate[] = [
		{
			id: "transcribe-summarize",
			title: "Transcribe & Summarize",
			description: "Upload audio, transcribe it, then generate a structured summary.",
			icon: Zap,
			steps: 3,
			category: "Audio",
		},
		{
			id: "diarize-report",
			title: "Diarize & Report",
			description: "Identify speakers from a recording and produce a speaker report.",
			icon: GitBranch,
			steps: 4,
			category: "Audio",
		},
		{
			id: "image-caption",
			title: "Generate & Caption",
			description: "Create an image from a prompt then auto-caption it for social posts.",
			icon: Workflow,
			steps: 2,
			category: "Image",
		},
		{
			id: "batch-transcribe",
			title: "Batch Transcription",
			description: "Process multiple audio files and merge transcripts into one document.",
			icon: Clock,
			steps: 5,
			category: "Audio",
		},
	];

	const heroSurfaceClass = surfaceVariants({
		tone: "hero",
		radius: "panel",
		padding: "lg",
		emphasis: "soft",
	});
	const workflowCardClass = cn(
		interactiveItemVariants({ tone: "card", density: "spacious" }),
		"group flex h-full flex-col gap-4",
	);
</script>

<svelte:head>
	<title>Workflows - Acheulit</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
	<Card.Root class={heroSurfaceClass}>
		<Card.Content class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div class="space-y-3">
				<div class="space-y-2">
					<span class={eyebrowBadgeClass}>Workflows</span>
					<h1 class="text-3xl font-semibold tracking-tight">Flow recipes</h1>
					<p class={supportingCopyClass}>
						Reusable recipes for the current project. Start in chat when the path is unclear,
						then use a recipe once the next move is obvious.
					</p>
				</div>
			</div>
			<Button
				class="gap-2 rounded-full px-4"
				href="/app/chat"
				onclick={() =>
					assistantIntentState.queue(
						"Review current workflow configurations and suggest the best next automation step.",
						"handoff:workflows",
					)}
			>
				<Plus class="size-4" />
				Chat
			</Button>
		</Card.Content>
	</Card.Root>

	<div class="min-h-0 flex-1 overflow-y-auto pr-1">
		<div>
			<h2 class="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
				Templates
			</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each templates as tpl (tpl.id)}
					<a
						href="/app/chat"
						class={workflowCardClass}
						onclick={() =>
							assistantIntentState.queue(
								`Start the ${tpl.title} workflow for my current project and walk me through the first step.`,
								`workflow:${tpl.id}`,
							)}
					>
						<div class="flex items-start gap-3">
							<div class={iconContainerLgClass}>
								<tpl.icon class="size-5 text-primary" />
							</div>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<p class={sectionTitleClass}>{tpl.title}</p>
									<span class="rounded-full border border-[var(--shell-border-soft)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-muted-foreground">
										{tpl.category}
									</span>
								</div>
								<p class="mt-2 text-sm leading-6 text-muted-foreground">{tpl.description}</p>
							</div>
						</div>
						<span class="mt-auto text-xs text-muted-foreground">{tpl.steps} steps</span>
					</a>
				{/each}
			</div>
		</div>

		<Card.Root class={cn(surfaceVariants({ tone: "ghost", radius: "panel", padding: "lg", emphasis: "flat" }), "mt-6")}>
			<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
				<Workflow class="mb-3 size-10 text-muted-foreground/50" />
				<p class="text-sm font-medium text-muted-foreground">Custom workflows coming soon</p>
				<p class="mt-1 max-w-xs text-xs text-muted-foreground/70">
					Custom saved flows can come later. For now, start from chat and keep the workflow
					steps attached to the active thread.
				</p>
			</Card.Content>
		</Card.Root>
	</div>
</div>
