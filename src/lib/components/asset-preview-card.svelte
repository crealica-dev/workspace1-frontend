<script lang="ts">
	import { browser } from '$app/environment';
	import type { ConversationAttachment } from '$lib/api/projects';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils.js';
	import { Expand, ExternalLink, FileText, Image as ImageIcon, Play, Volume2 } from '@lucide/svelte';

	type Props = {
		attachment: ConversationAttachment;
		class?: string;
		compact?: boolean;
	};

	let { attachment, class: className = '', compact = false }: Props = $props();

	let expanded = $state(false);
	let textContent = $state<string | null>(null);
	let textLoading = $state(false);
	let textError = $state<string | null>(null);

	const mimeType = $derived((attachment.mime_type ?? '').toLowerCase());
	const previewKind = $derived(attachment.preview_kind ?? 'file');
	const canExpand = $derived(previewKind === 'image' || previewKind === 'video');
	const isPdf = $derived(mimeType.includes('pdf'));
	const isTextLike = $derived(
		previewKind === 'document' &&
			(mimeType.startsWith('text/') ||
				mimeType.includes('json') ||
				mimeType.includes('markdown') ||
				mimeType.includes('xml') ||
				mimeType.includes('javascript')),
	);

	$effect(() => {
		if (!browser || !isTextLike || !attachment.signed_url || textContent || textLoading) return;
		let cancelled = false;
		textLoading = true;
		textError = null;
		void fetch(attachment.signed_url)
			.then(async (response) => {
				if (!response.ok) throw new Error(`Preview fetch failed with ${response.status}`);
				return await response.text();
			})
			.then((text) => {
				if (cancelled) return;
				textContent = text.slice(0, compact ? 900 : 3000);
			})
			.catch((error) => {
				if (cancelled) return;
				textError = error instanceof Error ? error.message : 'Preview unavailable.';
			})
			.finally(() => {
				if (!cancelled) textLoading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<div class={cn('overflow-hidden rounded-2xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)]', className)}>
	<div class="flex items-center justify-between gap-3 border-b border-[var(--shell-border-soft)] px-3 py-2">
		<div class="min-w-0">
			<p class="truncate text-sm font-medium">{attachment.display_name}</p>
			<p class="truncate text-[11px] text-muted-foreground">
				{attachment.mime_type ?? attachment.asset_type}
			</p>
		</div>
		<div class="flex items-center gap-1">
			{#if canExpand}
				<Button
					variant="ghost"
					size="icon-sm"
					class="rounded-full"
					type="button"
					onclick={() => (expanded = true)}
				>
					<Expand class="size-3.5" />
				</Button>
			{/if}
			{#if attachment.signed_url}
				<Button
					variant="ghost"
					size="icon-sm"
					class="rounded-full"
					href={attachment.signed_url}
					target="_blank"
					rel="noreferrer"
				>
					<ExternalLink class="size-3.5" />
				</Button>
			{/if}
		</div>
	</div>

	<div class={cn('p-3', compact ? 'space-y-2' : 'space-y-3')}>
		{#if previewKind === 'image' && attachment.signed_url}
			<img
				src={attachment.signed_url}
				alt={attachment.display_name}
				class={cn('w-full rounded-xl bg-black/5 object-cover', compact ? 'max-h-48' : 'max-h-80')}
			/>
		{:else if previewKind === 'video' && attachment.signed_url}
			<video
				src={attachment.signed_url}
				class={cn('w-full rounded-xl bg-black object-contain', compact ? 'max-h-48' : 'max-h-80')}
				controls={!compact}
				muted={compact}
				playsinline
				preload="metadata"
			></video>
		{:else if previewKind === 'audio' && attachment.signed_url}
			<div class="flex items-center gap-3 rounded-xl bg-background px-3 py-4">
				<div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Volume2 class="size-4" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{attachment.display_name}</p>
					<audio controls class="mt-2 w-full">
						<source src={attachment.signed_url} />
					</audio>
				</div>
			</div>
		{:else if isPdf && attachment.signed_url}
			<iframe
				src={attachment.signed_url}
				title={attachment.display_name}
				class={cn('w-full rounded-xl border-0 bg-white', compact ? 'h-56' : 'h-96')}
			></iframe>
		{:else if isTextLike}
			<div class="rounded-xl bg-background p-3">
				{#if textLoading}
					<p class="text-xs text-muted-foreground">Loading preview…</p>
				{:else if textError}
					<p class="text-xs text-muted-foreground">{textError}</p>
				{:else}
					<pre class={cn('overflow-auto whitespace-pre-wrap break-words font-mono text-xs', compact ? 'max-h-44' : 'max-h-80')}>
{textContent ?? 'No preview content.'}</pre>
				{/if}
			</div>
		{:else}
			<div class="flex items-center gap-3 rounded-xl bg-background px-3 py-4">
				<div class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
					{#if previewKind === 'image'}
						<ImageIcon class="size-4" />
					{:else if previewKind === 'video'}
						<Play class="size-4" />
					{:else}
						<FileText class="size-4" />
					{/if}
				</div>
				<div class="min-w-0">
					<p class="text-sm font-medium">{attachment.display_name}</p>
					<p class="text-xs text-muted-foreground">
						Inline preview is limited for this file type.
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if canExpand && attachment.signed_url}
	<Dialog.Root bind:open={expanded}>
		<Dialog.Portal>
			<Dialog.Overlay />
			<Dialog.Content class="max-w-5xl overflow-hidden rounded-3xl border-0 bg-black/95 p-3 text-white">
				{#if previewKind === 'image'}
					<img
						src={attachment.signed_url}
						alt={attachment.display_name}
						class="max-h-[85vh] w-full rounded-2xl object-contain"
					/>
				{:else}
					<video
						src={attachment.signed_url}
						class="max-h-[85vh] w-full rounded-2xl bg-black object-contain"
						controls
						playsinline
						autoplay
					>
						<track kind="captions" srclang="en" label="Captions" />
					</video>
				{/if}
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
