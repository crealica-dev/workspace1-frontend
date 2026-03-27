<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from "@xyflow/svelte";
	import NodeShell from "./NodeShell.svelte";
	import { GitBranch } from "@lucide/svelte";

	let { data, selected }: NodeProps<Node<Record<string, any>>> = $props();
</script>

<Handle
	type="target"
	position={Position.Top}
	class="h-3 w-3 border-2 border-background bg-yellow-500"
/>

<NodeShell
	title={data.label || "Condition"}
	icon={GitBranch}
	type="condition"
	{selected}
	status={data.status || "idle"}
>
	<div class="flex justify-between text-xs font-mono text-muted-foreground mt-2">
		<span>Yes</span>
		<span>No</span>
	</div>
</NodeShell>

<Handle
	type="source"
	position={Position.Bottom}
	id="yes"
	style="left: 25%"
	class="h-3 w-3 border-2 border-background bg-green-500"
/>

<Handle
	type="source"
	position={Position.Bottom}
	id="no"
	style="left: 75%"
	class="h-3 w-3 border-2 border-background bg-rose-500"
/>
