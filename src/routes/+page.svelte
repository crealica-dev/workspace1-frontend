<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { CircleAlert, Loader2 } from "@lucide/svelte";

	import { auth } from "$lib/auth";
	import { apiBaseUrl, hasSupabaseConfig, supabaseConfigError } from "$lib/config";

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
</script>

<svelte:head>
	<title>Workspace Studio</title>
	<meta
		name="description"
		content="SvelteKit landing page with Supabase authentication for the Workspace multimodal content studio."
	/>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="mx-auto grid max-w-screen-xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:gap-14 lg:px-8 lg:py-20">
		<div class="flex flex-col justify-center">
			<div class="mb-6 flex flex-wrap gap-2">
				<Badge variant="secondary">SvelteKit</Badge>
					<Badge variant="secondary">FastAPI</Badge>
					<Badge variant="secondary">Supabase Auth</Badge>
			</div>

			<h1 class="text-4xl font-bold tracking-tight sm:text-5xl">
				Project-aware multimodal workflows, sessions, and AI tooling in one studio.
			</h1>

			<p class="text-muted-foreground mt-6 max-w-2xl text-lg leading-8">
				Use a SvelteKit frontend backed by FastAPI and Supabase to manage projects,
				sessions, assets, and future agentic chat surfaces without carrying demo-only
				assumptions into the product UI.
			</p>

			<div class="mt-10 grid gap-4 sm:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>Project-scoped context</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm">
							Keep users, projects, sessions, jobs, and assets aligned with the backend
							domain model from the first screen.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Supabase-native auth</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm">
							Use direct Supabase JS authentication for email and password flows while
							the FastAPI backend verifies bearer tokens.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Frontend-ready API</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm">
							Configured to talk to <span class="font-medium">{apiBaseUrl}</span> and
							ready for protected application routes.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>AI layer prepared</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm">
							shadcn-svelte handles the product UI while the backend is ready for AI
							surfaces and agentic workflows.
						</p>
					</Card.Content>
				</Card.Root>
			</div>
		</div>

		<div class="flex items-start justify-center lg:justify-end">
			<Card.Root class="w-full max-w-md">
				<Card.Header class="space-y-1">
					<Card.Title class="text-2xl">Sign in to your studio</Card.Title>
					<Card.Description>
						Use Supabase authentication. After sign-in, the app shell is available at
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
								<Button href="/app" class="flex-1">Open app shell</Button>
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
</div>
