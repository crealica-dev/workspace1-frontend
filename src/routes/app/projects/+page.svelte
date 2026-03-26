<script lang="ts">
import { auth } from "$lib/auth";
import { Badge } from "$lib/components/ui/badge/index.js";
import { Button } from "$lib/components/ui/button/index.js";
import * as Card from "$lib/components/ui/card/index.js";
import { Input } from "$lib/components/ui/input/index.js";
import ProjectCreateModal from "$lib/components/project-create-modal.svelte";
import {
eyebrowBadgeClass,
interactiveItemVariants,
metricLabelClass,
supportingCopyClass,
surfaceVariants,
} from "$lib/design/index.js";
import { projectStore } from "$lib/stores/project.svelte";
import { cn } from "$lib/utils.js";
import { goto } from "$app/navigation";
import {
Check,
FolderKanban,
FolderOpen,
Pencil,
Plus,
Trash2,
X,
} from "@lucide/svelte";

let accessToken = $state("");
let createModalOpen = $state(false);

let renamingId = $state<string | null>(null);
let renameValue = $state("");
let renameError = $state("");
let renameLoading = $state(false);

let deletingId = $state<string | null>(null);
let deleteLoading = $state(false);
let deleteError = $state("");

const projects = $derived(projectStore.projects);
const currentProject = $derived(projectStore.currentProject);

$effect(() => {
return auth.session.subscribe((session) => {
accessToken = session?.access_token ?? "";
});
});

async function handleSelect(projectId: string) {
if (!accessToken || projectStore.currentProject?.id === projectId) return;
await projectStore.switchProject(projectId, accessToken);
goto("/app/chat");
}

function startRename(projectId: string, currentName: string) {
renamingId = projectId;
renameValue = currentName;
renameError = "";
}

function cancelRename() {
renamingId = null;
renameValue = "";
renameError = "";
}

async function commitRename(projectId: string) {
const name = renameValue.trim();
if (!name) { renameError = "Name cannot be empty."; return; }
renameLoading = true;
renameError = "";
try {
await projectStore.renameProject(projectId, name, accessToken);
renamingId = null;
} catch {
renameError = projectStore.lastError?.userMessage ?? "Could not rename project.";
} finally {
renameLoading = false;
}
}

function startDelete(projectId: string) {
deletingId = projectId;
deleteError = "";
}

function cancelDelete() {
deletingId = null;
deleteError = "";
}

async function commitDelete(projectId: string) {
deleteLoading = true;
deleteError = "";
try {
await projectStore.deleteProject(projectId, accessToken);
deletingId = null;
} catch {
deleteError = projectStore.lastError?.userMessage ?? "Could not delete project.";
deleteLoading = false;
}
}

const heroClass = surfaceVariants({ tone: "hero", radius: "panel", padding: "lg", emphasis: "soft" });
const panelClass = surfaceVariants({ tone: "panel", radius: "panel", padding: "none", emphasis: "soft" });

const projectRowBase =
"group relative flex items-center gap-4 rounded-2xl border px-5 py-4 transition-colors";
const projectRowIdle =
"border-[var(--shell-border-soft)] bg-background hover:border-border hover:bg-[var(--surface-muted)]";
const projectRowActive = "border-primary/30 bg-primary/8 shadow-sm";

function rowClass(isActive: boolean) {
return cn(projectRowBase, isActive ? projectRowActive : projectRowIdle);
}
</script>

<svelte:head>
<title>Projects — Acheulit</title>
</svelte:head>

<div class="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
<div class="mx-auto flex max-w-2xl flex-col gap-6">

