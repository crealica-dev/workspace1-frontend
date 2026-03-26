<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/auth";
	import { interactiveItemVariants, surfaceVariants } from "$lib/design/index.js";
	import { projectStore } from "$lib/stores/project.svelte";
	import { cn } from "$lib/utils.js";
	import { Check, ChevronDown, FolderKanban, FolderOpen, Plus } from "@lucide/svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	let accessToken = $state("");
	let open = $state(false);

	const projects = $derived(projectStore.projects);
	const current = $derived(projectStore.currentProject);

	$effect(() => {
		return auth.session.subscribe((session) => {
			accessToken = session?.access_token ?? "";
		});
	});

	async function select(projectId: string) {
		open = false;
		if (!accessToken || projectId === current?.id) return;
		await projectStore.switchProject(projectId, accessToken);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") open = false;
	}

	const dropdownClass = cn(
		surfaceVariants({ tone: "panel", radius: "panel", padding: "none", emphasis: "medium" }),
		"absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden",
	);

	const itemClass = (isActive: boolean) =>
		cn(
			"flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors",
			isActive
				? "bg-primary/10 font-medium text-primary"
				: "text-foreground hover:bg-[var(--surface-muted)]",
		);
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Project switcher — shown in expanded sidebar only -->
<Sidebar.Group class="group-data-[collapsible=icon]:hidden px-0 py-0 pb-1">
	<div class="relative px-3">
		<button
			type="button"
			class={cn(
				interactiveItemVariants({ tone: "row", density: "compact" }),
				"flex w-full items-center gap-2 rounded-xl text-sm",
			)}
			onclick={() => (open = !open)}
			aria-haspopup="listbox"
			aria-expanded={open}
		>
			<div class="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
				<FolderOpen class="size-3" />
			</div>
			<span class="flex-1 truncate text-left text-xs font-medium">
				{current?.name ?? "No project"}
			</span>
			<ChevronDown
				class={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
			/>
		</button>

		{#if open}
			<!-- Click-away backdrop -->
			<button
				type="button"
				class="fixed inset-0 z-40"
				aria-label="Close project switcher"
				onclick={() => (open = false)}
			></button>

			<div class={dropdownClass} role="listbox" aria-label="Projects">
				<div class="max-h-60 overflow-y-auto p-1">
					{#if projects.length === 0}
						<p class="px-3 py-2 text-xs text-muted-foreground">No projects yet.</p>
					{:else}
						{#each projects as project (project.id)}
							{@const isActive = project.id === current?.id}
							<button
								type="button"
								role="option"
								aria-selected={isActive}
								class={itemClass(isActive)}
								onclick={() => select(project.id)}
							>
								{#if isActive}
									<Check class="size-3.5 shrink-0 text-primary" />
								{:else}
									<FolderKanban class="size-3.5 shrink-0 text-muted-foreground" />
								{/if}
								<span class="flex-1 truncate">{project.name}</span>
							</button>
						{/each}
					{/if}
				</div>
				<div class="border-t border-[var(--shell-border-soft)] p-1">
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-[var(--surface-muted)] hover:text-foreground"
						onclick={() => { open = false; goto("/app/projects"); }}
					>
						<Plus class="size-3.5 shrink-0" />
						Manage projects
					</button>
				</div>
			</div>
		{/if}
	</div>
</Sidebar.Group>
