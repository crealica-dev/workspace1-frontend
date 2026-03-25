<script lang="ts">
	import type { WorkspaceConnectionStatus } from "$lib/api/projects";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { auth } from "$lib/auth";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { projectStore } from "$lib/stores/project.svelte";
	import {
		Activity,
		Bot,
		Clock,
		FolderKanban,
		MessageSquare,
		MessagesSquare,
		Plus,
		RefreshCw,
		ServerCrash,
		ShieldAlert,
		Sparkles,
		WifiOff,
	} from "@lucide/svelte";

	let reconnecting = $state(false);

	async function handleReconnect() {
		const token = auth.getSessionSnapshot()?.access_token;
		if (!token || reconnecting) return;

		reconnecting = true;
		try {
			await projectStore.reconnect(token);
		} finally {
			reconnecting = false;
		}
	}

	let { data } = $props();

	const welcomeName = $derived(formatDisplayName(data.email ?? ""));
	const currentProject = $derived(projectStore.currentProject);
	const sessionCount = $derived(projectStore.sessions.length);
	const recentSessions = $derived(projectStore.sessions.slice(0, 5));
	const workspaceStatus = $derived(projectStore.status);
	const statusMessage = $derived(projectStore.statusMessage);
	const statusMeta = $derived(getStatusMeta(workspaceStatus, statusMessage));

	function formatDisplayName(value: string) {
		const [rawName] = value.split("@");
		const normalized = rawName.replace(/[._-]+/g, " ").trim();
		if (!normalized) return "there";
		return normalized
			.split(/\s+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}

	function formatDate(iso: string | null): string {
		if (!iso) return "";
		const date = new Date(iso);
		const diffHours = (Date.now() - date.getTime()) / 3_600_000;
		if (diffHours < 1) return "just now";
		if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	}

	function getStatusMeta(status: WorkspaceConnectionStatus, message: string) {
		switch (status) {
			case "ready":
				return {
					label: "Connected",
					title: "Backend connected",
					description: message || "Projects, sessions, and the chat agent are ready.",
					badgeClass:
						"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
					panelClass:
						"border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/25",
					iconClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
				};
			case "checking":
				return {
					label: "Syncing",
					title: "Preparing your workspace",
					description: message || "Checking the API and loading project data.",
					badgeClass:
						"border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
					panelClass:
						"border-sky-200/80 bg-sky-50/80 dark:border-sky-900 dark:bg-sky-950/25",
					iconClass: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
				};
			case "auth_error":
				return {
					label: "Auth issue",
					title: "Authentication issue",
					description: message || "The API rejected this sign-in session.",
					badgeClass:
						"border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
					panelClass:
						"border-amber-200/80 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/25",
					iconClass:
						"bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
				};
			case "backend_down":
				return {
					label: "Backend down",
					title: "Backend unavailable",
					description: message || "The app cannot reach the API right now.",
					badgeClass:
						"border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
					panelClass:
						"border-rose-200/80 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/25",
					iconClass: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
				};
			default:
				return {
					label: "Sync failed",
					title: "Workspace sync failed",
					description:
						message || "The backend is reachable, but the workspace could not be loaded.",
					badgeClass:
						"border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
					panelClass:
						"border-orange-200/80 bg-orange-50/80 dark:border-orange-900 dark:bg-orange-950/25",
					iconClass:
						"bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
				};
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Workspace</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<section class="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_340px]">
		<Card.Root class="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/35 shadow-sm">
			<Card.Content class="flex h-full flex-col gap-6 p-6 sm:p-7">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div class="space-y-3">
						<Badge
							variant="outline"
							class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
						>
							Workspace overview
						</Badge>
						<div class="space-y-2">
							<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
								Welcome back, {welcomeName}
							</h1>
							<p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
								Manage projects, session history, and AI workflows from one calmer shell.
								The main canvas is tuned for quick reads, fast actions, and cleaner handoff
								into chat.
							</p>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<Button class="gap-2 rounded-full px-4" onclick={() => agentPanelState.open()}>
							<Sparkles class="size-4" />
							Open Agent
						</Button>
						<Button
							variant="outline"
							class="gap-2 rounded-full px-4"
							href="/app/projects"
						>
							<FolderKanban class="size-4" />
							Manage Projects
						</Button>
					</div>
				</div>

				<div class="grid gap-3 md:grid-cols-3">
					<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Project
						</p>
						<p class="mt-3 truncate text-lg font-semibold">
							{currentProject?.name ?? "Initializing workspace"}
						</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">
							{currentProject?.description ??
								"Your default project is loaded automatically when the workspace is ready."}
						</p>
					</div>
					<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Sessions
						</p>
						<p class="mt-3 text-3xl font-semibold tracking-tight">{sessionCount}</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">
							{sessionCount === 1
								? "One conversation is ready to reopen."
								: "Your latest chats stay grouped under the active project."}
						</p>
					</div>
					<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							AI capabilities
						</p>
						<p class="mt-3 text-3xl font-semibold tracking-tight">6</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">
							Text, image, and audio services are available behind the same shell.
						</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex flex-col gap-4">
			<Card.Root class="border-border/70 shadow-sm">
				<Card.Content class="p-5">
					<div class="rounded-2xl border px-4 py-4 {statusMeta.panelClass}">
						<div class="flex items-start gap-3">
							<div class="mt-0.5 flex size-10 items-center justify-center rounded-full {statusMeta.iconClass}">
								{#if workspaceStatus === "auth_error"}
									<ShieldAlert class="size-4" />
								{:else if workspaceStatus === "backend_down"}
									<ServerCrash class="size-4" />
								{:else if workspaceStatus === "checking"}
									<RefreshCw class="size-4 {reconnecting ? 'animate-spin' : ''}" />
								{:else if workspaceStatus === "ready"}
									<Activity class="size-4" />
								{:else}
									<WifiOff class="size-4" />
								{/if}
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<p class="text-sm font-semibold">{statusMeta.title}</p>
									<Badge variant="outline" class={statusMeta.badgeClass}>
										{statusMeta.label}
									</Badge>
								</div>
								<p class="mt-2 text-sm leading-6 text-muted-foreground">
									{statusMeta.description}
								</p>
							</div>
						</div>

						{#if workspaceStatus !== "ready"}
							<div class="mt-4 flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									class="rounded-xl"
									onclick={handleReconnect}
									disabled={reconnecting}
								>
									<RefreshCw class="size-3.5 {reconnecting ? 'animate-spin' : ''}" />
									{reconnecting ? "Retrying..." : "Retry connection"}
								</Button>
								{#if workspaceStatus === "auth_error"}
									<Button variant="ghost" size="sm" class="rounded-xl" href="/">
										Return to sign in
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-border/70 shadow-sm">
				<Card.Header class="pb-3">
					<Card.Title>Quick actions</Card.Title>
					<Card.Description>Jump into the next task without leaving the main canvas.</Card.Description>
				</Card.Header>
				<Card.Content class="grid gap-2">
					<Button class="justify-start gap-2 rounded-xl" onclick={() => agentPanelState.open()}>
						<Sparkles class="size-4" />
						Chat with Workspace Agent
					</Button>
					<Button variant="outline" class="justify-start gap-2 rounded-xl" href="/app/studio">
						<Activity class="size-4" />
						Open Studio
					</Button>
					<Button
						variant="outline"
						class="justify-start gap-2 rounded-xl"
						href="/app/projects"
					>
						<FolderKanban class="size-4" />
						Manage Projects
					</Button>
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<section class="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.95fr)]">
		<Card.Root class="border-border/70 shadow-sm">
			<Card.Header class="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="space-y-1">
					<Card.Title>Recent sessions</Card.Title>
					<Card.Description>Your latest project conversations stay one click away.</Card.Description>
				</div>
				<Button
					variant="outline"
					size="sm"
					class="gap-1.5 rounded-xl"
					onclick={() => agentPanelState.open()}
				>
					<Plus class="size-3.5" />
					{workspaceStatus === "ready" ? "New chat" : "Open agent"}
				</Button>
			</Card.Header>
			<Card.Content class="p-5">
				{#if recentSessions.length === 0}
					<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
						<div class="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
							<Bot class="size-5 text-primary" />
						</div>
						<h2 class="mt-4 text-lg font-semibold tracking-tight">No sessions yet</h2>
						<p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
							Open the agent to start a project-aware conversation, create the first chat
							session, and let this area fill with recent work.
						</p>
						<div class="mt-5 flex flex-wrap justify-center gap-2">
							<Button class="gap-2 rounded-full px-4" onclick={() => agentPanelState.open()}>
								<Sparkles class="size-4" />
								Open Agent
							</Button>
							<Button
								variant="outline"
								class="gap-2 rounded-full px-4"
								href="/app/projects"
							>
								<FolderKanban class="size-4" />
								Manage Projects
							</Button>
						</div>
					</div>
				{:else}
					<div class="space-y-3">
						{#each recentSessions as session (session.id)}
							<button
								class="group flex w-full items-center gap-4 rounded-2xl border border-border/70 bg-background px-4 py-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-primary/35 hover:bg-muted/40"
								onclick={() => {
									projectStore.currentSession = session;
									agentPanelState.open();
								}}
							>
								<div class="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<MessagesSquare class="size-4" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold">
										{session.title ?? "Untitled"}
									</p>
									<p class="mt-1 text-xs leading-5 text-muted-foreground">
										Open this session in the agent panel and continue where you left off.
									</p>
								</div>
								<div class="flex items-center gap-1 text-xs text-muted-foreground">
									<Clock class="size-3.5" />
									<span>{formatDate(session.created_at)}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border/70 shadow-sm">
			<Card.Header>
				<Card.Title>Main area notes</Card.Title>
				<Card.Description>
					A compact read on what this shell is optimizing for right now.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Current focus
					</p>
					<p class="mt-2 text-sm font-medium leading-6">
						{currentProject?.name ?? "Preparing your default workspace project"}
					</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						The shell keeps navigation light so the center canvas can stay focused on work.
					</p>
				</div>

				<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Chat readiness
					</p>
					<p class="mt-2 text-sm font-medium leading-6">{statusMeta.title}</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">{statusMeta.description}</p>
				</div>

				<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Next best action
					</p>
					<p class="mt-2 text-sm font-medium leading-6">
						{workspaceStatus === "ready"
							? "Open the agent and continue the latest conversation."
							: "Retry the workspace connection, then open the agent again."}
					</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						Once the workspace is healthy, the recent sessions list becomes the quickest path
						back into project context.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</section>
</div>
