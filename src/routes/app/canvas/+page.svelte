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
	import { surfaceVariants } from '$lib/design/index.js';
	import { nodeTypes } from '$lib/components/canvas/nodes/index';
	import { edgeTypes } from '$lib/components/canvas/edges/index';
	import NodePalette from '$lib/components/canvas/NodePalette.svelte';
	import InspectorPanel from '$lib/components/canvas/InspectorPanel.svelte';
	import CanvasToolbar from '$lib/components/canvas/CanvasToolbar.svelte';
	import { canvasStore, type CanvasNodeType } from '$lib/stores/canvas.svelte';
	import { auth } from '$lib/auth';
	import { projectStore } from '$lib/stores/project.svelte';
	import {
		listWorkflows,
		createWorkflow,
		updateWorkflow,
		runWorkflow,
		type Workflow,
	} from '$lib/api/projects';

	const { screenToFlowPosition } = useSvelteFlow();

	let isRunning = $state(false);
	let accessToken = $state('');
	let workflows = $state<Workflow[]>([]);
	let currentWorkflowId = $state<string | null>(null);
	let showLoadDialog = $state(false);

	const projectId = $derived(projectStore.currentProject?.id ?? null);

	$effect(() => {
		return auth.session.subscribe((session) => {
			accessToken = session?.access_token ?? '';
		});
	});

	/* ---------- drag-and-drop from palette ---------- */

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

	/* ---------- node selection ---------- */

	function handleNodeClick({ node }: { node: Node; event: MouseEvent | TouchEvent }) {
		canvasStore.selectedNodeId = node.id;
	}

	function handlePaneClick() {
		canvasStore.selectedNodeId = null;
	}

	/* ---------- new connection creates status edges ---------- */

	function handleConnect(connection: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) {
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

	/* ---------- toolbar actions ---------- */

	async function handleSave() {
		if (!projectId || !accessToken) return;
		const payload = canvasStore.serialize();
		try {
			if (currentWorkflowId) {
				await updateWorkflow(projectId, currentWorkflowId, accessToken, {
					name: payload.name,
					description: payload.description,
					nodes: payload.nodes,
					edges: payload.edges,
					variables: payload.variables,
				});
			} else {
				const created = await createWorkflow(projectId, accessToken, {
					name: payload.name || 'Untitled Workflow',
					description: payload.description,
					nodes: payload.nodes,
					edges: payload.edges,
					variables: payload.variables,
				});
				currentWorkflowId = created.id;
			}
			canvasStore.markClean();
		} catch (err) {
			console.error('[canvas] save failed', err);
		}
	}

	async function handleLoad() {
		if (!projectId || !accessToken) return;
		try {
			workflows = await listWorkflows(projectId, accessToken);
			showLoadDialog = true;
		} catch (err) {
			console.error('[canvas] load list failed', err);
		}
	}

	function loadWorkflow(wf: Workflow) {
		canvasStore.load({
			id: wf.id,
			name: wf.name,
			description: wf.description ?? '',
			project_id: wf.project_id,
			nodes: wf.nodes as Node[],
			edges: wf.edges as Edge[],
		});
		currentWorkflowId = wf.id;
		showLoadDialog = false;
	}

	async function handleRun() {
		if (!projectId || !accessToken || !currentWorkflowId) {
			// Save first if no ID
			await handleSave();
			if (!currentWorkflowId) return;
		}
		isRunning = true;
		try {
			await runWorkflow(projectId!, currentWorkflowId, accessToken);
		} catch (err) {
			console.error('[canvas] run failed', err);
		} finally {
			isRunning = false;
		}
	}

	function handleStop() {
		isRunning = false;
		canvasStore.clearExecution();
	}
</script>

<svelte:head>
	<title>Canvas - Acheulit</title>
</svelte:head>

<div class="flex h-full gap-0 overflow-hidden">
	<!-- left: palette -->
	<NodePalette />

	<!-- center: canvas -->
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
				<CanvasToolbar
					onSave={handleSave}
					onLoad={handleLoad}
					onRun={handleRun}
					onStop={handleStop}
					{isRunning}
				/>
			</SvelteFlow>
		</div>
	</div>

	<!-- right: inspector -->
	<InspectorPanel />
</div>

{#if showLoadDialog}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		onclick={() => (showLoadDialog = false)}
	>
		<div
			class={surfaceVariants({ tone: 'elevated', radius: 'panel', padding: 'lg' })}
			onclick={(e: MouseEvent) => e.stopPropagation()}
		>
			<h3 class="mb-3 text-lg font-semibold">Load Workflow</h3>
			{#if workflows.length === 0}
				<p class="text-sm text-muted-foreground">No saved workflows found.</p>
			{:else}
				<ul class="max-h-64 space-y-1 overflow-y-auto">
					{#each workflows as wf (wf.id)}
						<li>
							<button
								class="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
								onclick={() => loadWorkflow(wf)}
							>
								<span class="font-medium">{wf.name}</span>
								{#if wf.description}
									<span class="ml-2 text-muted-foreground">{wf.description}</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			<button
				class="mt-3 w-full rounded bg-muted px-3 py-1.5 text-sm"
				onclick={() => (showLoadDialog = false)}
			>
				Cancel
			</button>
		</div>
	</div>
{/if}
