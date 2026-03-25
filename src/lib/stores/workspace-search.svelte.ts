class WorkspaceSearchStore {
	query = $state('');

	setQuery(nextQuery: string): void {
		this.query = nextQuery;
	}

	clear(): void {
		this.query = '';
	}
}

export const workspaceSearchStore = new WorkspaceSearchStore();
