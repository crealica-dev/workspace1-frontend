<script lang="ts">
	import {
		themes,
		accents,
		type ThemeId,
		type AccentId,
	} from "$lib/design/themes.js";
	import { themeStore } from "$lib/stores/theme.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import CheckIcon from "@lucide/svelte/icons/check";

	const sidebar = useSidebar();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="sm"
						class="gap-2"
						{...props}
					>
						<PaletteIcon class="size-4" />
						<span class="truncate group-data-[collapsible=icon]:hidden">Theme</span>
						<div class="ms-auto flex items-center gap-1 group-data-[collapsible=icon]:hidden">
							{#each themes as t}
								{#if t.id === themeStore.theme}
									<span
										class="size-2.5 rounded-full ring-1 ring-border/60"
										style="background: {t.preview.sidebar}"
									></span>
								{/if}
							{/each}
							{#each accents as a}
								{#if a.id === themeStore.accent}
									<span
										class="size-2.5 rounded-full"
										style="background: {a.swatch}"
									></span>
								{/if}
							{/each}
						</div>
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-64 rounded-xl p-3"
				side={sidebar.isMobile ? "top" : "right"}
				align="end"
				sideOffset={8}
			>
				<DropdownMenu.Label class="px-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
					Color theme
				</DropdownMenu.Label>
				<div class="grid grid-cols-5 gap-1.5 pb-3">
					{#each themes as t (t.id)}
						{@const isActive = themeStore.theme === t.id}
						<button
							type="button"
							class="group/theme relative flex flex-col items-center gap-1 rounded-lg p-1.5 text-center transition-colors {isActive
								? 'bg-primary/10 ring-1 ring-primary/40'
								: 'hover:bg-muted'}"
							onclick={() => themeStore.setTheme(t.id)}
							title={t.description}
						>
							<div
								class="relative flex size-9 items-center justify-center overflow-hidden rounded-md ring-1 ring-border/40"
								style="background: {t.preview.bg}"
							>
								<!-- Sidebar sliver on left -->
								<div
									class="absolute inset-y-0 left-0 w-2.5"
									style="background: {t.preview.sidebar}"
								></div>
								<!-- Surface card in center -->
								<div
									class="relative ml-2 h-5 w-5 rounded-sm"
									style="background: {t.preview.surface}; border: 1px solid {t.preview.border}"
								></div>
								{#if isActive}
									<div class="absolute inset-0 flex items-center justify-center bg-primary/15">
										<CheckIcon class="size-3.5 text-primary" />
									</div>
								{/if}
							</div>
							<span class="text-[10px] font-medium leading-none text-muted-foreground">{t.name}</span>
						</button>
					{/each}
				</div>

				<DropdownMenu.Separator />

				<DropdownMenu.Label class="px-1 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
					Accent color
				</DropdownMenu.Label>
				<div class="flex items-center justify-center gap-2 pb-1">
					{#each accents as a (a.id)}
						{@const isActive = themeStore.accent === a.id}
						<button
							type="button"
							class="group/accent relative flex size-7 items-center justify-center rounded-full transition-transform {isActive
								? 'scale-110 ring-2 ring-primary/50 ring-offset-2 ring-offset-popover'
								: 'hover:scale-105'}"
							style="background: {a.swatch}"
							onclick={() => themeStore.setAccent(a.id)}
							title={a.name}
						>
							{#if isActive}
								<CheckIcon class="size-3 text-white" />
							{/if}
						</button>
					{/each}
				</div>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
