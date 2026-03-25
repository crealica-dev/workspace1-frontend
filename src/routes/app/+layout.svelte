<script lang="ts">
	import AgentPanel from "$lib/components/agent-panel.svelte";
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { Search } from "@lucide/svelte";
	import { page } from "$app/state";

	let { data, children } = $props();

	const email = data.email ?? "authenticated user";
	const displayName = formatDisplayName(email);

	function formatDisplayName(value: string) {
		const [rawName] = value.split("@");
		const normalized = rawName.replace(/[._-]+/g, " ").trim();
		if (!normalized) return "User";
		return normalized
			.split(/\s+/)
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(" ");
	}

	const navLinks = [
		{ title: "Overview", url: "/app" },
		{ title: "Projects", url: "/app/projects" },
		{ title: "Sessions", url: "/app/sessions" },
		{ title: "Workflows", url: "/app/workflows" },
		{ title: "Settings", url: "/app/settings" },
	];
</script>

<Sidebar.Provider>
	<AppSidebar user={{ name: displayName, email }} />
	<Sidebar.Inset>
		<header
			class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
		>
			<div class="flex w-full items-center gap-2 px-4">
				<Sidebar.Trigger class="-ms-1" />
				<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
				<Breadcrumb.Root>
					<Breadcrumb.List>
						<Breadcrumb.Item class="hidden md:block">
							<Breadcrumb.Link href="/app">Workspace</Breadcrumb.Link>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>

				<div class="relative ms-4 hidden md:block">
					<Search
						class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
					/>
					<Input
						type="search"
						placeholder="Search..."
						class="h-9 w-48 pl-9 lg:w-64"
					/>
				</div>

				<nav class="ms-auto hidden items-center gap-1 md:flex">
					{#each navLinks as link (link.url)}
						<a
							href={link.url}
							class="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-out hover:scale-105 {page
								.url.pathname === link.url
								? 'bg-accent text-foreground scale-105'
								: ''}"
						>
							{link.title}
						</a>
					{/each}
				</nav>
			</div>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<AgentPanel />
