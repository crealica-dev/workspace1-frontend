<script lang="ts">
	import {
		SvelteFlow,
		Background,
		Controls,
		MiniMap,
		useSvelteFlow,
		type Node,
		type Edge,
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import { nodeTypes } from '$lib/components/canvas/nodes/index';
	import { edgeTypes } from '$lib/components/canvas/edges/index';
	import NodePalette from '$lib/components/canvas/NodePalette.svelte';
	import InspectorPanel from '$lib/components/canvas/InspectorPanel.svelte';
	import CanvasToolbar from '$lib/components/canvas/CanvasToolbar.svelte';
	import { canvasStore, type CanvasNodeType } from '$lib/stores/canvas.svelte';

	interface Props {
		onSave?: () => void;
		onLoad?: () => void;
		onRun?: () => void;
		onStop?: () => void;
		isRunning?: boolean;
	}

	let { onSave, onLoad, onRun, onStop, isRunning = false }: Props = $props();

	const { screenToFlowPosition } = useSvelteFlow();

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (!event.dataTransfer) return;

		const type = event.dataTransfer.getData('application/svelteflow-type') as CanvasNodeType;
		const label = event.dataTransfer.getData('application/svelteflow-label');
		if (!type) return;

		const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
		canvasStore.addNode(type, position, { label });
	}

	function handleNodeClick({ node }: { node: Node; event: MouseEvent | TouchEvent }) {
		canvasStore.selectedNodeId = node.id;
	}

	function handlePaneClick() {
		canvasStore.selectedNodeId = null;
	}

	function handleConnect(connection: {
		source: string;
		target: string;
		sourceHandle?: string | null;
		targetHandle?: string | null;
	}) {
		const id = `e${connection.source}-${connection.target}`;
		const edge: Edge = {
			id,
			source: connection.source,
			target: connection.target,
			sourceHandle: connection.sourceHandle ?? undefined,
			targetHandle: connection.targetHandle ?? undefined,
			type: 'status',
			data: { status: 'idle' },
		};
		canvasStore.edges = [...canvasStore.edges, edge];
	}
</script>

<div class="flex h-full gap-0 overflow-hidden">
	<NodePalette />

	<div class="relative flex-1">
		<div class="absolute inset-0">
			<SvelteFlow
				bind:nodes={canvasStore.nodes}
				bind:edges={canvasStore.edges}
				{nodeTypes}
				{edgeTypes}
				onconnect={handleConnect}
				onnodeclick={handleNodeClick}
				onpaneclick={handlePaneClick}
				ondragover={handleDragOver}
				ondrop={handleDrop}
				fitView
				defaultEdgeOptions={{ type: 'status', data: { status: 'idle' } }}
				class="bg-background"
			>
				<Background />
				<Controls position="bottom-left" />
				<MiniMap position="bottom-right" class="rounded-lg border border-border" />
				<CanvasToolbar {onSave} {onLoad} {onRun} {onStop} {isRunning} />
			</SvelteFlow>
		</div>
	</div>

	<InspectorPanel />
</div>
