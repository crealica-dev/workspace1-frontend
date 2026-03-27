export const shellPreviewScenarios = [
	"overview",
	"chat",
	"library",
	"studio",
	"workflows",
	"billing",
	"help",
	"canvas",
] as const;

export type ShellPreviewScenario = (typeof shellPreviewScenarios)[number];

export function isShellPreviewScenario(value: string): value is ShellPreviewScenario {
	return shellPreviewScenarios.includes(value as ShellPreviewScenario);
}
