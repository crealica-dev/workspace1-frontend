<script lang="ts">
	import { auth } from "$lib/auth";
	import {
		interactiveItemVariants,
		metricLabelClass,
		surfaceVariants,
	} from "$lib/design/index.js";
	import { projectStore } from "$lib/stores/project.svelte";
	import { cn } from "$lib/utils.js";

	type Props = {
		open: boolean;
		onClose: () => void;
		onCreated?: (projectId: string) => void;
	};

	let { open, onClose, onCreated }: Props = $props();

	type Mode = "quick" | "advanced";

	const AUDIENCE_OPTIONS = [
		"Small business",
		"Freelancer",
		"Startup",
		"Digital marketer",
		"Other",
	] as const;

	let mode = $state<Mode>("quick");
	let projectName = $state("");
	let description = $state("");
	let referenceNotes = $state("");
	let selectedAudience = $state<string[]>([]);
	let submitting = $state(false);
	let formError = $state("");
	let overlayEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!open) {
			mode = "quick";
			projectName = "";
			description = "";
			referenceNotes = "";
			selectedAudience = [];
			submitting = false;
			formError = "";
		} else {
			// Defer focus so the DOM node is mounted first
			requestAnimationFrame(() => overlayEl?.focus());
		}
	});

	function toggleAudience(label: string) {
		if (selectedAudience.includes(label)) {
			selectedAudience = selectedAudience.filter((a) => a !== label);
		} else {
			selectedAudience = [...selectedAudience, label];
		}
	}

	function handleOverlayKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	}

	async function handleSubmit() {
		const name = projectName.trim();
		if (!name) {
			formError = "Project name is required.";
			return;
		}

		const token = auth.getSessionSnapshot()?.access_token;
		if (!token) {
			formError = "You must be signed in to create a project.";
			return;
		}

		submitting = true;
		formError = "";

		try {
			const project = await projectStore.createProject(name, token, {
				description: description.trim() || undefined,
			});
			onCreated?.(project.id);
			onClose();
		} catch {
			formError = projectStore.lastError?.userMessage ?? "The project could not be created.";
		} finally {
			submitting = false;
		}
	}

	const cardClass = surfaceVariants({
		tone: "panel",
		radius: "panel",
		padding: "lg",
		emphasis: "soft",
	});

	function getAudiencePillClass(active: boolean): string {
		return cn(
			interactiveItemVariants({ tone: "pill", density: "compact" }),
			"text-xs font-medium",
			active ? "border-primary/30 bg-primary/10 text-foreground" : "text-muted-foreground",
		);
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={overlayEl}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Create new project"
		tabindex="-1"
		onkeydown={handleOverlayKeydown}
	>
		<!-- Backdrop click to close -->
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			aria-hidden="true"
			tabindex="-1"
			onclick={onClose}
		></button>

		<!-- Card -->
		<div class={cn(cardClass, "relative z-10 mx-4 w-full max-w-lg")} role="none">
			<div class="space-y-5">
				<div class="space-y-1">
					<h2 class="text-xl font-semibold tracking-tight">Start a new project</h2>
					<p class="text-sm leading-6 text-muted-foreground">
						Give your project a name so Acheulit can keep context, assets, and chats organized in
						one place.
					</p>
				</div>

				<div class="space-y-4">
					<!-- Project name -->
					<div class="space-y-1.5">
						<label class={metricLabelClass} for="pmc-name">Project name</label>
						<input
							id="pmc-name"
							type="text"
							bind:value={projectName}
							placeholder="e.g. Spring campaign 2026"
							autocomplete="off"
							class="w-full rounded-xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
						/>
					</div>

					<!-- Description -->
					<div class="space-y-1.5">
						<label class={metricLabelClass} for="pmc-desc">
							What is this project about?
							<span class="ml-1 font-normal normal-case tracking-normal text-muted-foreground">
								(optional)
							</span>
						</label>
						<textarea
							id="pmc-desc"
							bind:value={description}
							placeholder="A short summary helps the assistant pick up context faster."
							rows={3}
							class="w-full resize-none rounded-xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
						></textarea>
					</div>

					{#if mode === "advanced"}
						<!-- Target audience pill toggles -->
						<div class="space-y-1.5">
							<p class={metricLabelClass}>
								Target audience
								<span class="ml-1 font-normal normal-case tracking-normal text-muted-foreground">
									(optional)
								</span>
							</p>
							<div class="flex flex-wrap gap-2">
								{#each AUDIENCE_OPTIONS as option (option)}
									<button
										type="button"
										class={getAudiencePillClass(selectedAudience.includes(option))}
										onclick={() => toggleAudience(option)}
									>
										{option}
									</button>
								{/each}
							</div>
						</div>

						<!-- Reference notes -->
						<div class="space-y-1.5">
							<label class={metricLabelClass} for="pmc-refs">
								Reference links or notes
								<span class="ml-1 font-normal normal-case tracking-normal text-muted-foreground">
									(optional)
								</span>
							</label>
							<textarea
								id="pmc-refs"
								bind:value={referenceNotes}
								placeholder="Paste links, competitor URLs, or background notes."
								rows={3}
								class="w-full resize-none rounded-xl border border-[var(--shell-border-soft)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
							></textarea>
						</div>
					{/if}

					{#if formError}
						<p
							class="rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300"
						>
							{formError}
						</p>
					{/if}
				</div>

				<div class="flex items-center justify-between gap-3">
					<button
						type="button"
						class="text-xs text-muted-foreground transition-colors hover:text-foreground"
						onclick={() => (mode = mode === "quick" ? "advanced" : "quick")}
					>
						{mode === "quick" ? "Switch to advanced setup →" : "← Back to quick setup"}
					</button>

					<div class="flex items-center gap-2">
						<button
							type="button"
							class={cn(
								interactiveItemVariants({ tone: "pill", density: "compact" }),
								"text-xs font-medium text-muted-foreground",
							)}
							disabled={submitting}
							onclick={onClose}
						>
							Cancel
						</button>
						<button
							type="button"
							class="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-55"
							disabled={submitting || !projectName.trim()}
							onclick={handleSubmit}
						>
							{submitting ? "Creating..." : "Create project"}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
