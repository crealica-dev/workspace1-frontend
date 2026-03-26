<script lang="ts" module>
	import ClapperboardIcon from "@lucide/svelte/icons/clapperboard";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import FolderKanbanIcon from "@lucide/svelte/icons/folder-kanban";
	import HelpCircleIcon from "@lucide/svelte/icons/help-circle";
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
			{
				title: "Billing",
				url: "/app/billing",
				icon: CreditCardIcon,
			},
			{
				title: "Help",
				url: "/app/help",
				icon: HelpCircleIcon,
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
	<Sidebar.Header class="px-3 pb-2 pt-4">
		<div class="flex items-center gap-2.5">
			<img src="/brand/acheulit-logo.png" alt="Acheulit logo" class="size-7 rounded-xl object-contain" />
			<span class="bg-gradient-to-r from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] bg-clip-text text-transparent font-bold text-sm tracking-tight">
				Acheulit
			</span>
		</div>
	</Sidebar.Header>
	<Sidebar.Content class="px-2 pb-2 pt-2">
		<NavMain items={data.navMain} />
	</Sidebar.Content>

	<Sidebar.Footer class="px-2 pb-3 pt-2">
		<ThemeSwitcher />
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>
