<script lang="ts">
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge/index.js";
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
		Zap,
		TrendingUp,
		LayoutGrid,
	} from "@lucide/svelte";

	let { data } = $props();

	const welcomeName = $derived(formatDisplayName(data.email ?? ""));
	const currentProject = $derived(projectStore.currentProject);
	const sessions = $derived(projectStore.sessions);
	const currentSession = $derived(projectStore.currentSession);
	const workspaceStatus = $derived(projectStore.status);
	const recentSessions = $derived(sessions.slice(0, 3));

	const statusColor = $derived.by(() => {
		switch (workspaceStatus) {
			case "ready": return "bg-emerald-500";
			case "checking": return "bg-amber-400 animate-pulse";
			case "auth_error": return "bg-rose-500";
			case "backend_down": return "bg-rose-500";
			default: return "bg-muted-foreground/40";
		}
	});

	const statusText = $derived.by(() => {
		switch (workspaceStatus) {
			case "ready": return "Ready";
			case "checking": return "Connecting…";
			case "auth_error": return "Auth issue";
			case "backend_down": return "Offline";
			default: return "Idle";
		}
	});

	const heroBanner = surfaceVariants({
		tone: "accent",
		radius: "panel",
		padding: "lg",
		emphasis: "soft",
	});

	const cardClass = cn(
		interactiveItemVariants({ tone: "card", density: "spacious" }),
		"group flex h-full flex-col gap-4",
	);

	const moduleCardClass = surfaceVariants({
		tone: "panel",
		radius: "panel",
		padding: "md",
		emphasis: "soft",
	});

	const statPillClass = surfaceVariants({
		tone: "elevated",
		radius: "block",
		padding: "sm",
		emphasis: "flat",
	});

	const listRowClass = cn(
		interactiveItemVariants({ tone: "row", density: "regular" }),
		"flex items-center justify-between gap-4",
	);

	const shortcutCards = $derived.by(() => [
		{
			title: "Chat",
			href: "/app/chat",
			icon: MessageSquare,
			subtitle: currentSession?.title ?? "Start a conversation",
			accent: "bg-primary/10 text-primary",
		},
		{
			title: "Library",
			href: "/app/projects",
			icon: FolderKanban,
			subtitle: "Manage assets and files",
			accent: "bg-chart-2/10 text-chart-2",
		},
		{
			title: "Studio",
			href: "/app/studio",
			icon: Sparkles,
			subtitle: "AI tools and prompts",
			accent: "bg-chart-3/10 text-chart-3",
		},
		{
			title: "Workflows",
			href: "/app/workflows",
			icon: Workflow,
			subtitle: "Automation recipes",
			accent: "bg-chart-4/10 text-chart-4",
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
		if (!iso) return "";
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return "";
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	}

	function getTimeAgo(iso: string | null | undefined) {
		if (!iso) return "just now";
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return "just now";
		const diff = Date.now() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return "just now";
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
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

<div class="flex h-full min-h-0 flex-col gap-5 overflow-hidden">
	<!-- Hero banner -->
	<section class={cn(heroBanner, "relative overflow-hidden")}>
		<div class="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-chart-3/[0.04]"></div>
		<div class="relative space-y-2">
			<div class="flex items-center gap-3">
				<Badge variant="outline" class={eyebrowBadgeClass}>Overview</Badge>
				<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span class={cn("size-2 rounded-full", statusColor)}></span>
					{statusText}
				</span>
			</div>
			<h1 class="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
				Welcome back, {welcomeName}
			</h1>
			<p class={supportingCopyClass}>
				{currentProject?.name
					? `Working on ${currentProject.name}. Pick up where you left off or start something new.`
					: "Your project is warming up. Switch to Chat to get started."}
			</p>
		</div>
	</section>

	<!-- Stats row -->
	<section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class={cn(statPillClass, "flex items-center gap-3")}>
			<div class="flex size-9 items-center justify-center rounded-xl bg-primary/10">
				<Zap class="size-4 text-primary" />
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium text-muted-foreground">Status</p>
				<p class="truncate text-sm font-semibold capitalize">{statusText}</p>
			</div>
		</div>
		<div class={cn(statPillClass, "flex items-center gap-3")}>
			<div class="flex size-9 items-center justify-center rounded-xl bg-chart-2/10">
				<MessageSquare class="size-4 text-chart-2" />
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium text-muted-foreground">Threads</p>
				<p class="truncate text-sm font-semibold">{sessions.length}</p>
			</div>
		</div>
		<div class={cn(statPillClass, "flex items-center gap-3")}>
			<div class="flex size-9 items-center justify-center rounded-xl bg-chart-3/10">
				<LayoutGrid class="size-4 text-chart-3" />
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium text-muted-foreground">Project</p>
				<p class="truncate text-sm font-semibold">{currentProject?.name ?? "—"}</p>
			</div>
		</div>
		<div class={cn(statPillClass, "flex items-center gap-3")}>
			<div class="flex size-9 items-center justify-center rounded-xl bg-chart-4/10">
				<TrendingUp class="size-4 text-chart-4" />
			</div>
			<div class="min-w-0">
				<p class="text-xs font-medium text-muted-foreground">Activity</p>
				<p class="truncate text-sm font-semibold">
					{currentSession ? getTimeAgo(currentSession.updated_at ?? currentSession.created_at) : "—"}
				</p>
			</div>
		</div>
	</section>

	<!-- Shortcut cards -->
	<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		{#each shortcutCards as shortcut}
			<a href={shortcut.href} class={cardClass}>
				<div class="flex items-center justify-between">
					<div class={cn("flex size-10 items-center justify-center rounded-xl", shortcut.accent)}>
						<shortcut.icon class="size-5" />
					</div>
					<ArrowRight class="size-4 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
				</div>
				<div>
					<p class="text-sm font-semibold">{shortcut.title}</p>
					<p class="mt-0.5 truncate text-xs text-muted-foreground">{shortcut.subtitle}</p>
				</div>
			</a>
		{/each}
	</section>

	<!-- Bottom row: recent chats + quick action -->
	<section class="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
		<!-- Recent chats -->
		<div class={cn(moduleCardClass, "flex min-h-0 flex-col")}>
			<div class="flex items-center gap-3 pb-4">
				<div class={iconContainerClass}>
					<Clock3 class="size-4" />
				</div>
				<div>
					<p class={sectionTitleClass}>Recent chats</p>
					<p class="text-sm text-muted-foreground">Pick up a recent thread.</p>
				</div>
			</div>
			<div class="min-h-0 flex-1 space-y-2 overflow-y-auto">
				{#if recentSessions.length > 0}
					{#each recentSessions as session}
						<button type="button" class={listRowClass} onclick={() => openSession(session.id)}>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-medium">
									{session.title ?? "Untitled chat"}
								</span>
								<span class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
									<span>{getTimeAgo(session.updated_at ?? session.created_at)}</span>
									{#if session.updated_at || session.created_at}
										<span class="text-border">·</span>
										<span>{formatDate(session.updated_at ?? session.created_at)}</span>
									{/if}
								</span>
							</span>
							<ArrowRight class="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
						</button>
					{/each}
				{:else}
					<div class="flex flex-col items-center justify-center gap-3 py-8 text-center">
						<div class="flex size-12 items-center justify-center rounded-2xl bg-primary/8">
							<MessageSquare class="size-5 text-primary/60" />
						</div>
						<div>
							<p class="text-sm font-medium text-muted-foreground">No chats yet</p>
							<p class="mt-0.5 text-xs text-muted-foreground/70">Start your first conversation to see it here.</p>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Quick start card -->
		<div class={cn(moduleCardClass, "flex flex-col gap-4")}>
			<div class="flex items-center gap-3">
				<div class={iconContainerClass}>
					<Sparkles class="size-4" />
				</div>
				<div>
					<p class={sectionTitleClass}>Quick start</p>
					<p class="text-sm text-muted-foreground">Jump into a task.</p>
				</div>
			</div>
			<div class="flex flex-1 flex-col gap-2">
				<button
					type="button"
					class={cn(listRowClass, "text-left")}
					onclick={() => goto("/app/chat")}
				>
					<span class="flex items-center gap-2.5">
						<span class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
							<MessageSquare class="size-3.5 text-primary" />
						</span>
						<span class="text-sm">New conversation</span>
					</span>
					<ArrowRight class="size-3.5 text-muted-foreground/40" />
				</button>
				<button
					type="button"
					class={cn(listRowClass, "text-left")}
					onclick={() => goto("/app/studio")}
				>
					<span class="flex items-center gap-2.5">
						<span class="flex size-7 items-center justify-center rounded-lg bg-chart-3/10">
							<Sparkles class="size-3.5 text-chart-3" />
						</span>
						<span class="text-sm">Explore tools</span>
					</span>
					<ArrowRight class="size-3.5 text-muted-foreground/40" />
				</button>
				<button
					type="button"
					class={cn(listRowClass, "text-left")}
					onclick={() => goto("/app/workflows")}
				>
					<span class="flex items-center gap-2.5">
						<span class="flex size-7 items-center justify-center rounded-lg bg-chart-4/10">
							<Workflow class="size-3.5 text-chart-4" />
						</span>
						<span class="text-sm">Browse workflows</span>
					</span>
					<ArrowRight class="size-3.5 text-muted-foreground/40" />
				</button>
			</div>
			{#if currentProject}
				<div class="mt-auto rounded-xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)] px-4 py-3">
					<p class="text-xs font-medium text-muted-foreground">Active project</p>
					<p class="mt-0.5 truncate text-sm font-semibold">{currentProject.name}</p>
					{#if currentProject.description}
						<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{currentProject.description}</p>
					{/if}
				</div>
			{/if}
		</div>
	</section>
</div>
