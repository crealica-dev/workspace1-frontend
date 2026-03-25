<script lang="ts">
	import ConversationBlock from "$lib/components/prompt-kit-blocks/conversation-with-prompt-input.svelte";
	import { Sparkles, X, Bot } from "@lucide/svelte";

	let isOpen = $state(false);
</script>

<!-- FAB: visible only when panel is closed -->
<button
	onclick={() => (isOpen = true)}
	aria-label="Open agent"
	class="fixed right-6 bottom-6 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-2 ring-primary/20 transition-all duration-200 ease-out hover:scale-110 hover:shadow-2xl {isOpen
		? 'pointer-events-none scale-90 opacity-0'
		: 'scale-100 opacity-100'}"
>
	<Sparkles class="size-5" />
</button>

<!-- Subtle backdrop: clicking closes the panel -->
{#if isOpen}
	<div
		role="presentation"
		onclick={() => (isOpen = false)}
		class="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
	></div>
{/if}

<!-- Slide-in panel -->
<div
	class="fixed top-0 right-0 z-50 flex h-full w-[400px] max-w-full flex-col border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out {isOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	aria-hidden={!isOpen}
>
	<!-- Header -->
	<div class="flex h-14 shrink-0 items-center gap-3 border-b px-4">
		<div class="flex size-8 items-center justify-center rounded-lg bg-primary/10">
			<Bot class="size-4 text-primary" />
		</div>
		<div class="flex-1">
			<p class="text-sm font-semibold leading-none">Workspace Agent</p>
			<p class="text-muted-foreground mt-0.5 text-[11px]">Multimodal · Context-aware</p>
		</div>
		<button
			onclick={() => (isOpen = false)}
			class="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1.5 transition-colors"
			aria-label="Close agent"
		>
			<X class="size-4" />
		</button>
	</div>

	<!-- Conversation block fills the rest -->
	<div class="min-h-0 flex-1 overflow-hidden">
		<ConversationBlock />
	</div>
</div>
