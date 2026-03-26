<script lang="ts">
	import { surfaceVariants, interactiveItemVariants, metricLabelClass } from "$lib/design/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import { Pencil } from "@lucide/svelte";
</script>

<svelte:head>
	<title>Billing - Acheulit</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
	<!-- Section A — Plan overview -->
	<div class={surfaceVariants({ tone: "panel", radius: "panel", padding: "lg", emphasis: "soft" })}>
		<p class={metricLabelClass}>Current plan</p>
		<div class="mt-2 flex flex-wrap items-center gap-2">
			<span class="text-lg font-semibold">Acheulit Starter</span>
			<span class={interactiveItemVariants({ tone: "pill", density: "compact" })}>Pay as you go</span>
		</div>

		<div class="mt-4">
			<p class={metricLabelClass}>Credits used this month</p>
			<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
				<div class="h-full rounded-full bg-primary transition-all" style="width: 34%"></div>
			</div>
			<p class="mt-1.5 text-xs text-muted-foreground">340 / 1,000 credits</p>
		</div>

		<div class="mt-5 flex flex-wrap items-center gap-2">
			<Button variant="outline">Top up credits</Button>
			<Button variant="default">Upgrade plan</Button>
		</div>
	</div>

	<!-- Section B — Payment methods -->
	<div class={surfaceVariants({ tone: "panel", radius: "panel", padding: "lg", emphasis: "soft" })}>
		<p class={metricLabelClass}>Payment methods</p>
		<div class="mt-3 flex items-center justify-between">
			<span class="text-sm">Visa ending in 4242</span>
			<Button variant="ghost" size="icon-sm" aria-label="Edit payment method">
				<Pencil class="size-3.5" />
			</Button>
		</div>
		<div class="mt-3">
			<Button variant="outline" size="sm">Add payment method</Button>
		</div>
	</div>

	<!-- Section C — Spending report -->
	<div class={surfaceVariants({ tone: "panel", radius: "panel", padding: "lg", emphasis: "soft" })}>
		<p class={metricLabelClass}>This month</p>
		<div class="mt-3 flex flex-col gap-2">
			<div class={cn(metricLabelClass, "flex items-center justify-between")}>
				<span>Credits consumed</span>
				<span>340</span>
			</div>
			<div class={cn(metricLabelClass, "flex items-center justify-between")}>
				<span>Estimated cost</span>
				<span>$3.40</span>
			</div>
		</div>
		<p class="mt-2 text-xs text-muted-foreground">~$0.01 per credit. Pay only for what you use.</p>
	</div>
</div>
