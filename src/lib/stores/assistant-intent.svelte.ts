export type AssistantPromptDraft = {
	id: string;
	text: string;
	source?: string;
};

class AssistantIntentState {
	draft = $state<AssistantPromptDraft | null>(null);

	queue(text: string, source?: string) {
		this.draft = {
			id: crypto.randomUUID(),
			text,
			source,
		};
	}

	clear() {
		this.draft = null;
	}
}

export const assistantIntentState = new AssistantIntentState();
