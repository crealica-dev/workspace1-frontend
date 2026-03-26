<script lang="ts">
	import { metricLabelClass, surfaceVariants } from "$lib/design/index.js";
	import { cn } from "$lib/utils.js";
</script>

<svelte:head>
	<title>Help & tutorials - Acheulit</title>
</svelte:head>

<div class="flex h-full min-h-0 flex-col gap-8 overflow-y-auto p-6">
	<div>
		<h1 class="text-2xl font-semibold">Help &amp; tutorials</h1>
		<p class="mt-1 text-sm text-muted-foreground">Guides, answers, and quick references to get the most from Acheulit.</p>
	</div>

	<!-- Guide cards -->
	<section>
		<p class={metricLabelClass}>Guides</p>
		<div class="mt-4 grid gap-4 sm:grid-cols-3">
			<div class={cn(surfaceVariants({ tone: "panel", radius: "panel", padding: "lg", emphasis: "soft" }), "flex flex-col gap-3")}>
				<p class="text-sm font-semibold">Getting started</p>
				<p class="flex-1 text-sm text-muted-foreground leading-relaxed">
					Create your first project, add source material, and send your first message to Acheulit.
				</p>
				<a href="#" class="text-sm font-medium text-primary hover:underline">Read guide →</a>
			</div>
			<div class={cn(surfaceVariants({ tone: "panel", radius: "panel", padding: "lg", emphasis: "soft" }), "flex flex-col gap-3")}>
				<p class="text-sm font-semibold">Generating content</p>
				<p class="flex-1 text-sm text-muted-foreground leading-relaxed">
					Use text generation, image tools, and transcription from inside the chat workspace.
				</p>
				<a href="#" class="text-sm font-medium text-primary hover:underline">Read guide →</a>
			</div>
			<div class={cn(surfaceVariants({ tone: "panel", radius: "panel", padding: "lg", emphasis: "soft" }), "flex flex-col gap-3")}>
				<p class="text-sm font-semibold">Billing and credits</p>
				<p class="flex-1 text-sm text-muted-foreground leading-relaxed">
					Understand how credits work, top up your balance, and review your spending history.
				</p>
				<a href="/app/billing" class="text-sm font-medium text-primary hover:underline">View billing →</a>
			</div>
		</div>
	</section>

	<!-- FAQ section -->
	<section>
		<p class={metricLabelClass}>Frequently asked questions</p>
		<h2 class="mt-2 text-lg font-semibold">Frequently asked questions</h2>
		<div class="mt-4 flex flex-col gap-3">
			<details class={surfaceVariants({ tone: "muted", radius: "block", padding: "md", emphasis: "flat" })}>
				<summary class="cursor-pointer text-sm font-medium">What is a credit?</summary>
				<p class="mt-3 text-sm text-muted-foreground leading-relaxed">
					A credit is a unit of compute used by Acheulit's AI services. Different tasks (transcription, image generation, text generation) consume different amounts.
				</p>
			</details>
			<details class={surfaceVariants({ tone: "muted", radius: "block", padding: "md", emphasis: "flat" })}>
				<summary class="cursor-pointer text-sm font-medium">Can I cancel or change my plan?</summary>
				<p class="mt-3 text-sm text-muted-foreground leading-relaxed">
					Yes. You can update your plan at any time from the Billing page. Pay-as-you-go users are not locked into a subscription.
				</p>
			</details>
			<details class={surfaceVariants({ tone: "muted", radius: "block", padding: "md", emphasis: "flat" })}>
				<summary class="cursor-pointer text-sm font-medium">How do I add files to a project?</summary>
				<p class="mt-3 text-sm text-muted-foreground leading-relaxed">
					Open your project in the Library, then use the Upload button to add audio, images, or documents.
				</p>
			</details>
		</div>
	</section>
</div>
