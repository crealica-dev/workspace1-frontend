<script lang="ts">
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import {
		eyebrowBadgeClass,
		interactiveItemVariants,
		metricLabelClass,
		sectionTitleClass,
		supportingCopyClass,
		surfaceVariants,
	} from "$lib/design/index.js";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { projectStore } from "$lib/stores/project.svelte";
	import { cn } from "$lib/utils.js";
	import {
		ArrowRight,
		FolderKanban,
		MessageSquare,
		Sparkles,
		Workflow,
	} from "@lucide/svelte";

	type PromptCard = {
		id: string;
		label: string;
		prompt: string;
	};

	const promptCards: PromptCard[] = [
		{
			id: "plan",
			label: "Plan next step",
			prompt: "Plan the next best step for this project and explain what matters most right now.",
		},
		{
			id: "sources",
			label: "Review sources",
			prompt: "Review the current project context and tell me what source material is still missing.",
		},
		{
			id: "workflow",
			label: "Choose a workflow",
			prompt: "Help me choose the best workflow for this project and explain the first move.",
		},
		{
			id: "refine",
			label: "Refine latest output",
			prompt: "Review the latest output and suggest the strongest refinement pass before I continue.",
		},
	];

	const currentProject = $derived(projectStore.currentProject);
	const sessions = $derived(projectStore.sessions);
	const currentSession = $derived(projectStore.currentSession);

	const heroSurfaceClass = surfaceVariants({
		tone: "hero",
		radius: "panel",
		padding: "lg",
		emphasis: "soft",
	});
	const metricSurfaceClass = surfaceVariants({
		tone: "elevated",
		radius: "block",
		padding: "md",
		emphasis: "flat",
	});
	const moduleSurfaceClass = surfaceVariants({
		tone: "panel",
		radius: "panel",
		padding: "md",
		emphasis: "soft",
	});
	const promptCardClass = cn(
		interactiveItemVariants({ tone: "card", density: "regular" }),
		"flex items-center justify-between gap-3",
	);
	const threadRowClass = cn(
		interactiveItemVariants({ tone: "row", density: "regular" }),
		"flex items-center justify-between gap-3",
	);

	function queuePrompt(text: string, source: string) {
		assistantIntentState.queue(text, source);
	}

	async function selectSession(sessionId: string) {
		const session = sessions.find((entry) => entry.id === sessionId);
		if (!session) return;
		projectStore.currentSession = session;
		await goto("/app/chat");
	}
</script>

<svelte:head>
	<title>Chat - Acheulit</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col overflow-hidden">
	<div class="min-h-0 flex-1 overflow-y-auto pr-1">
		<section class="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
			<Card.Root class={heroSurfaceClass}>
				<Card.Content class="flex h-full flex-col gap-6">
					<div class="space-y-3">
						<Badge variant="outline" class={eyebrowBadgeClass}>Chat desk</Badge>
						<div class="space-y-2">
							<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Chat</h1>
							<p class={supportingCopyClass}>
								Use the right column for the live conversation. Keep context, shortcuts, and
								next-step staging here in the middle.
							</p>
						</div>
					</div>

					<div class="grid gap-3 sm:grid-cols-3">
						<div class={metricSurfaceClass}>
							<p class={metricLabelClass}>Project</p>
							<p class="mt-3 truncate text-lg font-semibold">
								{currentProject?.name ?? "Preparing"}
							</p>
							<p class="mt-1 text-xs leading-5 text-muted-foreground">
								Context stays attached to the chat thread.
							</p>
						</div>
						<div class={metricSurfaceClass}>
							<p class={metricLabelClass}>Active thread</p>
							<p class="mt-3 truncate text-lg font-semibold">
								{currentSession?.title ?? "New Chat"}
							</p>
							<p class="mt-1 text-xs leading-5 text-muted-foreground">
								Switch threads from the panel header anytime.
							</p>
						</div>
						<div class={metricSurfaceClass}>
							<p class={metricLabelClass}>Open threads</p>
							<p class="mt-3 text-3xl font-semibold tracking-tight">{sessions.length}</p>
							<p class="mt-1 text-xs leading-5 text-muted-foreground">
								Keep planning, source review, and refinement in one place.
							</p>
						</div>
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						{#each promptCards as card}
							<button
								type="button"
								class={promptCardClass}
								onclick={() => queuePrompt(card.prompt, `chat:${card.id}`)}
							>
								<span class="text-sm font-medium">{card.label}</span>
								<Sparkles class="size-4 text-muted-foreground" />
							</button>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<div class="grid gap-4">
				<Card.Root class={moduleSurfaceClass}>
					<Card.Header class="space-y-2">
						<Card.Title class={sectionTitleClass}>Supporting surfaces</Card.Title>
						<Card.Description>Move out of chat only when it helps.</Card.Description>
					</Card.Header>
					<Card.Content class="grid gap-2">
						<Button href="/app/projects" variant="ghost" class="justify-between rounded-2xl">
							<span class="inline-flex items-center gap-2">
								<FolderKanban class="size-4" />
								Library
							</span>
							<ArrowRight class="size-4" />
						</Button>
						<Button href="/app/studio" variant="ghost" class="justify-between rounded-2xl">
							<span class="inline-flex items-center gap-2">
								<Sparkles class="size-4" />
								Studio
							</span>
							<ArrowRight class="size-4" />
						</Button>
						<Button href="/app/workflows" variant="ghost" class="justify-between rounded-2xl">
							<span class="inline-flex items-center gap-2">
								<Workflow class="size-4" />
								Workflows
							</span>
							<ArrowRight class="size-4" />
						</Button>
					</Card.Content>
				</Card.Root>

				<Card.Root class={moduleSurfaceClass}>
					<Card.Header class="space-y-2">
						<Card.Title class={sectionTitleClass}>Recent threads</Card.Title>
						<Card.Description>Switch without leaving the shell.</Card.Description>
					</Card.Header>
					<Card.Content class="grid gap-2">
						{#if sessions.length > 0}
							{#each sessions.slice(0, 4) as session}
								<button
									type="button"
									class={threadRowClass}
									onclick={() => selectSession(session.id)}
								>
									<span class="min-w-0 truncate text-sm font-medium">
										{session.title ?? "Untitled chat"}
									</span>
									<MessageSquare class="size-4 shrink-0 text-muted-foreground" />
								</button>
							{/each}
						{:else}
							<div class={surfaceVariants({ tone: "ghost", radius: "block", padding: "md", emphasis: "flat" })}>
								Your first thread will appear here.
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</section>
	</div>
</div>
