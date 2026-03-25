<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { Textarea } from "$lib/components/ui/textarea/index.js";
import { Badge } from "$lib/components/ui/badge/index.js";
import { Separator } from "$lib/components/ui/separator/index.js";
import {
Bot,
Mic,
MicOff,
Camera,
Paperclip,
Send,
Square,
X,
Sparkles,
Loader2,
Check,
XCircle,
AlertCircle,
} from "@lucide/svelte";

// ── State ──────────────────────────────────────────────────────────────────
let isOpen = $state(false);
let isGenerating = $state(false);
let isRecording = $state(false);
let inputText = $state("");
let messagesEl: HTMLDivElement;
let fileInputEl: HTMLInputElement;

type Message = {
id: string;
role: "user" | "assistant";
content: string;
};

type HitlAction = {
id: string;
title: string;
description: string;
};

let messages = $state<Message[]>([
{
id: "welcome",
role: "assistant",
content: "Hi! I'm your workspace agent. I can help with projects, sessions, AI workflows, and more. What would you like to do?",
},
]);

let pendingActions = $state<HitlAction[]>([
{
id: "demo-hitl",
title: "Create project structure",
description: 'Ready to scaffold "Q4 Campaign" with default folders and an initial session. This cannot be undone automatically.',
},
]);

// ── Auto-scroll to latest message ─────────────────────────────────────────
$effect(() => {
// track messages length reactively
void messages.length;
void isGenerating;
if (messagesEl) {
// defer to next microtask so DOM is updated
queueMicrotask(() => {
messagesEl.scrollTop = messagesEl.scrollHeight;
});
}
});

// ── Actions ───────────────────────────────────────────────────────────────
function togglePanel() {
isOpen = !isOpen;
}

function sendMessage() {
if (!inputText.trim() || isGenerating) return;
messages = [
...messages,
{ id: crypto.randomUUID(), role: "user", content: inputText.trim() },
];
inputText = "";
isGenerating = true;
setTimeout(() => {
messages = [
...messages,
{
id: crypto.randomUUID(),
role: "assistant",
content: "Got it. I'll look into that and get back to you.",
},
];
isGenerating = false;
}, 1800);
}

function stopGeneration() {
isGenerating = false;
}

function toggleMic() {
isRecording = !isRecording;
}

function approveAction(id: string) {
const action = pendingActions.find((a) => a.id === id);
pendingActions = pendingActions.filter((a) => a.id !== id);
if (action) {
messages = [
...messages,
{
id: crypto.randomUUID(),
role: "assistant",
content: `Approved: "${action.title}". Proceeding now...`,
},
];
}
}

function rejectAction(id: string) {
const action = pendingActions.find((a) => a.id === id);
pendingActions = pendingActions.filter((a) => a.id !== id);
if (action) {
messages = [
...messages,
{
id: crypto.randomUUID(),
role: "assistant",
content: `Understood, "${action.title}" has been cancelled.`,
},
];
}
}

function handleKeydown(e: KeyboardEvent) {
if (e.key === "Enter" && !e.shiftKey) {
e.preventDefault();
sendMessage();
}
}
</script>

<!-- ── Floating Action Button (when panel is closed) ───────────────────────── -->
<button
onclick={togglePanel}
aria-label="Open agent"
class="fixed bottom-6 right-6 z-50 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-2 ring-primary/20 transition-all duration-200 hover:scale-110 hover:shadow-2xl {isOpen
? 'opacity-0 pointer-events-none scale-90'
: 'opacity-100 scale-100'}"
>
<Sparkles class="size-5" />
</button>

