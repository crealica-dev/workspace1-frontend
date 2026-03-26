<script lang="ts" module>
	import ClapperboardIcon from "@lucide/svelte/icons/clapperboard";
	import FolderKanbanIcon from "@lucide/svelte/icons/folder-kanban";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import WorkflowIcon from "@lucide/svelte/icons/workflow";

	const data = {
		navMain: [
			{
				title: "Overview",
				url: "/app",
				icon: LayoutDashboardIcon,
			},
			{
				title: "Chat",
				url: "/app/chat",
				icon: MessageSquareIcon,
			},
			{
				title: "Library",
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
	import {
		sidebarActionButtonClass,
		sidebarBrandCollapsedButtonClass,
		sidebarBrandCollapsedLogoClass,
		sidebarBrandExpandedClass,
		sidebarBrandLogoClass,
		sidebarBrandMetaClass,
		sidebarBrandTaglineClass,
		sidebarBrandTitleClass,
		sidebarStatusBadgeClass,
		sidebarSupportCardClass,
		sidebarSupportCopyClass,
		workspaceStatusTone,
	} from "$lib/design/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { projectStore } from "$lib/stores/project.svelte";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import type { ComponentProps } from "svelte";
	import { cn } from "$lib/utils.js";

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
	const statusMeta = $derived(
		workspaceStatusTone(workspaceStatus, projectStore.statusMessage),
	);
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header class="gap-4 px-2 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
		<a
			href="/app"
			class={cn(sidebarBrandExpandedClass, "group-data-[collapsible=icon]:hidden")}
		>
			<img
				src="/brand/acheulit-logo.png"
				alt="Acheulit logo"
				class={sidebarBrandLogoClass}
			/>
			<div class={sidebarBrandMetaClass}>
				<span class={sidebarBrandTitleClass}>Acheulit</span>
				<span class={sidebarBrandTaglineClass}>
					Content workflow platform
				</span>
			</div>
		</a>

		<Sidebar.Menu class="hidden group-data-[collapsible=icon]:block">
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					tooltipContent="Acheulit"
					class={sidebarBrandCollapsedButtonClass}
				>
					{#snippet child({ props })}
						<a href="/app" {...props} aria-label="Acheulit home">
							<img
								src="/brand/acheulit-logo.png"
								alt="Acheulit logo"
								class={sidebarBrandCollapsedLogoClass}
							/>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>

		<div class="group-data-[collapsible=icon]:hidden px-2">
			<div class={sidebarSupportCardClass}>
				<div class="flex items-start justify-between gap-3">
					<Badge
						variant="outline"
						class={`${sidebarStatusBadgeClass} ${statusMeta.badgeClass}`}
					>
						{statusMeta.label}
					</Badge>
				</div>
				<p class={sidebarSupportCopyClass}>
					{currentProject
						? `Current project: ${currentProject.name}`
						: "Keep Overview calm, then move into chat, library, studio, or workflows when needed."}
				</p>
				<Button
					variant="secondary"
					size="sm"
					class={sidebarActionButtonClass}
					href="/app/chat"
				>
					<SparklesIcon class="size-3.5" />
					Open chat
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
