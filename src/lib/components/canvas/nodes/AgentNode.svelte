<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from "@xyflow/svelte";
	import NodeShell from "./NodeShell.svelte";
	import { Bot } from "@lucide/svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";

	let { data, selected }: NodeProps<Node<Record<string, any>>> = $props();
</script>

<Handle
	type="target"
	position={Position.Top}
	class="h-3 w-3 border-2 border-background bg-amber-500"
/>

<NodeShell
	title={data.label || "Agent"}
	icon={Bot}
	type="agent"
	{selected}
	status={data.status || "idle"}
>
	<div class="flex flex-col gap-2">
		{#if data.prompt}
			<p class="text-xs text-muted-foreground line-clamp-2 italic">"{data.prompt}"</p>
		{:else}
			<p class="text-xs text-muted-foreground italic">No prompt set</p>
		{/if}
		<div class="flex items-center gap-2">
			{#if data.enabled_tools && data.enabled_tools.length > 0}
				<Badge variant="outline" class="text-[10px]">{data.enabled_tools.length} tools</Badge>
			{/if}
		</div>
	</div>
</NodeShell>

<Handle
	type="source"
	position={Position.Bottom}
	class="h-3 w-3 border-2 border-background bg-amber-500"
/>
