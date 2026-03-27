<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from "@xyflow/svelte";
	import NodeShell from "./NodeShell.svelte";
	import { FileBox } from "@lucide/svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";

	let { data, selected }: NodeProps<Node<Record<string, any>>> = $props();
</script>

<NodeShell
	title={data.label || "Asset Input"}
	icon={FileBox}
	type="asset"
	{selected}
	status={data.status || "idle"}
>
	<div class="flex items-center gap-2">
		{#if data.asset_id}
			<Badge variant="secondary" class="font-mono text-[10px]">Configured</Badge>
		{:else}
			<Badge variant="outline" class="font-mono text-[10px] text-muted-foreground">Select asset</Badge>
		{/if}
	</div>
</NodeShell>

<Handle
	type="source"
	position={Position.Bottom}
	class="h-3 w-3 border-2 border-background bg-teal-500"
/>
