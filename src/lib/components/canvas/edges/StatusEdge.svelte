<script lang="ts">
	import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/svelte";

	let {
		id,
		sourceX,
		sourceY,
		targetX,
		targetY,
		sourcePosition,
		targetPosition,
		markerEnd,
		style,
		data,
		selected
	}: EdgeProps = $props();

	let edgePath = $derived(
		getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition
		})[0]
	);

	let statusColor = $derived(() => {
		switch (data?.status) {
			case 'active': return '#3b82f6'; // blue-500
			case 'success': return '#22c55e'; // green-500
			case 'error': return '#ef4444'; // red-500
			default: return selected ? '#94a3b8' : '#cbd5e1'; // slate-400 : slate-300
		}
	});

	let edgeStyle = $derived(`
		stroke-width: ${selected ? 3 : 2};
		stroke: ${statusColor()};
		${data?.status === 'active' ? 'stroke-dasharray: 5; animation: dashdraw 0.5s linear infinite;' : ''}
		${style || ''}
	`);
</script>

<BaseEdge {id} path={edgePath} {markerEnd} style={edgeStyle} />

<style>
	@keyframes dashdraw {
		from { stroke-dashoffset: 10; }
		to { stroke-dashoffset: 0; }
	}
</style>
