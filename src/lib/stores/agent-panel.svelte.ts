class AgentPanelState {
	isOpen = $state(true);

	open() {
		this.isOpen = true;
	}
	close() {
		this.isOpen = false;
	}
	toggle() {
		this.isOpen = !this.isOpen;
	}
}

export const agentPanelState = new AgentPanelState();
