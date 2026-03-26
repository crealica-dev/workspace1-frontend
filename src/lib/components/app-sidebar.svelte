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
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import ThemeSwitcher from "./theme-switcher.svelte";
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
	<Sidebar.Content class="px-2 pb-2 pt-16">
		<NavMain items={data.navMain} />
	</Sidebar.Content>

	<Sidebar.Footer class="px-2 pb-3 pt-2">
		<ThemeSwitcher />
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>
