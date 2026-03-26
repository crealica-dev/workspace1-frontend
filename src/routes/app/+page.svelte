<script lang="ts">
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		eyebrowBadgeClass,
		iconContainerClass,
		iconContainerLgClass,
		interactiveItemVariants,
		metricLabelClass,
		sectionTitleClass,
		supportingCopyClass,
		surfaceVariants,
	} from "$lib/design/index.js";
	import { projectStore } from "$lib/stores/project.svelte";
	import { cn } from "$lib/utils.js";
	import {
		ArrowRight,
		Clock3,
		FolderKanban,
		MessageSquare,
		Sparkles,
		Workflow,
	} from "@lucide/svelte";

	let { data } = $props();

	const welcomeName = $derived(formatDisplayName(data.email ?? ""));
	const currentProject = $derived(projectStore.currentProject);
	const sessions = $derived(projectStore.sessions);
	const currentSession = $derived(projectStore.currentSession);
	const workspaceStatus = $derived(projectStore.status);
	const recentSessions = $derived(sessions.slice(0, 2));

	const heroSurfaceClass = surfaceVariants({
		tone: "hero",
		radius: "panel",
		padding: "lg",
		emphasis: "soft",
	});
	const moduleSurfaceClass = surfaceVariants({
		tone: "panel",
		radius: "panel",
		padding: "md",
		emphasis: "soft",
	});
	const metricSurfaceClass = surfaceVariants({
		tone: "elevated",
		radius: "block",
		padding: "md",
		emphasis: "flat",
	});
	const quickTileClass = cn(
		interactiveItemVariants({ tone: "card", density: "spacious" }),
		"group flex h-full flex-col justify-between gap-5",
	);
	const listRowClass = cn(
		interactiveItemVariants({ tone: "row", density: "regular" }),
		"flex items-center justify-between gap-4",
	);

	const shortcutCards = $derived.by(() => [
		{
			title: "Chat",
			href: "/app/chat",
			icon: MessageSquare,
			value: currentSession?.title ?? "Open thread",
		},
		{
			title: "Library",
			href: "/app/projects",
			icon: FolderKanban,
			value: "Assets",
		},
		{
			title: "Studio",
			href: "/app/studio",
			icon: Sparkles,
			value: "Tools",
		},
		{
			title: "Flows",
			href: "/app/workflows",
			icon: Workflow,
			value: "Recipes",
		},
	]);

	function formatDisplayName(value: string) {
		const [rawName] = value.split("@");
		const normalized = rawName.replace(/[._-]+/g, " ").trim();
		if (!normalized) return "there";
		return normalized
			.split(/\s+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}

	function formatDate(iso: string | null | undefined) {
		if (!iso) return "Waiting";
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return "Waiting";
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	}

	async function openSession(sessionId: string) {
		const session = sessions.find((entry) => entry.id === sessionId);
		if (!session) return;
		projectStore.currentSession = session;
		await goto("/app/chat");
	}
</script>

<svelte:head>
	<title>Overview - Acheulit</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
	<section class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
		<div class={heroSurfaceClass}>
			<div class="flex h-full flex-col gap-5">
				<div class="space-y-3">
					<Badge variant="outline" class={eyebrowBadgeClass}>Overview</Badge>
					<div class="space-y-2">
						<h1 class="text-balance text-3xl font-semibold tracking-tight">Welcome back, {welcomeName}</h1>
						<p class={supportingCopyClass}>
							A compact snapshot of the current project, active threads, and the closest next
							surfaces.
						</p>
					</div>
				</div>

		<div class="grid gap-3 sm:grid-cols-3 items-stretch">
					<div class={cn(metricSurfaceClass, "flex flex-col")}>
						<p class={metricLabelClass}>Project</p>
						<p class="mt-3 truncate text-lg font-semibold">
							{currentProject?.name ?? "Preparing"}
						</p>
						<p class="mt-1 text-xs leading-5 text-muted-foreground">
							{currentProject?.description ?? "Default project is connecting."}
						</p>
					</div>
					<div class={cn(metricSurfaceClass, "flex flex-col")}>
						<p class={metricLabelClass}>Threads</p>
						<p class="mt-3 text-3xl font-semibold tracking-tight">{sessions.length}</p>
						<p class="mt-1 truncate text-xs leading-5 text-muted-foreground">
							{currentSession?.title ?? "Open chat when you are ready."}
						</p>
					</div>
					<div class={cn(metricSurfaceClass, "flex flex-col")}>
						<p class={metricLabelClass}>Status</p>
						<p class="mt-3 text-lg font-semibold capitalize">
							{workspaceStatus.replace("_", " ")}
						</p>
						<p class="mt-1 text-xs leading-5 text-muted-foreground">
							{currentProject ? "Project context is loaded." : "Connection is still warming up."}
						</p>
					</div>
				</div>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			{#each shortcutCards as shortcut}
				<a href={shortcut.href} class={quickTileClass}>
					<div class="flex items-center justify-between gap-3">
						<div class={iconContainerLgClass}>
							<shortcut.icon class="size-5 text-foreground" />
						</div>
						<ArrowRight class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
					</div>
					<div>
						<p class="text-base font-semibold">{shortcut.title}</p>
						<p class="mt-1 truncate text-xs leading-5 text-muted-foreground">{shortcut.value}</p>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<section class="min-h-0 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
		<div class={cn(moduleSurfaceClass, "flex min-h-0 flex-col")}>
			<div class="flex items-center gap-3 pb-3">
				<div class={iconContainerClass}>
					<Clock3 class="size-4" />
				</div>
				<div>
					<p class={sectionTitleClass}>Recent chats</p>
					<p class="text-sm text-muted-foreground">Latest linked threads.</p>
				</div>
			</div>
			<div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
				{#if recentSessions.length > 0}
					{#each recentSessions as session}
						<button type="button" class={listRowClass} onclick={() => openSession(session.id)}>
							<span class="min-w-0">
								<span class="block truncate text-sm font-medium">
									{session.title ?? "Untitled chat"}
								</span>
								<span class="mt-1 block text-xs text-muted-foreground">
									Updated {formatDate(session.updated_at ?? session.created_at)}
								</span>
							</span>
							<ArrowRight class="size-4 shrink-0 text-muted-foreground" />
						</button>
					{/each}
				{:else}
					<div class={surfaceVariants({ tone: "ghost", radius: "block", padding: "md", emphasis: "flat" })}>
						No chat history yet.
					</div>
				{/if}
			</div>
		</div>

		<div class={cn(moduleSurfaceClass, "flex flex-col justify-center")}>
			<div class="flex items-center justify-between gap-4">
				<div>
					<p class="text-sm font-medium">
						{currentSession?.title ?? "No thread selected"}
					</p>
					<p class="mt-1 text-xs leading-5 text-muted-foreground">
						{currentProject?.name ?? "Acheulit"} stays ready in chat.
					</p>
				</div>
				<Button href="/app/chat" variant="outline" class="shrink-0 rounded-full px-4">
					Open chat
				</Button>
			</div>
		</div>
	</section>
</div>
