<script lang="ts">
	import { Handle, Position, type NodeProps, type Node } from "@xyflow/svelte";
	import NodeShell from "./NodeShell.svelte";
	import { Zap } from "@lucide/svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";

	let { data, selected }: NodeProps<Node<Record<string, any>>> = $props();
</script>

<Handle
	type="target"
	position={Position.Top}
	class="h-3 w-3 border-2 border-background bg-violet-500"
/>

<NodeShell
	title={data.label || "Service"}
	icon={Zap}
	type="service"
	{selected}
	status={data.status || "idle"}
>
	<div class="flex items-center gap-2">
		<Badge variant="secondary" class="font-mono text-[10px]">{data.service_type || "unconfigured"}</Badge>
	</div>
</NodeShell>

<Handle
	type="source"
	position={Position.Bottom}
	class="h-3 w-3 border-2 border-background bg-violet-500"
/>
