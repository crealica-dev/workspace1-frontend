<script lang="ts">
	import AssistantWorkspace from "$lib/components/assistant-workspace.svelte";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";

	let panelWidth = $state(420);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartWidth = $state(0);

	const isOpen = $derived(agentPanelState.isOpen);

	function onResizePointerDown(e: PointerEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartWidth = panelWidth;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onResizePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const delta = dragStartX - e.clientX;
		panelWidth = Math.min(760, Math.max(380, dragStartWidth + delta));
	}

	function onResizePointerUp() {
		isDragging = false;
	}
</script>

<div
	class="relative flex h-full min-h-0 shrink-0 overflow-hidden border-l border-l-border/85 bg-gradient-to-b from-background via-background to-muted/30 shadow-[-24px_0_60px_-44px_rgba(15,23,42,0.45)] transition-[width] duration-300 ease-out"
	style="width: {isOpen ? `${panelWidth}px` : '0px'}"
	aria-hidden={!isOpen}
>
	<div
		class="relative flex h-full min-h-0 w-full overflow-hidden bg-background/98 backdrop-blur supports-[backdrop-filter]:bg-background/90"
	>
		{#if isOpen}
			<div
				role="separator"
				aria-orientation="vertical"
				class="absolute top-0 left-0 z-10 h-full w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-primary/15 {isDragging
					? 'bg-primary/25'
					: ''}"
				onpointerdown={onResizePointerDown}
				onpointermove={onResizePointerMove}
				onpointerup={onResizePointerUp}
			></div>
		{/if}

		<div
			class="flex h-full min-h-0 w-full min-w-0 transition-opacity duration-200 {isOpen
				? 'opacity-100'
				: 'pointer-events-none opacity-0'}"
		>
			<AssistantWorkspace
				variant="drawer"
				showCloseButton={true}
				onClose={() => agentPanelState.close()}
			/>
		</div>
	</div>
</div>
