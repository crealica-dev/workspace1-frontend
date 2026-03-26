<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import {
		interactiveItemVariants,
		metricLabelClass,
		supportingCopyClass,
		surfaceVariants,
	} from "$lib/design/index.js";
	import { CircleAlert, Layers, Loader2, MessageSquare, Zap } from "@lucide/svelte";

	import { auth } from "$lib/auth";
	import { apiBaseUrl, hasSupabaseConfig, supabaseConfigError } from "$lib/config";
	import { cn } from "$lib/utils.js";

	const { session, user, loading, notice } = auth;

	let signInEmail = $state("");
	let signInPassword = $state("");
	let signUpEmail = $state("");
	let signUpPassword = $state("");

	async function handleSignIn(event: SubmitEvent) {
		event.preventDefault();
		await auth.signInWithPassword(signInEmail, signInPassword);
	}

	async function handleSignUp(event: SubmitEvent) {
		event.preventDefault();
		await auth.signUpWithPassword(signUpEmail, signUpPassword);
	}

	const featureCardClass = cn(
		interactiveItemVariants({ tone: "card", density: "spacious" }),
		"flex h-full flex-col",
	);
	const authCardClass = surfaceVariants({
		tone: "panel",
		radius: "panel",
		padding: "none",
		emphasis: "soft",
	});
	const proofCardClass = surfaceVariants({
		tone: "panel",
		radius: "panel",
		padding: "none",
		emphasis: "soft",
	});
</script>

