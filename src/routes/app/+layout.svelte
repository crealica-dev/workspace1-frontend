<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import AgentPanel from "$lib/components/agent-panel.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { auth } from "$lib/auth";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { projectStore } from "$lib/stores/project.svelte";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { workspaceSearchStore } from "$lib/stores/workspace-search.svelte";
	import { Search, Sparkles } from "@lucide/svelte";
	import type { WorkspaceConnectionStatus } from "$lib/api/projects";

	let { data, children } = $props();
	let clearingExpiredSession = $state(false);

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
	const workspaceStatus = $derived(projectStore.status);
	const isProjectLibraryRoute = $derived(page.url.pathname === "/app/projects");
	const searchPlaceholder = $derived(
		isProjectLibraryRoute
			? "Search library, folders, and assets"
			: "Search projects, sessions, and tools",
	);

	$effect(() => {
		if (!isProjectLibraryRoute && workspaceSearchStore.query) {
			workspaceSearchStore.clear();
		}
	});

	function formatDisplayName(value: string) {
		const [rawName] = value.split("@");
		const normalized = rawName.replace(/[._-]+/g, " ").trim();
		if (!normalized) return "User";
		return normalized
			.split(/\s+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}

	function getStatusMeta(status: WorkspaceConnectionStatus) {
		switch (status) {
			case "ready":
				return {
					label: "Connected",
					className:
						"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
				};
			case "checking":
				return {
					label: "Syncing",
					className:
						"border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
				};
			case "auth_error":
				return {
					label: "Auth issue",
					className:
						"border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
				};
			case "backend_down":
				return {
					label: "Backend down",
					className:
						"border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
				};
			default:
				return {
					label: "Sync failed",
					className:
						"border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
				};
		}
	}

	const statusMeta = $derived(getStatusMeta(workspaceStatus));
</script>

<Sidebar.Provider>
	<AppSidebar user={{ name: displayName, email }} />
	<Sidebar.Inset>
		<header class="border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
			<div class="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:h-[4.25rem] sm:px-6">
				<div class="flex min-w-0 items-center gap-2">
					<Sidebar.Trigger class="-ms-1" />
					<Separator orientation="vertical" class="me-1 data-[orientation=vertical]:h-4" />
					<div class="min-w-0">
						<Breadcrumb.Root>
							<Breadcrumb.List>
								<Breadcrumb.Item class="hidden sm:block">
									<Breadcrumb.Link href="/app">Workspace</Breadcrumb.Link>
								</Breadcrumb.Item>
								<Breadcrumb.Separator class="hidden sm:block" />
								<Breadcrumb.Item>
									<Breadcrumb.Page>
										{currentProject?.name ?? "Authenticated shell"}
									</Breadcrumb.Page>
								</Breadcrumb.Item>
							</Breadcrumb.List>
						</Breadcrumb.Root>
						<p class="text-muted-foreground mt-1 hidden truncate text-xs md:block">
							{projectStore.statusMessage}
						</p>
					</div>
				</div>

				<div class="relative hidden min-w-[220px] max-w-sm flex-1 md:block">
					<Search
						class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
					/>
					<Input
						type="search"
						bind:value={workspaceSearchStore.query}
						placeholder={searchPlaceholder}
						class="h-10 rounded-full border-border/70 bg-muted/40 pl-10 shadow-sm"
					/>
				</div>

				<div class="ms-auto flex items-center gap-2">
					<Badge variant="outline" class="hidden rounded-full px-3 py-1 text-[11px] sm:inline-flex {statusMeta.className}">
						{statusMeta.label}
					</Badge>
					<Button
						variant={agentPanelState.isOpen ? "secondary" : "outline"}
						size="sm"
						class="gap-2 rounded-full px-3.5"
						onclick={() => agentPanelState.toggle()}
						aria-label="Toggle agent panel"
					>
						<Sparkles class="size-4" />
						<span class="hidden sm:inline">
							{agentPanelState.isOpen ? "Hide Agent" : "Open Agent"}
						</span>
					</Button>
				</div>
			</div>
		</header>

		<div class="flex flex-1 flex-col">
			<div class="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-10 pt-6 sm:px-6">
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<AgentPanel />
