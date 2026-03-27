import type { Node, Edge } from '@xyflow/svelte';

export type NodeStatus = 'idle' | 'running' | 'done' | 'failed';

export type CanvasNodeType =
	| 'trigger'
	| 'tool'
	| 'service'
	| 'agent'
	| 'assetInput'
	| 'transform'
	| 'condition'
	| 'output';

export interface WorkflowMeta {
	id: string | null;
	name: string;
	description: string;
	projectId: string;
}

let _nodes = $state<Node[]>([]);
let _edges = $state<Edge[]>([]);
let _meta = $state<WorkflowMeta>({ id: null, name: 'Untitled Workflow', description: '', projectId: '' });
let _selectedNodeId = $state<string | null>(null);
let _isDirty = $state(false);
let _executionStates = $state<Record<string, NodeStatus>>({});

let _nextId = $state(1);

function generateId(): string {
	return `node_${_nextId++}`;
}

class CanvasStore {
	get nodes() { return _nodes; }
	set nodes(v: Node[]) { _nodes = v; _isDirty = true; }

	get edges() { return _edges; }
	set edges(v: Edge[]) { _edges = v; _isDirty = true; }

	get meta() { return _meta; }

	get selectedNodeId() { return _selectedNodeId; }
	set selectedNodeId(id: string | null) { _selectedNodeId = id; }

	get isDirty() { return _isDirty; }

	get executionStates() { return _executionStates; }

	get selectedNode(): Node | null {
		if (!_selectedNodeId) return null;
		return _nodes.find((n) => n.id === _selectedNodeId) ?? null;
	}

	// --- mutations ---

	addNode(type: CanvasNodeType, position: { x: number; y: number }, data: Record<string, unknown> = {}) {
		const id = generateId();
		const label = data.label as string ?? type.charAt(0).toUpperCase() + type.slice(1);
		const node: Node = {
			id,
			type,
			position,
			data: { label, status: 'idle', ...data },
		};
		_nodes = [..._nodes, node];
		_isDirty = true;
		return id;
	}

	removeNode(nodeId: string) {
		_nodes = _nodes.filter((n) => n.id !== nodeId);
		_edges = _edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
		if (_selectedNodeId === nodeId) _selectedNodeId = null;
		delete _executionStates[nodeId];
		_isDirty = true;
	}

	updateNodeData(nodeId: string, patch: Record<string, unknown>) {
		_nodes = _nodes.map((n) =>
			n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n,
		);
		_isDirty = true;
	}

	setExecutionState(nodeId: string, status: NodeStatus) {
		_executionStates = { ..._executionStates, [nodeId]: status };
		this.updateNodeData(nodeId, { status });
	}

	clearExecution() {
		_executionStates = {};
		_nodes = _nodes.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } }));
	}

	// --- workflow lifecycle ---

	load(workflow: { id: string; name: string; description: string; project_id: string; nodes: Node[]; edges: Edge[] }) {
		_meta = { id: workflow.id, name: workflow.name, description: workflow.description, projectId: workflow.project_id };
		_nodes = workflow.nodes;
		_edges = workflow.edges;
		_selectedNodeId = null;
		_executionStates = {};
		_isDirty = false;
		// reset id counter past highest existing
		const maxNum = _nodes.reduce((mx, n) => {
			const m = n.id.match(/^node_(\d+)$/);
			return m ? Math.max(mx, parseInt(m[1], 10)) : mx;
		}, 0);
		_nextId = maxNum + 1;
	}

	setMeta(patch: Partial<WorkflowMeta>) {
		_meta = { ..._meta, ...patch };
		_isDirty = true;
	}

	markClean() {
		_isDirty = false;
	}

	reset() {
		_nodes = [];
		_edges = [];
		_meta = { id: null, name: 'Untitled Workflow', description: '', projectId: '' };
		_selectedNodeId = null;
		_executionStates = {};
		_isDirty = false;
		_nextId = 1;
	}

	/** Snapshot for API persistence. */
	serialize() {
		return {
			name: _meta.name,
			description: _meta.description,
			nodes: _nodes,
			edges: _edges,
			variables: [],
		};
	}
}

export const canvasStore = new CanvasStore();
