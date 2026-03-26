import { tv } from "tailwind-variants";

export const surfaceVariants = tv({
	base: "text-foreground ring-0 border border-[var(--shell-border-soft)]",
	variants: {
		tone: {
			hero: "bg-[var(--surface-hero)]",
			panel: "bg-[var(--surface-panel)]",
			elevated: "bg-[var(--surface-elevated)]",
			muted: "bg-[var(--surface-muted)]",
			accent: "bg-[var(--surface-accent)]",
			ghost: "border-dashed bg-transparent",
		},
		radius: {
			panel: "rounded-[var(--radius-shell-panel)]",
			block: "rounded-[var(--radius-shell-block)]",
			pill: "rounded-full",
			none: "rounded-none",
		},
		padding: {
			none: "",
			sm: "p-3",
			md: "p-4",
			lg: "p-6 sm:p-7",
		},
		emphasis: {
			flat: "shadow-none",
			soft: "shadow-sm",
			medium: "shadow-md",
		},
	},
	defaultVariants: {
		tone: "panel",
		radius: "panel",
		padding: "md",
		emphasis: "soft",
	},
});

export const interactiveItemVariants = tv({
	base: "text-foreground text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
	variants: {
		tone: {
			card: "rounded-2xl border border-[var(--shell-border-soft)] bg-background hover:border-border hover:bg-[var(--surface-muted)]",
			row: "rounded-2xl border border-[var(--shell-border-soft)] bg-transparent hover:border-border hover:bg-[var(--surface-muted)]",
			selected:
				"rounded-2xl border border-primary/30 bg-primary/8 text-foreground shadow-sm",
			pill: "rounded-full border border-[var(--shell-border-soft)] bg-background hover:border-border hover:bg-[var(--surface-muted)]",
			ghost: "rounded-2xl border border-transparent bg-transparent hover:bg-[var(--surface-muted)]",
		},
		density: {
			compact: "px-3 py-2",
			regular: "px-4 py-3",
			spacious: "p-5",
		},
	},
	defaultVariants: {
		tone: "card",
		density: "regular",
	},
});

export const eyebrowBadgeClass =
	"rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

export const metricLabelClass =
	"text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";

export const supportingCopyClass = "text-sm leading-6 text-muted-foreground";

export const sectionTitleClass = "text-lg font-semibold";

/** Canonical icon container — use inside section headers, cards, and list items. */
export const iconContainerClass =
	"flex size-10 items-center justify-center rounded-2xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)]";

/** Larger icon container — use inside shortcut tiles. */
export const iconContainerLgClass =
	"flex size-11 items-center justify-center rounded-2xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)]";
