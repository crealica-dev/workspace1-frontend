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
	const enabledToolCount = $derived(agentPanelState.enabledToolIds.length);
	const totalToolCount = $derived(agentPanelState.tools.length);
	const automatedToolUsage = $derived(agentPanelState.automatedToolUsage);

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
					<div>
						<p class={metricLabelClass}>MCP tools</p>
						<p class="mt-1 text-xs text-muted-foreground">
							{#if automatedToolUsage}
								Auto — all {totalToolCount} tools
							{:else}
								{enabledToolCount} of {totalToolCount} enabled
							{/if}
						</p>
					</div>
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
					<div class="mt-3 space-y-2">
						<div class="flex rounded-xl border border-[var(--shell-border-soft)] p-0.5">
							<button
								type="button"
								class={cn(
									interactiveItemVariants({ tone: automatedToolUsage ? "selected" : "row", density: "compact" }),
									"flex-1 rounded-[10px] px-3 py-1.5 text-sm font-medium",
								)}
								onclick={() => agentPanelState.setAutomatedToolUsage(true)}
							>
								Auto
							</button>
							<button
								type="button"
								class={cn(
									interactiveItemVariants({ tone: automatedToolUsage ? "row" : "selected", density: "compact" }),
									"flex-1 rounded-[10px] px-3 py-1.5 text-sm font-medium",
								)}
								onclick={() => agentPanelState.setAutomatedToolUsage(false)}
							>
								Manual
							</button>
						</div>
						{#if agentPanelState.toolsLoading}
							<p class="text-xs text-muted-foreground">Loading MCP tool catalog…</p>
						{:else if agentPanelState.toolsError}
							<p class="text-xs text-amber-700 dark:text-amber-200">{agentPanelState.toolsError}</p>
						{:else if agentPanelState.tools.length}
							<div class="max-h-44 space-y-1 overflow-y-auto pr-1">
								{#each agentPanelState.tools as tool (tool.id)}
									{#if automatedToolUsage}
										<div
											class={cn(
												interactiveItemVariants({ tone: "row", density: "compact" }),
												"flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5",
											)}
										>
											<p class="truncate text-sm font-medium">{tool.name}</p>
											<span class="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
												{tool.server}
											</span>
										</div>
									{:else}
										<label
											class={cn(
												interactiveItemVariants({ tone: tool.enabled ? "selected" : "row", density: "compact" }),
												"flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left",
											)}
										>
											<input
												type="checkbox"
												class="mt-0.5"
												checked={tool.enabled}
												onchange={() => agentPanelState.toggleTool(tool.id)}
											/>
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2">
													<p class="truncate text-sm font-medium">{tool.name}</p>
													<span class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
														{tool.server}
													</span>
												</div>
												<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">
													{tool.description}
												</p>
											</div>
										</label>
									{/if}
								{/each}
							</div>
						{:else}
							<p class="text-xs text-muted-foreground">
								No MCP tools are available yet for this project.
							</p>
						{/if}
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