<div class={heroClass}>
<Badge variant="outline" class={eyebrowBadgeClass}>Projects</Badge>
<div class="mt-3 space-y-1">
<h1 class="text-3xl font-semibold tracking-tight">Your projects</h1>
<p class={supportingCopyClass}>
Switch between projects, rename, or delete them. Each project has its own chat
history, sessions, and asset library.
</p>
</div>
<div class="mt-4 flex flex-wrap items-center gap-3">
<Badge variant="outline" class="rounded-full px-3 py-1 text-xs">
{projects.length} project{projects.length === 1 ? "" : "s"}
</Badge>
{#if currentProject}
<Badge variant="outline" class="rounded-full px-3 py-1 text-xs text-primary">
Active: {currentProject.name}
</Badge>
{/if}
<Button size="sm" class="gap-1.5" onclick={() => (createModalOpen = true)}>
<Plus class="size-3.5" />
New project
</Button>
</div>
</div>

<Card.Root class={panelClass}>
<Card.Header class="border-b border-[var(--shell-border-soft)] px-5 py-4">
<p class={metricLabelClass}>All projects</p>
</Card.Header>
<Card.Content class="p-0">
{#if projects.length === 0}
<div class="flex flex-col items-center gap-3 px-5 py-12 text-center">
<FolderKanban class="size-8 text-muted-foreground/40" />
<p class="text-sm text-muted-foreground">No projects yet. Create your first one.</p>
<Button variant="outline" size="sm" onclick={() => (createModalOpen = true)}>
<Plus class="size-3.5" />
New project
</Button>
</div>
{:else}
<ul class="flex flex-col divide-y divide-[var(--shell-border-soft)]">
{#each projects as project (project.id)}
{@const isActive = project.id === currentProject?.id}
{@const isRenaming = renamingId === project.id}
{@const isDeleting = deletingId === project.id}
<li>
{#if isDeleting}
<div class="flex flex-col gap-3 px-5 py-4">
<p class="text-sm font-medium">
Delete <span class="text-destructive">{project.name}</span>? This cannot be undone.
</p>
{#if deleteError}
<p class="text-xs text-destructive">{deleteError}</p>
{/if}
<div class="flex gap-2">
<Button variant="destructive" size="sm" disabled={deleteLoading} onclick={() => commitDelete(project.id)}>
{deleteLoading ? "Deleting…" : "Delete"}
</Button>
<Button variant="outline" size="sm" onclick={cancelDelete}>Cancel</Button>
</div>
</div>
{:else}
<div class={rowClass(isActive)}>
<div class={cn(
"flex size-9 shrink-0 items-center justify-center rounded-xl",
isActive
? "bg-primary/15 text-primary"
: "bg-[var(--surface-elevated)] text-muted-foreground group-hover:text-foreground",
)}>
{#if isActive}
<FolderOpen class="size-4" />
{:else}
<FolderKanban class="size-4" />
{/if}
</div>

<div class="min-w-0 flex-1">
{#if isRenaming}
<div class="flex items-center gap-2">
<Input
class="h-7 text-sm"
bind:value={renameValue}
onkeydown={(e) => {
if (e.key === "Enter") commitRename(project.id);
if (e.key === "Escape") cancelRename();
}}
autofocus
/>
<button
type="button"
class="rounded p-1 text-muted-foreground hover:text-foreground"
disabled={renameLoading}
onclick={() => commitRename(project.id)}
aria-label="Save"
>
<Check class="size-3.5" />
</button>
<button
type="button"
class="rounded p-1 text-muted-foreground hover:text-foreground"
onclick={cancelRename}
aria-label="Cancel"
>
<X class="size-3.5" />
</button>
</div>
{#if renameError}
<p class="mt-1 text-xs text-destructive">{renameError}</p>
{/if}
{:else}
<div class="flex items-center gap-2">
<p class="truncate text-sm font-medium">{project.name}</p>
{#if isActive}
<span class="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
Active
</span>
{/if}
</div>
{#if project.description}
<p class="truncate text-xs text-muted-foreground">{project.description}</p>
{/if}
{/if}
</div>

{#if !isRenaming}
<div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
{#if !isActive}
<Button
variant="ghost"
size="sm"
class="h-7 px-2.5 text-xs"
onclick={() => handleSelect(project.id)}
>
Open
</Button>
{/if}
<button
type="button"
class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[var(--surface-elevated)] hover:text-foreground"
onclick={() => startRename(project.id, project.name)}
aria-label="Rename project"
>
<Pencil class="size-3.5" />
</button>
<button
type="button"
class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
onclick={() => startDelete(project.id)}
aria-label="Delete project"
>
<Trash2 class="size-3.5" />
</button>
</div>
{/if}
</div>
{/if}
</li>
{/each}
</ul>
{/if}
</Card.Content>
</Card.Root>
</div>
</div>

<ProjectCreateModal
open={createModalOpen}
onClose={() => (createModalOpen = false)}
onCreated={() => { createModalOpen = false; }}
/>