<svelte:head>
	<title>Acheulit</title>
	<meta
		name="description"
		content="Acheulit is an AI-assisted content and workflow platform for small teams, freelancers, and growing brands."
	/>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="mx-auto grid max-w-screen-xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:gap-14 lg:px-8 lg:py-20">
		<div class="flex flex-col justify-center">
			<div class="mb-6 flex items-center gap-4">
				<div class="flex size-14 items-center justify-center rounded-3xl border border-[var(--shell-border-soft)] bg-[var(--surface-elevated)] p-2.5 shadow-sm">
					<img
						src="/brand/acheulit-logo.png"
						alt="Acheulit logo"
						class="size-full object-contain"
					/>
				</div>
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
						Acheulit
					</p>
					<p class="text-sm text-muted-foreground">
						AI-assisted content and workflow platform
					</p>
				</div>
			</div>

			<div class="mb-6 flex flex-wrap gap-2">
				<Badge variant="secondary">AI-assisted</Badge>
				<Badge variant="secondary">Project-aware</Badge>
				<Badge variant="secondary">Small teams</Badge>
			</div>

			<h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
				One calm place to organize projects, content, and AI-assisted workflows.
			</h1>

			<p class="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
				Acheulit helps smaller teams, freelancers, and growing brands keep projects,
				assets, conversations, and guided AI work moving together without juggling
				disconnected tools.
			</p>

			<div class="mt-10 grid gap-4 sm:grid-cols-2">
				<Card.Root class={featureCardClass}>
					<Card.Header>
						<Card.Title>Project-scoped context</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class={supportingCopyClass}>
							Keep projects, sessions, assets, and working context aligned from the first
							screen.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class={featureCardClass}>
					<Card.Header>
						<Card.Title>Shared asset library</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class={supportingCopyClass}>
							Store uploads, references, and generated files in one place so every project
							stays organized.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class={featureCardClass}>
					<Card.Header>
						<Card.Title>Guided assistant</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class={supportingCopyClass}>
							Open the assistant to review activity, plan next steps, and move from quick
							asks into deeper workflow work.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class={featureCardClass}>
					<Card.Header>
						<Card.Title>Secure access</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class={supportingCopyClass}>
							Sign in securely and open Acheulit with your projects, conversations, and
							library ready to go.
						</p>
					</Card.Content>
				</Card.Root>
			</div>
		</div>

		<div class="flex items-start justify-center lg:justify-end">
			<Card.Root class={cn(authCardClass, "w-full max-w-md")}>
				<Card.Header class="space-y-1">
					<Card.Title class="text-2xl">Sign in to Acheulit</Card.Title>
					<Card.Description>
						Use your account to open projects, conversations, and the workflow library at
						<span class="font-medium">/app</span>.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if !hasSupabaseConfig}
						<Alert.Root variant="destructive">
							<CircleAlert class="size-4" />
							<Alert.Title>Configuration missing</Alert.Title>
							<Alert.Description>{supabaseConfigError}</Alert.Description>
						</Alert.Root>
					{/if}

					{#if $notice}
						<Alert.Root variant={$notice.type === "error" ? "destructive" : "default"}>
							<CircleAlert class="size-4" />
							<Alert.Description>{$notice.message}</Alert.Description>
						</Alert.Root>
					{/if}

					{#if $session}
						<div class="space-y-4">
							<div class="space-y-1">
								<p class="text-muted-foreground text-sm">Signed in as</p>
								<p class="font-semibold">{$user?.email ?? "Authenticated user"}</p>
							</div>
							<div class="flex gap-3">
								<Button href="/app" class="flex-1">Open Acheulit</Button>
								<Button
									variant="outline"
									class="flex-1"
									disabled={$loading}
									onclick={() => { void auth.signOut(); }}
								>
									Sign out
								</Button>
							</div>
						</div>
					{:else}
						{#if $loading}
							<div class="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
								<Loader2 class="size-4 animate-spin" />
								<span>Checking session...</span>
							</div>
						{/if}

						<Tabs.Root value="sign-in">
							<Tabs.List class="grid w-full grid-cols-2">
								<Tabs.Trigger value="sign-in">Sign in</Tabs.Trigger>
								<Tabs.Trigger value="sign-up">Sign up</Tabs.Trigger>
							</Tabs.List>
							<Tabs.Content value="sign-in">
								<form class="space-y-4" onsubmit={handleSignIn}>
									<div class="space-y-2">
										<Label for="sign-in-email">Email</Label>
										<Input
											id="sign-in-email"
											type="email"
											placeholder="you@example.com"
											bind:value={signInEmail}
											disabled={$loading || !hasSupabaseConfig}
											required
										/>
									</div>
									<div class="space-y-2">
										<Label for="sign-in-password">Password</Label>
										<Input
											id="sign-in-password"
											type="password"
											placeholder="Enter your password"
											bind:value={signInPassword}
											disabled={$loading || !hasSupabaseConfig}
											required
										/>
									</div>
									<Button type="submit" class="w-full" disabled={$loading || !hasSupabaseConfig}>
										Sign in
									</Button>
								</form>
							</Tabs.Content>
							<Tabs.Content value="sign-up">
								<form class="space-y-4" onsubmit={handleSignUp}>
									<div class="space-y-2">
										<Label for="sign-up-email">Email</Label>
										<Input
											id="sign-up-email"
											type="email"
											placeholder="you@example.com"
											bind:value={signUpEmail}
											disabled={$loading || !hasSupabaseConfig}
											required
										/>
									</div>
									<div class="space-y-2">
										<Label for="sign-up-password">Password</Label>
										<Input
											id="sign-up-password"
											type="password"
											placeholder="Create a password"
											bind:value={signUpPassword}
											disabled={$loading || !hasSupabaseConfig}
											required
										/>
									</div>
									<Button type="submit" class="w-full" disabled={$loading || !hasSupabaseConfig}>
										Create account
									</Button>
								</form>
							</Tabs.Content>
						</Tabs.Root>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>

	<!-- Proof section -->
	<section class="py-16 px-4">
		<div class="max-w-5xl mx-auto">
			<p class={metricLabelClass}>Built for real workflows</p>
			<h2 class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
				Everything in one place — the way it actually works
			</h2>
			<div class="mt-10 grid gap-6 sm:grid-cols-3">
				<div class={proofCardClass}>
					<div class="aspect-video w-full rounded-t-2xl bg-gradient-to-br from-[var(--brand-surface)] to-[var(--surface-muted)] flex items-center justify-center">
						<MessageSquare size={40} class="text-primary/40" />
					</div>
					<div class="px-4 py-3">
						<p class="text-sm font-semibold">Chat workspace</p>
						<p class={supportingCopyClass}>Plan, generate, and refine without leaving the thread.</p>
					</div>
				</div>
				<div class={proofCardClass}>
					<div class="aspect-video w-full rounded-t-2xl bg-gradient-to-br from-[var(--brand-surface)] to-[var(--surface-muted)] flex items-center justify-center">
						<Layers size={40} class="text-primary/40" />
					</div>
					<div class="px-4 py-3">
						<p class="text-sm font-semibold">Project library</p>
						<p class={supportingCopyClass}>Source files, context, and outputs connected in one place.</p>
					</div>
				</div>
				<div class={proofCardClass}>
					<div class="aspect-video w-full rounded-t-2xl bg-gradient-to-br from-[var(--brand-surface)] to-[var(--surface-muted)] flex items-center justify-center">
						<Zap size={40} class="text-primary/40" />
					</div>
					<div class="px-4 py-3">
						<p class="text-sm font-semibold">Workflow flows</p>
						<p class={supportingCopyClass}>Automation steps that know your project context.</p>
					</div>
				</div>
			</div>
			<p class="text-center text-sm text-muted-foreground mt-8">Designed for small businesses, freelancers, and digital marketers.</p>
		</div>
	</section>

	<!-- How it works section -->
	<section class="py-16 px-4 bg-[var(--surface-muted)]">
		<div class="max-w-4xl mx-auto">
			<p class={metricLabelClass}>Get started in minutes</p>
			<h2 class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
				Three steps to your first output
			</h2>
			<div class="mt-10 grid gap-6 sm:grid-cols-3">
				<div class={surfaceVariants({ tone: "muted", radius: "block", padding: "md", emphasis: "flat" })}>
					<p class="text-3xl font-bold text-muted-foreground/30">01</p>
					<p class="mt-3 text-sm font-semibold">Create a project</p>
					<p class="mt-1 text-sm text-muted-foreground leading-relaxed">
						Drop your source files, references, or a quick brief into a new project.
					</p>
				</div>
				<div class={surfaceVariants({ tone: "muted", radius: "block", padding: "md", emphasis: "flat" })}>
					<p class="text-3xl font-bold text-muted-foreground/30">02</p>
					<p class="mt-3 text-sm font-semibold">Chat with Acheulit</p>
					<p class="mt-1 text-sm text-muted-foreground leading-relaxed">
						Ask the assistant to plan, transcribe, generate, or summarise — all in one thread.
					</p>
				</div>
				<div class={surfaceVariants({ tone: "muted", radius: "block", padding: "md", emphasis: "flat" })}>
					<p class="text-3xl font-bold text-muted-foreground/30">03</p>
					<p class="mt-3 text-sm font-semibold">Review and refine</p>
					<p class="mt-1 text-sm text-muted-foreground leading-relaxed">
						Get a draft, request changes, approve, and export — without leaving the workspace.
					</p>
				</div>
			</div>
		</div>
	</section>
</div>
