import type { ToolDescriptor } from '$lib/api/projects';

class AgentPanelState {
	isOpen = $state(true);
	tools = $state<ToolDescriptor[]>([]);
	toolsLoading = $state(false);
	toolsError = $state<string | null>(null);
	loadedProjectId = $state<string | null>(null);
	activeManualToolId = $state<string | null>(null);

	open() {
		this.isOpen = true;
	}
	close() {
		this.isOpen = false;
	}
	toggle() {
		this.isOpen = !this.isOpen;
	}

	setTools(projectId: string, tools: ToolDescriptor[]) {
		const enabled = new Set(this.tools.filter((tool) => tool.enabled).map((tool) => tool.id));
		this.tools = tools.map((tool) => ({
			...tool,
			enabled: enabled.has(tool.id) || tool.enabled,
		}));
		this.loadedProjectId = projectId;
		if (!this.activeManualToolId || !this.tools.some((tool) => tool.id === this.activeManualToolId)) {
			this.activeManualToolId = this.tools[0]?.id ?? null;
		}
	}

	toggleTool(id: string) {
		this.tools = this.tools.map((tool) =>
			tool.id === id ? { ...tool, enabled: !tool.enabled } : tool,
		);
	}

	setToolLoading(loading: boolean) {
		this.toolsLoading = loading;
	}

	setToolError(message: string | null) {
		this.toolsError = message;
	}

	setActiveManualTool(id: string | null) {
		this.activeManualToolId = id;
	}

	get enabledToolIds(): string[] {
		return this.tools.filter((tool) => tool.enabled).map((tool) => tool.id);
	}
}

export const agentPanelState = new AgentPanelState();
