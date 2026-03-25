<script lang="ts" module>
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import FolderKanbanIcon from "@lucide/svelte/icons/folder-kanban";
	import MessagesSquareIcon from "@lucide/svelte/icons/messages-square";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";

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
				title: "Sessions",
				url: "/app/sessions",
				icon: MessagesSquareIcon,
			},
			{
				title: "AI Workflows",
				url: "/app/workflows",
				icon: SparklesIcon,
			},
			{
				title: "Settings",
				url: "/app/settings",
				icon: Settings2Icon,
			},
		],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		user,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user: { name: string; email: string };
	} = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					<div
						class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold"
					>
						W
					</div>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span class="truncate font-medium">Workspace</span>
						<span class="truncate text-xs">Studio</span>
					</div>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
