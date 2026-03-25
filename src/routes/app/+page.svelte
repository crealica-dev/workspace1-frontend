<script lang="ts">
import * as Card from "$lib/components/ui/card/index.js";
import { FolderKanban, MessagesSquare, Sparkles, Activity } from "@lucide/svelte";

let { data } = $props();

const email = data.email ?? "authenticated user";
const welcomeName = formatDisplayName(email);

function formatDisplayName(value: string) {
const [rawName] = value.split("@");
const normalized = rawName.replace(/[._-]+/g, " ").trim();
if (!normalized) return "there";
return normalized
.split(/\s+/)
.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
.join(" ");
}
</script>

<svelte:head>
<title>Dashboard - Workspace</title>
</svelte:head>

<div class="space-y-6">
<div>
<h1 class="text-3xl font-bold tracking-tight">Welcome back, {welcomeName}</h1>
<p class="text-muted-foreground">
Your workspace dashboard. Manage projects, sessions, and AI workflows.
</p>
</div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
<Card.Root>
<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
<Card.Title class="text-sm font-medium">Projects</Card.Title>
<FolderKanban class="text-muted-foreground size-4" />
</Card.Header>
<Card.Content>
<div class="text-2xl font-bold">&mdash;</div>
<p class="text-muted-foreground text-xs">Create your first project to get started</p>
</Card.Content>
</Card.Root>

<Card.Root>
<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
<Card.Title class="text-sm font-medium">Sessions</Card.Title>
<MessagesSquare class="text-muted-foreground size-4" />
</Card.Header>
<Card.Content>
<div class="text-2xl font-bold">&mdash;</div>
<p class="text-muted-foreground text-xs">No active sessions</p>
</Card.Content>
</Card.Root>

<Card.Root>
<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
<Card.Title class="text-sm font-medium">AI Workflows</Card.Title>
<Sparkles class="text-muted-foreground size-4" />
</Card.Header>
<Card.Content>
<div class="text-2xl font-bold">&mdash;</div>
<p class="text-muted-foreground text-xs">Ready for text, image, and audio tasks</p>
</Card.Content>
</Card.Root>

<Card.Root>
<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
<Card.Title class="text-sm font-medium">Activity</Card.Title>
<Activity class="text-muted-foreground size-4" />
</Card.Header>
<Card.Content>
<div class="text-2xl font-bold">&mdash;</div>
<p class="text-muted-foreground text-xs">No recent activity</p>
</Card.Content>
</Card.Root>
</div>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
<Card.Root class="lg:col-span-4">
<Card.Header>
<Card.Title>Recent Projects</Card.Title>
<Card.Description>Your most recent workspace projects.</Card.Description>
</Card.Header>
<Card.Content>
<div class="text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed text-sm">
No projects yet. Create one to get started.
</div>
</Card.Content>
</Card.Root>

<Card.Root class="lg:col-span-3">
<Card.Header>
<Card.Title>Recent Activity</Card.Title>
<Card.Description>Latest events across your workspace.</Card.Description>
</Card.Header>
<Card.Content>
<div class="text-muted-foreground flex h-32 items-center justify-center rounded-lg border border-dashed text-sm">
No recent activity.
</div>
</Card.Content>
</Card.Root>
</div>
</div>
