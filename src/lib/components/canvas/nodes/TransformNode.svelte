<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from "@xyflow/svelte";
	import NodeShell from "./NodeShell.svelte";
	import { Replace } from "@lucide/svelte";

	let { data, selected }: NodeProps<Node<Record<string, any>>> = $props();
</script>

<Handle
	type="target"
	position={Position.Top}
	class="h-3 w-3 border-2 border-background bg-orange-500"
/>

<NodeShell
	title={data.label || "Transform"}
	icon={Replace}
	type="transform"
	{selected}
	status={data.status || "idle"}
>
	<div class="text-xs text-muted-foreground truncate">
		{data.template ? "Template active" : "Pass-through"}
	</div>
</NodeShell>

<Handle
	type="source"
	position={Position.Bottom}
	class="h-3 w-3 border-2 border-background bg-orange-500"
/>
