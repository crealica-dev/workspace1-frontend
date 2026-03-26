<script lang="ts">
	import { onMount } from "svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import AgentPanel from "$lib/components/agent-panel.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import { shellLayoutVariants, workspaceStatusTone, type ShellPreviewScenario } from "$lib/design/index.js";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { projectStore } from "$lib/stores/project.svelte";
	import { workspaceSearchStore } from "$lib/stores/workspace-search.svelte";
	import type { ChatSession, Project } from "$lib/api/projects";
	import { cn } from "$lib/utils.js";
	import { ChevronRight, Search, Sparkles } from "@lucide/svelte";
	import OverviewPage from "../../app/+page.svelte";
	import ChatPage from "../../app/chat/+page.svelte";
	import HelpPage from "../../app/help/+page.svelte";
	import LibraryPage from "../../app/library/+page.svelte";
	import StudioPage from "../../app/studio/+page.svelte";
	import WorkflowsPage from "../../app/workflows/+page.svelte";

	let { data } = $props();
	const scenario = $derived.by(() => data.scenario as ShellPreviewScenario);
	const shell = shellLayoutVariants();

	const previewProject: Project = {
		id: "preview-project",
		name: "My Workspace",
		slug: "my-workspace",
		description: "A preview-ready project with seeded shell context.",
		owner_user_id: "preview-user",
		workspace_id: null,
		metadata: {},
		created_at: "2026-03-25T00:00:00Z",
		updated_at: "2026-03-25T00:00:00Z",
	};

	const previewSessions: ChatSession[] = [
		{
			id: "preview-session-1",
			project_id: "preview-project",
			owner_user_id: "preview-user",
			session_type: "chat",
			title: "New Chat",
			status: "active",
			created_at: "2026-03-25T00:00:00Z",
			updated_at: "2026-03-25T00:00:00Z",
		},
		{
			id: "preview-session-2",
			project_id: "preview-project",
			owner_user_id: "preview-user",
			session_type: "chat",
			title: "Campaign kickoff",
			status: "active",
			created_at: "2026-03-24T00:00:00Z",
			updated_at: "2026-03-24T00:00:00Z",
		},
	];

	const statusMeta = $derived(workspaceStatusTone(projectStore.status, projectStore.statusMessage));
	const routeMeta = $derived(getRouteMeta(scenario));

	onMount(() => {
		const previous = {
			currentProject: projectStore.currentProject,
			sessions: projectStore.sessions,
			currentSession: projectStore.currentSession,
			status: projectStore.status,
			statusMessage: projectStore.statusMessage,
			lastError: projectStore.lastError,
			isInitialized: projectStore.isInitialized,
			panelOpen: agentPanelState.isOpen,
			searchQuery: workspaceSearchStore.query,
		};

		projectStore.currentProject = previewProject;
		projectStore.sessions = previewSessions;
		projectStore.currentSession = previewSessions[0];
		projectStore.status = "ready";
		projectStore.statusMessage = "Shell preview data is loaded.";
		projectStore.lastError = null;
		projectStore.isInitialized = true;
		workspaceSearchStore.clear();
		agentPanelState.open();

		return () => {
			projectStore.currentProject = previous.currentProject;
			projectStore.sessions = previous.sessions;
			projectStore.currentSession = previous.currentSession;
			projectStore.status = previous.status;
			projectStore.statusMessage = previous.statusMessage;
			projectStore.lastError = previous.lastError;
			projectStore.isInitialized = previous.isInitialized;
			agentPanelState.isOpen = previous.panelOpen;
			workspaceSearchStore.query = previous.searchQuery;
		};
	});

	function getRouteMeta(currentScenario: ShellPreviewScenario) {
		switch (currentScenario) {
			case "overview":
				return {
					title: "Overview",
					searchPlaceholder: "Search overview, sessions, updates, and tools",
				};
			case "chat":
				return {
					title: "Chat",
					searchPlaceholder: "Search chats, assets, outputs, and tools",
				};
			case "library":
				return {
					title: "Library",
					searchPlaceholder: "Search library, folders, assets, and outputs",
				};
			case "studio":
				return {
					title: "Studio",
					searchPlaceholder: "Search tools, prompts, and services",
				};
			case "workflows":
				return {
					title: "Workflows",
					searchPlaceholder: "Search workflows, sessions, and project tools",
				};
			case "billing":
				return {
					title: "Billing",
					searchPlaceholder: "Search billing, credits, and payment methods",
				};
			case "help":
				return {
					title: "Help",
					searchPlaceholder: "Search guides, FAQs, and tutorials",
				};
		}
	}
</script>

<svelte:head>
	<title>{routeMeta.title} Preview - Acheulit</title>
</svelte:head>

<Sidebar.Provider>
	<AppSidebar user={{ name: "Preview User", email: "preview@acheulit.test" }} />
	<Sidebar.Inset>
		<div class={shell.viewport()} data-testid="shell-preview-root">
			<div class={shell.mainColumn()}>
				<header class={shell.header()}>
					<div class={shell.headerInner()}>
						<div class="flex min-w-0 items-center gap-2">
							<Sidebar.Trigger class="-ms-1" />
							<Separator orientation="vertical" class="me-1 data-[orientation=vertical]:h-4" />
							<div class="min-w-0">
								<Breadcrumb.Root>
									<Breadcrumb.List>
										<Breadcrumb.Item class="hidden sm:block">
											<Breadcrumb.Link href={`/shell-preview/${scenario}`}>Acheulit</Breadcrumb.Link>
										</Breadcrumb.Item>
										<Breadcrumb.Separator class="hidden sm:block" />
										<Breadcrumb.Item>
											<Breadcrumb.Page>{routeMeta.title}</Breadcrumb.Page>
										</Breadcrumb.Item>
									</Breadcrumb.List>
								</Breadcrumb.Root>
								<p class="mt-1 hidden truncate text-xs text-muted-foreground md:block">
									Design preview mode
								</p>
							</div>
						</div>

						<div class="relative hidden min-w-[220px] max-w-sm flex-1 md:block">
							<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								bind:value={workspaceSearchStore.query}
								placeholder={routeMeta.searchPlaceholder}
								class={shell.headerSearch()}
							/>
						</div>

						<div class="ms-auto flex items-center gap-2">
							<Badge
								variant="outline"
								class={cn(
									"hidden rounded-full px-3 py-1 text-[11px] sm:inline-flex",
									statusMeta.badgeClass,
								)}
							>
								{statusMeta.label}
							</Badge>
							<Badge variant="outline" class="hidden rounded-full px-3 py-1 text-[11px] sm:inline-flex">
								Preview
							</Badge>
							<Badge variant="outline" class="inline-flex rounded-full px-3 py-1 text-[11px]">
								<Sparkles class="size-3.5" />
								<ChevronRight class="size-3.5" />
							</Badge>
						</div>
					</div>
				</header>

				<div class={shell.content()}>
					<div class={shell.routeViewport()}>
						<div class={shell.routeFrame()}>
							{#if scenario === "overview"}
								<OverviewPage data={{ email: "preview@acheulit.test" }} />
							{:else if scenario === "chat"}
								<ChatPage />
							{:else if scenario === "library"}
								<LibraryPage />
							{:else if scenario === "studio"}
								<StudioPage />
							{:else if scenario === "help"}
								<HelpPage />
							{:else}
								<WorkflowsPage />
							{/if}
						</div>
					</div>
				</div>
			</div>

			<AgentPanel />
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
