<script lang="ts">
	import { surfaceVariants } from "$lib/design/surfaces.js";
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	type NodeStatus = "idle" | "running" | "done" | "failed";
	type NodeType = "trigger" | "tool" | "service" | "agent" | "asset" | "transform" | "condition" | "output";

	let {
		icon: Icon,
		title,
		subtitle,
		type = "tool",
		status = "idle",
		selected = false,
		children,
	}: {
		icon: any;
		title: string;
		subtitle?: string;
		type?: NodeType;
		status?: NodeStatus;
		selected?: boolean;
		children?: Snippet;
	} = $props();

	// Color coding left border per node type
	const typeConfig: Record<NodeType, string> = {
		trigger: "border-l-rose-500",
		tool: "border-l-blue-500",
		service: "border-l-violet-500",
		agent: "border-l-amber-500",
		asset: "border-l-teal-500",
		transform: "border-l-orange-500",
		condition: "border-l-yellow-500",
		output: "border-l-zinc-500",
	};

	const statusRing: Record<NodeStatus, string> = {
		idle: "",
		running: "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse",
		done: "ring-2 ring-green-500 ring-offset-2 ring-offset-background",
		failed: "ring-2 ring-destructive ring-offset-2 ring-offset-background",
	};
</script>

<div
	class={cn(
		surfaceVariants({ tone: "panel", radius: "block", padding: "sm" }),
		"w-[280px] border-l-4 shadow-sm transition-all relative",
		typeConfig[type],
		statusRing[status],
		selected && status === "idle" && "ring-2 ring-primary/50 ring-offset-1 ring-offset-background",
	)}
>
	<div class="flex items-center gap-3 mb-2">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground"
		>
			<Icon class="size-4" />
		</div>
		<div class="flex flex-col overflow-hidden">
			<span class="truncate text-sm font-medium leading-none">{title}</span>
			{#if subtitle}
				<span class="truncate text-xs text-muted-foreground">{subtitle}</span>
			{/if}
		</div>
	</div>

	{#if children}
		<div class="mt-2 py-2 border-t border-border/50 text-sm">
			{@render children()}
		</div>
	{/if}
</div>
