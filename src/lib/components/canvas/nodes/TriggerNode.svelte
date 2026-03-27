<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from "@xyflow/svelte";
	import NodeShell from "./NodeShell.svelte";
	import { Play } from "@lucide/svelte";

	let { data, selected }: NodeProps<Node<Record<string, any>>> = $props();
</script>

<NodeShell
	title={data.label || "Trigger"}
	subtitle="Manual start"
	icon={Play}
	type="trigger"
	{selected}
	status={data.status || "idle"}
/>

<Handle
	type="source"
	position={Position.Bottom}
	class="h-3 w-3 border-2 border-background bg-rose-500"
/>
