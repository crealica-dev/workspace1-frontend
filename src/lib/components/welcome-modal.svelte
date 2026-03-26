<script lang="ts">
	import { surfaceVariants } from "$lib/design/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	let {
		open,
		onAccept,
	}: {
		open: boolean;
		onAccept: () => void;
	} = $props();

	let accepted = $state(false);
</script>

{#if open}
	<!-- Blocking overlay — does not close on click or Escape -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md"
		aria-modal="true"
		role="dialog"
		aria-labelledby="welcome-modal-title"
	>
		<div
			class={cn(
				surfaceVariants({ tone: "panel", radius: "panel", padding: "lg", emphasis: "medium" }),
				"mx-4 w-full max-w-md",
			)}
		>
			<img
				src="/brand/acheulit-logo.png"
				alt="Acheulit"
				class="mx-auto mb-4 h-8"
			/>

			<h2
				id="welcome-modal-title"
				class="mb-2 text-center text-xl font-semibold"
			>
				Welcome to Acheulit
			</h2>

			<p class="mb-4 text-center text-sm text-muted-foreground">
				Before you start, please review our terms of use. Acheulit is a pay-as-you-go platform — you only pay for what you use.
			</p>

			<div
				class={cn(
					surfaceVariants({ tone: "muted", radius: "block", padding: "md", emphasis: "flat" }),
					"mb-4 h-[120px] overflow-y-auto text-xs text-muted-foreground",
				)}
			>
				<p class="mb-2 font-semibold">Terms of Use</p>
				<p class="mb-2">
					By using Acheulit, you agree to use the platform only for lawful purposes and in
					accordance with these terms. Acheulit reserves the right to suspend accounts that
					violate these terms.
				</p>
				<p class="mb-2 font-semibold">Data Policy</p>
				<p class="mb-2">
					We collect only the data necessary to provide our services. Your project data is
					stored securely and is never shared with third parties without your consent. You
					may request deletion of your data at any time.
				</p>
				<p class="mb-2 font-semibold">Credit Consumption Policy</p>
				<p>
					Credits are consumed when you use AI-powered features such as text generation,
					image creation, and workflow execution. Unused credits do not roll over between
					billing months. Top-up credits are non-refundable once consumed. You will be
					notified when you approach your monthly credit limit.
				</p>
			</div>

			<label class="mb-5 flex cursor-pointer items-center gap-2 text-sm">
				<input type="checkbox" bind:checked={accepted} class="rounded" />
				I agree to the terms and conditions
			</label>

			<Button
				class="w-full"
				variant="default"
				disabled={!accepted}
				onclick={onAccept}
			>
				Accept &amp; continue
			</Button>
		</div>
	</div>
{/if}
