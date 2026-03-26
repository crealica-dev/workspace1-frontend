<script lang="ts">
	import AssistantWorkspace from "$lib/components/assistant-workspace.svelte";
	import { shellLayoutVariants } from "$lib/design/index.js";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";

	const PANEL_DEFAULT_WIDTH = 420;
	const PANEL_MIN_WIDTH = 380;
	const PANEL_MAX_WIDTH = 760;
	const shell = shellLayoutVariants();

	let panelWidth = $state(PANEL_DEFAULT_WIDTH);
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
		panelWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, dragStartWidth + delta));
	}

	function onResizePointerUp() {
		isDragging = false;
	}
</script>

<div
	class="{shell.assistantColumn()} transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
	style="width: {isOpen ? `${panelWidth}px` : '0px'}"
	aria-hidden={!isOpen}
>
	<div class={shell.assistantBody()}>
		{#if isOpen}
			<div
				role="separator"
				aria-orientation="vertical"
				class="{shell.assistantResizeHandle()} {isDragging
					? 'bg-primary/25'
					: ''}"
				onpointerdown={onResizePointerDown}
				onpointermove={onResizePointerMove}
				onpointerup={onResizePointerUp}
			></div>
		{/if}

		<div
			class="flex h-full min-h-0 w-full min-w-0 transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {isOpen
				? 'opacity-100 delay-100'
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
