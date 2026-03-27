<script lang="ts">
	import { Panel } from '@xyflow/svelte';
	import { canvasStore } from '$lib/stores/canvas.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Save, FolderOpen, Play, Square, Circle } from '@lucide/svelte';

	interface Props {
		onSave?: () => void;
		onLoad?: () => void;
		onRun?: () => void;
		onStop?: () => void;
		isRunning?: boolean;
	}

	let { onSave, onLoad, onRun, onStop, isRunning = false }: Props = $props();

	let isEditing = $state(false);
	let editValue = $state('');

	function startEdit() {
		editValue = canvasStore.meta.name;
		isEditing = true;
	}

	function commitEdit() {
		canvasStore.setMeta({ name: editValue.trim() || 'Untitled Workflow' });
		isEditing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') commitEdit();
		if (e.key === 'Escape') isEditing = false;
	}

	let doneCount = $derived(
		Object.values(canvasStore.executionStates).filter((s) => s === 'done').length,
	);
	let totalCount = $derived(canvasStore.nodes.length);
</script>

<Panel position="top-center">
	<div
		class="flex items-center gap-2 rounded-xl border border-border bg-background/95 px-3 py-1.5 shadow-md backdrop-blur-sm"
	>
		<!-- workflow name -->
		{#if isEditing}
			<input
				type="text"
				class="w-40 rounded border border-border bg-transparent px-1.5 py-0.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring"
				bind:value={editValue}
				onblur={commitEdit}
				onkeydown={handleKeydown}
			/>
		{:else}
			<button
				class="flex items-center gap-1 text-sm font-medium hover:text-primary"
				ondblclick={startEdit}
				title="Double-click to rename"
			>
				{canvasStore.meta.name}
				{#if canvasStore.isDirty}
					<Circle class="h-2 w-2 fill-amber-400 text-amber-400" />
				{/if}
			</button>
		{/if}

		<div class="mx-1 h-4 w-px bg-border"></div>

		<!-- action buttons -->
		<Button variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs" onclick={onSave}>
			<Save class="h-3.5 w-3.5" />
			Save
		</Button>
		<Button variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs" onclick={onLoad}>
			<FolderOpen class="h-3.5 w-3.5" />
			Load
		</Button>

		<div class="mx-1 h-4 w-px bg-border"></div>

		{#if isRunning}
			<Button variant="destructive" size="sm" class="h-7 gap-1 px-2 text-xs" onclick={onStop}>
				<Square class="h-3 w-3" />
				Stop
			</Button>
			<span class="text-xs text-muted-foreground">{doneCount}/{totalCount}</span>
		{:else}
			<Button variant="default" size="sm" class="h-7 gap-1 px-2 text-xs" onclick={onRun}>
				<Play class="h-3 w-3" />
				Run
			</Button>
		{/if}
	</div>
</Panel>
