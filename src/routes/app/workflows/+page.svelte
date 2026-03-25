<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
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
	<title>Workflows - Workspace</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Workflows</h1>
			<p class="text-muted-foreground text-sm">
				Chain AI services together into repeatable automated pipelines.
			</p>
		</div>
		<Button disabled class="gap-2">
			<Plus class="size-4" />
			New Workflow
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
							<Button variant="outline" size="sm" disabled class="gap-1.5">
								Use Template
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
				Build and save your own multi-step pipelines with a visual editor.
			</p>
		</Card.Content>
	</Card.Root>
</div>
