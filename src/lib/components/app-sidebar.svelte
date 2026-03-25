<script lang="ts" module>
	import ClapperboardIcon from "@lucide/svelte/icons/clapperboard";
	import FolderKanbanIcon from "@lucide/svelte/icons/folder-kanban";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import WorkflowIcon from "@lucide/svelte/icons/workflow";

	const data = {
		navMain: [
			{
				title: "Overview",
				url: "/app",
				icon: LayoutDashboardIcon,
			},
			{
				title: "Projects",
				url: "/app/projects",
				icon: FolderKanbanIcon,
			},
			{
				title: "Studio",
				url: "/app/studio",
				icon: ClapperboardIcon,
			},
			{
				title: "Workflows",
				url: "/app/workflows",
				icon: WorkflowIcon,
			},
		],
	};
</script>

<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { projectStore } from "$lib/stores/project.svelte";
	import type { WorkspaceConnectionStatus } from "$lib/api/projects";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		user,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user: { name: string; email: string };
	} = $props();

	const currentProject = $derived(projectStore.currentProject);
	const workspaceStatus = $derived(projectStore.status);

	function getStatusMeta(status: WorkspaceConnectionStatus) {
		switch (status) {
			case "ready":
				return {
					label: "Connected",
					className:
						"text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40",
				};
			case "checking":
				return {
					label: "Syncing",
					className:
						"text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40",
				};
			case "auth_error":
				return {
					label: "Auth issue",
					className:
						"text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40",
				};
			case "backend_down":
				return {
					label: "Backend down",
					className:
						"text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40",
				};
			default:
				return {
					label: "Sync failed",
					className:
						"text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40",
				};
		}
	}

	const statusMeta = $derived(getStatusMeta(workspaceStatus));
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header class="gap-3 px-2 py-3">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="rounded-xl px-3 py-2.5">
					<div
						class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-9 items-center justify-center rounded-2xl text-sm font-semibold shadow-sm"
					>
						W
					</div>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-semibold">Workspace</span>
						<span class="truncate text-xs text-sidebar-foreground/65">Studio shell</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<div class="group-data-[collapsible=icon]:hidden px-2">
			<div class="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/30 p-3">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55">
							Workspace Agent
						</p>
						<p class="mt-1 text-sm font-medium leading-5">
							Keep chat, projects, and AI workflows moving together.
						</p>
					</div>
					<Badge
						variant="outline"
						class="shrink-0 rounded-full px-2 py-0.5 text-[10px] {statusMeta.className}"
					>
						{statusMeta.label}
					</Badge>
				</div>
				<p class="mt-3 text-xs leading-5 text-sidebar-foreground/70">
					{currentProject
						? `Current project: ${currentProject.name}`
						: "Open the agent from anywhere in the shell to start a workspace conversation."}
				</p>
				<Button
					variant="secondary"
					size="sm"
					class="mt-3 w-full justify-center gap-2 rounded-xl"
					onclick={() => agentPanelState.open()}
				>
					<SparklesIcon class="size-3.5" />
					Open Agent
				</Button>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="px-2 pb-2">
		<NavMain items={data.navMain} />
	</Sidebar.Content>

	<Sidebar.Footer class="px-2 pb-3 pt-2">
		<NavUser {user} />
	</Sidebar.Footer>

	<Sidebar.Rail />
</Sidebar.Root>
