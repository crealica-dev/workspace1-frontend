<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { Workflow, Zap, GitBranch, Clock, Plus, ArrowRight } from "@lucide/svelte";

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
</script>

<svelte:head>
	<title>Workflows - Acheulit</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Flows</h1>
			<p class="text-muted-foreground text-sm">
				Use workflow recipes as guided starting points, then continue the real work in the main
				chat workspace.
			</p>
		</div>
		<Button
			class="gap-2"
			href="/app"
			onclick={() =>
				assistantIntentState.queue(
					"Help me choose the best workflow recipe for this project and explain the next step.",
					"workflow-surface",
				)}
		>
			<Plus class="size-4" />
			Continue in Chat
		</Button>
	</div>

	<div>
		<h2 class="text-muted-foreground mb-3 text-sm font-medium uppercase tracking-wide">
			Templates
		</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
			{#each templates as tpl (tpl.id)}
				<Card.Root class="flex flex-col">
					<Card.Header>
						<div class="flex items-start gap-3">
							<div class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
								<tpl.icon class="text-primary size-5" />
							</div>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<Card.Title class="text-base">{tpl.title}</Card.Title>
									<span
										class="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
									>
										{tpl.category}
									</span>
								</div>
								<Card.Description class="mt-1">{tpl.description}</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="mt-auto pt-0">
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground text-xs">{tpl.steps} steps</span>
							<Button
								variant="outline"
								size="sm"
								class="gap-1.5"
								href="/app"
								onclick={() =>
									assistantIntentState.queue(
										`Start the ${tpl.title} workflow for my current project and walk me through the first step.`,
										`workflow:${tpl.id}`,
									)}
							>
								Use in Chat
								<ArrowRight class="size-3.5" />
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>

	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
			<Workflow class="text-muted-foreground/50 mb-3 size-10" />
			<p class="text-muted-foreground text-sm font-medium">Custom workflows coming soon</p>
			<p class="text-muted-foreground/70 mt-1 max-w-xs text-xs">
				Custom saved flows can come later. For now, start from chat and keep the workflow steps
				attached to the active thread.
			</p>
		</Card.Content>
	</Card.Root>
</div>
