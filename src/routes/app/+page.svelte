<script lang="ts">
	import AssistantWorkspace from "$lib/components/assistant-workspace.svelte";
	import WorkspaceContextRail from "$lib/components/workspace-context-rail.svelte";
	import { assistantIntentState } from "$lib/stores/assistant-intent.svelte";
	import { projectStore } from "$lib/stores/project.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { FolderKanban, Sparkles, Workflow } from "@lucide/svelte";

	let { data } = $props();

	const welcomeName = $derived(formatDisplayName(data.email ?? ""));
	const currentProject = $derived(projectStore.currentProject);
	const sessionCount = $derived(projectStore.sessions.length);

	function formatDisplayName(value: string) {
		const [rawName] = value.split("@");
		const normalized = rawName.replace(/[._-]+/g, " ").trim();
		if (!normalized) return "there";
		return normalized
			.split(/\s+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}

	function queueHomePrompt(text: string) {
		assistantIntentState.queue(text, "app-home");
	}
</script>

<svelte:head>
	<title>Chat Workspace - Acheulit</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<section class="overflow-hidden rounded-[2rem] border border-border/70 bg-gradient-to-br from-background via-background to-muted/35 shadow-sm">
		<div class="flex flex-col gap-6 p-6 sm:p-7">
			<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div class="space-y-3">
					<Badge
						variant="outline"
						class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
					>
						Primary workspace
					</Badge>
					<div class="space-y-2">
						<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
							Keep the conversation at the center, {welcomeName}
						</h1>
						<p class="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
							Acheulit now treats chat as the main canvas for project planning, source review,
							generation, and refinement. The library, studio tools, and flows remain close by
							as supporting surfaces instead of separate starting points.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<Button variant="outline" class="gap-2 rounded-full px-4" href="/app/projects">
						<FolderKanban class="size-4" />
						Open Library
					</Button>
					<Button variant="outline" class="gap-2 rounded-full px-4" href="/app/workflows">
						<Workflow class="size-4" />
						View Flows
					</Button>
				</div>
			</div>

			<div class="grid gap-3 lg:grid-cols-3">
				<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Current project
					</p>
					<p class="mt-3 truncate text-lg font-semibold">
						{currentProject?.name ?? "Preparing project context"}
					</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						{currentProject?.description ??
							"Acheulit will attach the active project here once the backend connection is ready."}
					</p>
				</div>
				<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Open threads
					</p>
					<p class="mt-3 text-3xl font-semibold tracking-tight">{sessionCount}</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						{sessionCount === 1
							? "One conversation is ready to continue."
							: "Use one main thread or branch into focused conversations without losing project context."}
					</p>
				</div>
				<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Next handoff
					</p>
					<p class="mt-3 text-lg font-semibold">Stage the next prompt</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						Use the workflow tray under the composer to prefill planning, source review, generation,
						or refinement prompts.
					</p>
					<Button
						variant="ghost"
						class="mt-3 h-auto rounded-xl px-0 text-sm font-medium text-primary"
						onclick={() =>
							queueHomePrompt("Plan the next best step for this project and explain why it matters.")
						}
					>
						Prefill a planning prompt
						<Sparkles class="ms-2 size-4" />
					</Button>
				</div>
			</div>
		</div>
	</section>

	<section class="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
		<AssistantWorkspace variant="main" />
		<WorkspaceContextRail />
	</section>
</div>
