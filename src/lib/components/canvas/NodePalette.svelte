<script lang="ts">
	import { surfaceVariants } from '$lib/design/index.js';
	import { canvasStore, type CanvasNodeType } from '$lib/stores/canvas.svelte';
	import {
		Play, Wrench, Server, Bot, FileInput,
		Shuffle, GitBranch, LogOut, ChevronDown
	} from '@lucide/svelte';

	interface PaletteItem {
		type: CanvasNodeType;
		label: string;
		icon: typeof Play;
	}

	interface PaletteGroup {
		title: string;
		items: PaletteItem[];
	}

	const groups: PaletteGroup[] = [
		{
			title: 'Triggers',
			items: [{ type: 'trigger', label: 'Manual Trigger', icon: Play }],
		},
		{
			title: 'AI & Tools',
			items: [
				{ type: 'agent', label: 'Agent', icon: Bot },
				{ type: 'tool', label: 'MCP Tool', icon: Wrench },
			],
		},
		{
			title: 'Services',
			items: [{ type: 'service', label: 'Service', icon: Server }],
		},
		{
			title: 'Data',
			items: [
				{ type: 'assetInput', label: 'Asset Input', icon: FileInput },
				{ type: 'transform', label: 'Transform', icon: Shuffle },
			],
		},
		{
			title: 'Logic',
			items: [
				{ type: 'condition', label: 'Condition', icon: GitBranch },
				{ type: 'output', label: 'Output', icon: LogOut },
			],
		},
	];

	let collapsed = $state<Record<string, boolean>>({});

	function toggleGroup(title: string) {
		collapsed[title] = !collapsed[title];
	}

	function onDragStart(event: DragEvent, item: PaletteItem) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData('application/svelteflow-type', item.type);
		event.dataTransfer.setData('application/svelteflow-label', item.label);
		event.dataTransfer.effectAllowed = 'move';
	}
</script>

<aside
	class="{surfaceVariants({ tone: 'panel', radius: 'block', padding: 'sm', emphasis: 'soft' })} flex w-56 shrink-0 flex-col gap-1 overflow-y-auto"
>
	<h2 class="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
		Nodes
	</h2>

	{#each groups as group}
		<button
			class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50"
			onclick={() => toggleGroup(group.title)}
		>
			{group.title}
			<ChevronDown
				class="h-3 w-3 transition-transform {collapsed[group.title] ? '-rotate-90' : ''}"
			/>
		</button>

		{#if !collapsed[group.title]}
			<div class="flex flex-col gap-0.5 pb-1">
				{#each group.items as item}
					{@const Icon = item.icon}
					<div
						role="button"
						tabindex="0"
						draggable="true"
						ondragstart={(e) => onDragStart(e, item)}
						class="flex cursor-grab items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted/60 active:cursor-grabbing"
					>
						<Icon class="h-3.5 w-3.5 text-muted-foreground" />
						<span>{item.label}</span>
					</div>
				{/each}
			</div>
		{/if}
	{/each}
</aside>
