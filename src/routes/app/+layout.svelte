<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import AgentPanel from "$lib/components/agent-panel.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import WelcomeModal from "$lib/components/welcome-modal.svelte";
	import { auth } from "$lib/auth";
	import { shellLayoutVariants } from "$lib/design/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { projectStore } from "$lib/stores/project.svelte";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { sidebarStatusBadgeClass, workspaceStatusTone } from "$lib/design/index.js";
	import { Bot, Search } from "@lucide/svelte";

	let { data, children } = $props();
	let clearingExpiredSession = $state(false);
	const shell = shellLayoutVariants();
	let sidebarOpen = $state(true);
	let usageWarning = $state(true);
	// TODO: set to true for first-run users
	let showWelcome = $state(false);

	$effect(() => {
		return auth.session.subscribe((session) => {
			if (!session) {
				projectStore.reset();
				agentPanelState.close();
				void goto("/");
				return;
			}

			if (session.access_token && (!projectStore.isInitialized || projectStore.status === 'idle')) {
				projectStore.init(session.access_token);
			}
		});
	});

	$effect(() => {
		if (projectStore.status !== "auth_error" || clearingExpiredSession) return;
		if (!auth.getSessionSnapshot()) return;

		clearingExpiredSession = true;
		void auth
			.clearExpiredSession("Your session expired. Sign in again.")
			.finally(() => {
				clearingExpiredSession = false;
			});
	});

	const email = $derived(data.email ?? "authenticated user");
	const statusMeta = $derived(workspaceStatusTone(projectStore.status, projectStore.statusMessage));
	const displayName = $derived(formatDisplayName(email));
	const currentProject = $derived(projectStore.currentProject);
	const routeMeta = $derived(getRouteMeta(page.url.pathname));
	const headerContext = $derived(
		currentProject?.name ? `Inside ${currentProject.name}` : projectStore.statusMessage,
	);

	function formatDisplayName(value: string) {
		const [rawName] = value.split("@");
		const normalized = rawName.replace(/[._-]+/g, " ").trim();
		if (!normalized) return "User";
		return normalized
			.split(/\s+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}

	function getRouteMeta(pathname: string) {
		switch (pathname) {
			case "/app":
				return {
					title: "Overview",
					searchPlaceholder: "Search overview, sessions, updates, and tools",
				};
			case "/app/chat":
				return {
					title: "Chat",
					searchPlaceholder: "Search chats, assets, outputs, and tools",
				};
			case "/app/library":
				return {
					title: "Library",
					searchPlaceholder: "Search library, folders, assets, and outputs",
				};
			case "/app/projects":
				return {
					title: "Projects",
					searchPlaceholder: "Search your projects",
				};
			case "/app/studio":
				return {
					title: "Studio",
					searchPlaceholder: "Search tools, prompts, and services",
				};
			case "/app/workflows":
				return {
					title: "Workflows",
					searchPlaceholder: "Search workflows, sessions, and project tools",
				};
			case "/app/billing":
				return {
					title: "Billing",
					searchPlaceholder: "Search billing, credits, and payment methods",
				};
			default:
				return {
					title: "Acheulit",
					searchPlaceholder: "Search projects, sessions, workflows, and tools",
				};
		}
	}
</script>

<Sidebar.Provider bind:open={sidebarOpen}>
	<AppSidebar collapsible="offcanvas" user={{ name: displayName, email }} />
	<Sidebar.Inset>
		{#if usageWarning}
			<div class="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
				<span>You're approaching your monthly credit limit (340/1,000). <a href="/app/billing" class="font-semibold underline">Top up credits →</a></span>
				<button onclick={() => usageWarning = false} class="shrink-0 text-amber-700 hover:text-amber-900 dark:text-amber-300">✕</button>
			</div>
		{/if}
		<div class={shell.viewport()}>
			<div class={shell.mainColumn()}>
				<header class={shell.header()}>
					<div class="flex h-[var(--shell-header-height)] w-full items-center sm:h-[var(--shell-header-height-sm)]">

						<!-- Sidebar toggle — anchored at top-left -->
						<div class="flex shrink-0 items-center px-2 sm:px-3">
							<button
								type="button"
								class="panel-toggle group relative flex h-10 items-center rounded-full border border-border/80 transition-[background-color,box-shadow,padding,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 {sidebarOpen ? 'flex-row-reverse bg-primary pr-2.5 pl-1 text-primary-foreground shadow-md' : 'bg-[var(--surface-elevated)] pl-1 pr-3 hover:border-border hover:shadow-sm'}"
								onclick={() => (sidebarOpen = !sidebarOpen)}
								aria-label="Toggle sidebar"
								aria-pressed={sidebarOpen}
							>
								<span
									class="flex size-8 items-center justify-center rounded-full transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {sidebarOpen ? 'bg-primary-foreground/20 scale-105' : 'bg-primary/10'}"
								>
									<img src="/brand/acheulit-logo.png" alt="" class="size-5 rounded-full object-contain transition-[filter] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {sidebarOpen ? 'brightness-0 invert' : ''}" />
								</span>
								<span class="mx-1 text-sm font-semibold tracking-tight transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
									{sidebarOpen ? 'Close' : 'Menu'}
								</span>
							</button>
						</div>

						<!-- Center: title + search + badge -->
						<div class="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-4">
							<div class="flex min-w-0 items-center gap-3">
								<div class="min-w-0">
									<p class="text-sm font-semibold leading-none tracking-tight">{routeMeta.title}</p>
									<p class="text-muted-foreground mt-1 hidden truncate text-xs md:block">
										{headerContext}
									</p>
								</div>
							</div>

							<div class="relative hidden min-w-[220px] max-w-sm flex-1 md:block">
								<Search
									class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
								/>
								<Input
									type="search"
									placeholder={routeMeta.searchPlaceholder}
									class={shell.headerSearch()}
								/>
							</div>

							{#if currentProject}
								<div class="hidden shrink-0 items-center gap-2 md:flex">
									<Badge
										variant="outline"
										class="{sidebarStatusBadgeClass} {statusMeta.badgeClass}"
									>
										{statusMeta.label}
									</Badge>
									<span class="text-foreground/80 max-w-[140px] truncate text-xs font-medium">{currentProject.name}</span>
								</div>
							{/if}
						</div>

						<!-- Agent panel toggle — anchored at top-right -->
						<div class="flex shrink-0 items-center px-2 sm:px-3">
							<button
								type="button"
								class="panel-toggle group relative flex h-10 items-center rounded-full border border-border/80 transition-[background-color,box-shadow,padding,border-color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 {agentPanelState.isOpen ? 'flex-row-reverse bg-primary pr-2.5 pl-1 text-primary-foreground shadow-md' : 'bg-[var(--surface-elevated)] pl-1 pr-3 hover:border-border hover:shadow-sm'}"
								onclick={() => agentPanelState.toggle()}
								aria-label="Toggle agent panel"
								aria-pressed={agentPanelState.isOpen}
							>
								<span
									class="flex size-8 items-center justify-center rounded-full transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {agentPanelState.isOpen ? 'bg-primary-foreground/20 scale-105' : 'bg-primary/10'}"
								>
									<Bot class="size-4 transition-[color,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {agentPanelState.isOpen ? 'text-primary-foreground' : 'text-primary'}" />
								</span>
								<span class="mx-1 text-sm font-semibold tracking-tight transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
									{agentPanelState.isOpen ? "Close" : "Chat"}
								</span>
								{#if !agentPanelState.isOpen}
									<span class="absolute -top-1 -right-1 flex size-3">
										<span class="absolute inline-flex size-full animate-ping rounded-full bg-primary/40"></span>
										<span class="relative inline-flex size-3 rounded-full bg-primary"></span>
									</span>
								{/if}
							</button>
						</div>

					</div>
				</header>

				<div class={shell.content()}>
					<div class={shell.routeViewport()}>
						<div class={shell.routeFrame()}>
							{@render children()}
						</div>
					</div>
				</div>
			</div>
			<AgentPanel />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<WelcomeModal open={showWelcome} onAccept={() => showWelcome = false} />
