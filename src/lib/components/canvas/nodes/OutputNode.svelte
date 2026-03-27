<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from "@xyflow/svelte";
	import NodeShell from "./NodeShell.svelte";
	import { LogOut } from "@lucide/svelte";

	let { data, selected }: NodeProps<Node<Record<string, any>>> = $props();
</script>

<Handle
	type="target"
	position={Position.Top}
	class="h-3 w-3 border-2 border-background bg-slate-400"
/>

<NodeShell
	title={data.label || "Output"}
	icon={LogOut}
	type="output"
	{selected}
	status={data.status || "idle"}
>
	<div class="text-xs text-muted-foreground mt-2 break-all">
		{data.outputKey || "result"}
	</div>
</NodeShell>