<!-- ── Side panel ─────────────────────────────────────────────────────────── -->
<div
class="fixed top-0 right-0 z-50 flex h-full w-[380px] flex-col border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out {isOpen
? 'translate-x-0'
: 'translate-x-full'}"
aria-hidden={!isOpen}
>
<!-- Header -->
<div class="flex h-14 shrink-0 items-center gap-3 border-b px-4">
<div class="flex size-8 items-center justify-center rounded-lg bg-primary/10">
<Sparkles class="size-4 text-primary" />
</div>
<div>
<p class="text-sm font-semibold leading-none">Workspace Agent</p>
<p class="text-muted-foreground mt-0.5 text-[11px]">Multimodal · Context-aware</p>
</div>
{#if isGenerating}
<Badge variant="secondary" class="ms-auto gap-1 text-[11px]">
<Loader2 class="size-3 animate-spin" />
Thinking
</Badge>
{:else}
<Badge
variant="secondary"
class="ms-auto text-[11px] text-emerald-600 dark:text-emerald-400"
>
● Online
</Badge>
{/if}
<button
onclick={togglePanel}
class="text-muted-foreground hover:text-foreground hover:bg-muted ms-1 rounded-md p-1.5 transition-colors"
aria-label="Close agent"
>
<X class="size-4" />
</button>
</div>

<!-- Messages -->
<div
bind:this={messagesEl}
class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
>
{#each messages as msg (msg.id)}
<div class="flex gap-2.5 {msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}">
{#if msg.role === 'assistant'}
<div
class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10"
>
<Bot class="text-primary size-3.5" />
</div>
{/if}
<div
class="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed {msg.role ===
'user'
? 'bg-primary text-primary-foreground rounded-br-sm'
: 'bg-muted text-foreground rounded-bl-sm'}"
>
{msg.content}
</div>
</div>
{/each}

{#if isGenerating}
<div class="flex gap-2.5">
<div
class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10"
>
<Bot class="text-primary size-3.5" />
</div>
<div class="bg-muted flex items-center gap-1 rounded-2xl rounded-bl-sm px-4 py-3.5">
<span
class="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:0ms]"
></span>
<span
class="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:160ms]"
></span>
<span
class="bg-muted-foreground/50 size-1.5 animate-bounce rounded-full [animation-delay:320ms]"
></span>
</div>
</div>
{/if}
</div>

<!-- Human-in-the-Loop approval area -->
{#if pendingActions.length > 0}
<div class="border-t bg-amber-50/80 px-4 py-3 dark:bg-amber-950/20">
<div class="mb-2 flex items-center gap-1.5">
<AlertCircle class="size-3.5 text-amber-600 dark:text-amber-400" />
<p class="text-xs font-semibold text-amber-700 dark:text-amber-400">
Awaiting your approval
</p>
</div>
<div class="space-y-2">
{#each pendingActions as action (action.id)}
<div class="bg-background rounded-xl border p-3 shadow-sm">
<p class="text-xs font-semibold">{action.title}</p>
<p class="text-muted-foreground mt-1 text-[11px] leading-relaxed">
{action.description}
</p>
<div class="mt-2.5 flex gap-2">
<Button
size="sm"
class="h-7 flex-1 rounded-lg text-xs"
onclick={() => approveAction(action.id)}
>
<Check class="me-1 size-3" />
Approve
</Button>
<Button
variant="outline"
size="sm"
class="h-7 flex-1 rounded-lg text-xs"
onclick={() => rejectAction(action.id)}
>
<XCircle class="me-1 size-3" />
Reject
</Button>
</div>
</div>
{/each}
</div>
</div>
{/if}

<!-- Input area -->
<div class="border-t px-3 py-3">
<Textarea
bind:value={inputText}
onkeydown={handleKeydown}
placeholder="Message agent… (Enter to send, Shift+Enter for newline)"
rows={3}
class="resize-none rounded-xl border-0 bg-muted/60 text-sm focus-visible:ring-1"
disabled={isGenerating}
/>

<div class="mt-2 flex items-center justify-between">
<!-- Multimodal attach buttons -->
<div class="flex items-center gap-0.5">
<!-- Hidden file input -->
<input bind:this={fileInputEl} type="file" multiple class="hidden" />

<button
onclick={() => fileInputEl?.click()}
class="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
aria-label="Attach file"
title="Attach file"
>
<Paperclip class="size-4" />
</button>

<button
class="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
aria-label="Attach image or video"
title="Camera / image"
>
<Camera class="size-4" />
</button>

<button
onclick={toggleMic}
class="rounded-lg p-1.5 transition-colors {isRecording
? 'bg-red-100 text-red-500 dark:bg-red-950/40 hover:bg-red-200'
: 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
aria-label={isRecording ? "Stop recording" : "Start voice input"}
title={isRecording ? "Stop recording" : "Mic"}
>
{#if isRecording}
<MicOff class="size-4" />
{:else}
<Mic class="size-4" />
{/if}
</button>
</div>

<!-- Send / Stop -->
{#if isGenerating}
<Button
variant="outline"
size="sm"
class="h-8 gap-1.5 rounded-xl px-3 text-xs"
onclick={stopGeneration}
>
<Square class="size-3.5 fill-current" />
Stop
</Button>
{:else}
<Button
size="sm"
class="h-8 gap-1.5 rounded-xl px-3 text-xs"
onclick={sendMessage}
disabled={!inputText.trim()}
>
<Send class="size-3.5" />
Send
</Button>
{/if}
</div>
</div>
</div>
