import { tv } from "tailwind-variants";

export const shellLayoutVariants = tv({
	slots: {
		viewport: "relative flex h-full flex-1 overflow-hidden bg-[var(--shell-frame-bg)]",
		mainColumn: "flex min-w-0 flex-1 flex-col overflow-hidden",
		header:
			"shrink-0 border-b border-[var(--shell-border-strong)] bg-[var(--surface-shell-header)] backdrop-blur",
		headerInner:
			"mx-auto flex h-[var(--shell-header-height)] w-full max-w-[var(--shell-content-max-width)] items-center gap-3 px-4 sm:h-[var(--shell-header-height-sm)] sm:px-6",
		headerSearch: "h-10 rounded-full border-border/70 bg-[var(--surface-shell-input)] pl-10",
		headerButton: "gap-2 rounded-full border-border/80 px-2.5",
		content: "flex min-h-0 flex-1 flex-col overflow-hidden",
		routeViewport: "min-h-0 flex-1 overflow-hidden",
		routeFrame:
			"mx-auto flex h-full min-h-0 w-full max-w-[var(--shell-content-max-width)] flex-col px-4 py-4 sm:px-6 sm:py-5",
		assistantColumn:
			"relative flex h-full min-h-0 shrink-0 overflow-hidden border-l border-[var(--shell-border-strong)] bg-[var(--surface-panel)]",
		assistantBody: "relative flex h-full min-h-0 w-full overflow-hidden",
		assistantResizeHandle:
			"absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-primary/10",
		assistantHeader:
			"shrink-0 border-b border-[var(--shell-border-strong)] bg-[var(--surface-shell-header)] px-4 py-3 backdrop-blur",
	},
});
