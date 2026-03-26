<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import AgentPanel from "$lib/components/agent-panel.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { auth } from "$lib/auth";
	import { shellLayoutVariants } from "$lib/design/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { projectStore } from "$lib/stores/project.svelte";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { ChevronLeft, ChevronRight, Search, Sparkles } from "@lucide/svelte";

	let { data, children } = $props();
	let clearingExpiredSession = $state(false);
	const shell = shellLayoutVariants();

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
			case "/app/projects":
				return {
					title: "Library",
					searchPlaceholder: "Search library, folders, assets, and outputs",
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
			default:
				return {
					title: "Acheulit",
					searchPlaceholder: "Search projects, sessions, workflows, and tools",
				};
		}
	}
</script>

<Sidebar.Provider>
	<AppSidebar user={{ name: displayName, email }} />
	<Sidebar.Inset>
		<div class={shell.viewport()}>
			<div class={shell.mainColumn()}>
				<header class={shell.header()}>
					<div class={shell.headerInner()}>
						<div class="flex min-w-0 items-center gap-3">
							<Sidebar.Trigger class="-ms-1" />
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

						<div class="ms-auto flex items-center gap-2">
							<Button
								variant={agentPanelState.isOpen ? "secondary" : "outline"}
								size="sm"
								class={shell.headerButton()}
								onclick={() => agentPanelState.toggle()}
								aria-label="Toggle agent panel"
							>
							<span class="flex size-7 items-center justify-center rounded-full border border-[var(--shell-border-soft)] bg-[var(--surface-elevated)]">
									<Sparkles class="size-3.5" />
								</span>
								<span class="hidden sm:inline">Chat</span>
								{#if agentPanelState.isOpen}
									<ChevronRight class="size-4 text-muted-foreground" />
								{:else}
									<ChevronLeft class="size-4 text-muted-foreground" />
								{/if}
							</Button>
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
