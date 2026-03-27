<script lang="ts">
	import { surfaceVariants } from '$lib/design/index.js';
	import { canvasStore } from '$lib/stores/canvas.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Trash2, X } from '@lucide/svelte';

	let node = $derived(canvasStore.selectedNode);

	function handleDelete() {
		if (node) canvasStore.removeNode(node.id);
	}

	function handleClose() {
		canvasStore.selectedNodeId = null;
	}

	function updateField(key: string, value: string) {
		if (!node) return;
		const config = (node.data.config as Record<string, unknown>) ?? {};
		canvasStore.updateNodeData(node.id, { config: { ...config, [key]: value } });
	}
</script>

{#if node}
	<aside
		class="{surfaceVariants({ tone: 'panel', radius: 'block', padding: 'sm', emphasis: 'soft' })} flex w-80 shrink-0 flex-col gap-3 overflow-y-auto"
	>
		<!-- header -->
		<div class="flex items-center justify-between border-b border-border pb-2">
			<div class="flex flex-col gap-0.5">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{node.type}
				</span>
				<span class="text-sm font-semibold">{node.data.label}</span>
			</div>
			<div class="flex gap-1">
				<Button variant="ghost" size="icon" class="h-7 w-7" onclick={handleDelete}>
					<Trash2 class="h-3.5 w-3.5 text-destructive" />
				</Button>
				<Button variant="ghost" size="icon" class="h-7 w-7" onclick={handleClose}>
					<X class="h-3.5 w-3.5" />
				</Button>
			</div>
		</div>

		<!-- label -->
		<label class="flex flex-col gap-1">
			<span class="text-xs text-muted-foreground">Label</span>
			<input
				type="text"
				class="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
				value={node.data.label ?? ''}
				oninput={(e) => canvasStore.updateNodeData(node!.id, { label: e.currentTarget.value })}
			/>
		</label>

		<!-- type-specific config -->
		{#if node.type === 'tool'}
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Tool Name</span>
				<input
					type="text"
					class="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					value={(node.data.config as Record<string, string>)?.tool_name ?? ''}
					oninput={(e) => updateField('tool_name', e.currentTarget.value)}
				/>
			</label>
		{:else if node.type === 'service'}
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Service Type</span>
				<select
					class="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					value={(node.data.config as Record<string, string>)?.service_type ?? ''}
					onchange={(e) => updateField('service_type', e.currentTarget.value)}
				>
					<option value="">Select...</option>
					<option value="transcription">Transcription</option>
					<option value="diarization">Diarization</option>
					<option value="tts">Text-to-Speech</option>
					<option value="generation">Text Generation</option>
					<option value="alignment">Alignment</option>
					<option value="analysis">Analysis</option>
				</select>
			</label>
		{:else if node.type === 'agent'}
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">System Prompt</span>
				<textarea
					class="min-h-[80px] resize-y rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					value={(node.data.config as Record<string, string>)?.prompt ?? ''}
					oninput={(e) => updateField('prompt', e.currentTarget.value)}
				></textarea>
			</label>
		{:else if node.type === 'condition'}
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Condition Expression</span>
				<input
					type="text"
					class="rounded-md border border-border bg-background px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					value={(node.data.config as Record<string, string>)?.expression ?? ''}
					oninput={(e) => updateField('expression', e.currentTarget.value)}
					placeholder="result.confidence > 0.8"
				/>
			</label>
		{:else if node.type === 'transform'}
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Template</span>
				<textarea
					class="min-h-[60px] resize-y rounded-md border border-border bg-background px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
					value={(node.data.config as Record<string, string>)?.template ?? ''}
					oninput={(e) => updateField('template', e.currentTarget.value)}
					placeholder="{'{{'}input.text{'}}'}"
				></textarea>
			</label>
		{/if}

		<!-- execution status (shown during/after run) -->
		{#if canvasStore.executionStates[node.id] && canvasStore.executionStates[node.id] !== 'idle'}
			<div class="mt-2 rounded-md border border-border p-2">
				<span class="text-xs font-medium text-muted-foreground">Status</span>
				<div class="mt-1 text-sm font-semibold capitalize
					{canvasStore.executionStates[node.id] === 'running' ? 'text-primary' : ''}
					{canvasStore.executionStates[node.id] === 'done' ? 'text-green-500' : ''}
					{canvasStore.executionStates[node.id] === 'failed' ? 'text-destructive' : ''}
				">
					{canvasStore.executionStates[node.id]}
				</div>
			</div>
		{/if}
	</aside>
{/if}
