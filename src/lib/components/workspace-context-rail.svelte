<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { projectStore } from "$lib/stores/project.svelte";
	import {
		ArrowRight,
		Bot,
		FolderKanban,
		MessageSquare,
		Sparkles,
		Workflow,
	} from "@lucide/svelte";

	const currentProject = $derived(projectStore.currentProject);
	const sessions = $derived(projectStore.sessions);
	const currentSession = $derived(projectStore.currentSession);

	const journeySteps = $derived([
		{
			label: "Project context",
			state: currentProject ? "ready" : "waiting",
			description: currentProject
				? "Context is attached to the workspace."
				: "Load or create a project before deeper work begins.",
			href: "/app/projects",
		},
		{
			label: "Source review",
			state: currentProject ? "ready" : "waiting",
			description: "Keep files, references, and imports connected to the thread.",
			href: "/app/projects#library",
		},
		{
			label: "Generation",
			state: currentSession ? "active" : "next",
			description: "Use chat to decide the next prompt, service, or workflow step.",
			href: "/app/studio",
		},
		{
			label: "Refinement",
			state: sessions.length > 0 ? "active" : "next",
			description: "Revisit outputs and keep refining instead of starting over.",
			href: "/app/workflows",
		},
	]);

	function queueStarter(text: string) {
		assistantIntentState.queue(text, "context-rail");
	}

	function getStateTone(state: string) {
		switch (state) {
			case "ready":
				return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300";
			case "active":
				return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300";
			default:
				return "border-border/70 bg-muted/35 text-muted-foreground";
		}
	}
</script>

<aside class="flex flex-col gap-4">
	<Card.Root class="border-border/70 shadow-sm">
		<Card.Header class="space-y-3">
			<div class="flex items-center justify-between gap-3">
				<div class="space-y-1">
					<Badge
						variant="outline"
						class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
					>
						Right rail
					</Badge>
					<Card.Title class="text-lg">Project context</Card.Title>
				</div>
				<div class="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
					<Bot class="size-4 text-primary" />
				</div>
			</div>
			<Card.Description>
				Keep project status, supporting surfaces, and next-step guidance visible without leaving the
				conversation.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
				<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					Active project
				</p>
				<p class="mt-2 text-sm font-semibold">
					{currentProject?.name ?? "Waiting for project context"}
				</p>
				<p class="text-muted-foreground mt-1 text-xs leading-5">
					{currentProject?.description ??
						"The chat workspace will pull project details here once the backend is ready."}
				</p>
			</div>

			<div class="space-y-2">
				<div class="flex items-center justify-between gap-2">
					<p class="text-sm font-semibold">Journey map</p>
					<Badge variant="outline" class="rounded-full text-[10px] uppercase tracking-[0.16em]">
						Left / Main / Right
					</Badge>
				</div>
				<div class="space-y-2">
					{#each journeySteps as step}
						<a
							href={step.href}
							class="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/80 px-3 py-3 transition-colors hover:border-primary/25 hover:bg-primary/[0.03]"
						>
							<span
								class="mt-0.5 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] {getStateTone(step.state)}"
							>
								{step.state}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block text-sm font-medium">{step.label}</span>
								<span class="text-muted-foreground mt-1 block text-xs leading-5">
									{step.description}
								</span>
							</span>
						</a>
					{/each}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-border/70 shadow-sm">
		<Card.Header>
			<Card.Title class="text-base">Quick handoffs</Card.Title>
			<Card.Description>Prefill the chat from the right rail when you know the next move.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-3">
			<Button
				variant="outline"
				class="w-full justify-between rounded-2xl"
				href="/app"
				onclick={() =>
					queueStarter("Summarize what has happened in this project and recommend the next action.")
				}
			>
				Summarize current work
				<MessageSquare class="size-4" />
			</Button>
			<Button
				variant="outline"
				class="w-full justify-between rounded-2xl"
				href="/app"
				onclick={() =>
					queueStarter("Review the active project context and tell me what assets or references are still missing.")
				}
			>
				Review missing context
				<FolderKanban class="size-4" />
			</Button>
			<Button
				variant="outline"
				class="w-full justify-between rounded-2xl"
				href="/app"
				onclick={() =>
					queueStarter("Help me choose the best Acheulit workflow for the current project.")
				}
			>
				Choose a workflow
				<Workflow class="size-4" />
			</Button>
		</Card.Content>
	</Card.Root>

	<Card.Root class="border-border/70 shadow-sm">
		<Card.Header>
			<Card.Title class="text-base">Session rhythm</Card.Title>
			<Card.Description>
				Use the main conversation as the center, then dip into supporting surfaces as needed.
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-3">
			<div class="rounded-2xl border border-border/70 bg-muted/25 px-4 py-4">
				<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					Open sessions
				</p>
				<p class="mt-2 text-2xl font-semibold tracking-tight">{sessions.length}</p>
				<p class="text-muted-foreground mt-1 text-xs leading-5">
					{currentSession?.title
						? `Current thread: ${currentSession.title}`
						: "Start a thread from chat to keep work connected."}
				</p>
			</div>

			<div class="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
				<Button variant="ghost" class="justify-between rounded-2xl" href="/app/projects">
					Library
					<ArrowRight class="size-4" />
				</Button>
				<Button variant="ghost" class="justify-between rounded-2xl" href="/app/studio">
					Studio
					<Sparkles class="size-4" />
				</Button>
				<Button variant="ghost" class="justify-between rounded-2xl" href="/app/workflows">
					Flows
					<ArrowRight class="size-4" />
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
</aside>
