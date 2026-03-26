<script lang="ts">
	import AssistantWorkspace from "$lib/components/assistant-workspace.svelte";
	import { interactiveItemVariants, metricLabelClass, shellLayoutVariants } from "$lib/design/index.js";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { cn } from "$lib/utils.js";
	import { ChevronDown } from "@lucide/svelte";

	const PANEL_DEFAULT_WIDTH = 420;
	const PANEL_MIN_WIDTH = 380;
	const PANEL_MAX_WIDTH = 760;
	const shell = shellLayoutVariants();

	let panelWidth = $state(PANEL_DEFAULT_WIDTH);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartWidth = $state(0);
	let toolRailVisible = $state(false);

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
			class="flex h-full min-h-0 w-full min-w-0 flex-col transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {isOpen
				? 'opacity-100 delay-100'
				: 'pointer-events-none opacity-0'}"
		>
			<div class="shrink-0 border-b border-[var(--shell-border-soft)] px-3 py-2">
				<div class="flex items-center justify-between gap-2">
					<p class={metricLabelClass}>Active tools</p>
					<button
						type="button"
						aria-label={toolRailVisible ? "Collapse tool rail" : "Expand tool rail"}
						class={cn(
							interactiveItemVariants({ tone: "pill", density: "compact" }),
							"flex size-6 items-center justify-center !p-0",
						)}
						onclick={() => (toolRailVisible = !toolRailVisible)}
					>
						<ChevronDown class="size-3.5 transition-transform {toolRailVisible ? 'rotate-180' : ''}" />
					</button>
				</div>
				{#if toolRailVisible}
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each ["Transcription", "Image gen", "Text gen"] as tool (tool)}
							<span
								class={cn(
									interactiveItemVariants({ tone: "pill", density: "compact" }),
									"pointer-events-none inline-flex items-center gap-1.5 text-xs font-medium",
								)}
							>
								<span class="inline-block size-1.5 rounded-full bg-green-500"></span>
								{tool}
							</span>
						{/each}
					</div>
				{/if}
			</div>
			<div class="min-h-0 flex-1 overflow-hidden">
				<AssistantWorkspace
					variant="drawer"
					showCloseButton={true}
					onClose={() => agentPanelState.close()}
				/>
			</div>
		</div>
	</div>
</div>
