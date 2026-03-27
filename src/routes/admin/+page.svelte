<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import {
		metricLabelClass,
		supportingCopyClass,
		surfaceVariants,
	} from '$lib/design/index.js';
	import { cn } from '$lib/utils.js';
	import {
		Activity,
		AlertTriangle,
		CheckCircle2,
		ChevronDown,
		CircleAlert,
		Cpu,
		Image,
		Loader2,
		LogOut,
		MessageSquare,
		RefreshCw,
		Settings,
		ShieldCheck,
		XCircle,
		Zap,
	} from '@lucide/svelte';

	import {
		adminLogin,
		AdminApiClient,
		type AdminSettingsResponse,
		type AdminHealthDetail,
		type AdminEnvSnapshot,
	} from '$lib/api/admin.js';

	// ── Auth state ───────────────────────────────────────────────────────────────

	let token = $state(
		typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('admin_token') ?? '') : '',
	);
	let password = $state('');
	let loginError = $state('');
	let loginLoading = $state(false);

	function makeClient() {
		return new AdminApiClient(token);
	}

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		loginLoading = true;
		loginError = '';
		try {
			token = await adminLogin(password);
			sessionStorage.setItem('admin_token', token);
			password = '';
			await loadAll();
		} catch (err) {
			loginError = err instanceof Error ? err.message : 'Login failed';
		} finally {
			loginLoading = false;
		}
	}

	async function handleLogout() {
		try {
			await makeClient().logout();
		} catch {
			// best-effort
		}
		token = '';
		sessionStorage.removeItem('admin_token');
		settings = null;
		health = null;
		env = null;
	}

	// ── Data state ───────────────────────────────────────────────────────────────

	let settings = $state<AdminSettingsResponse | null>(null);
	let health = $state<AdminHealthDetail | null>(null);
	let env = $state<AdminEnvSnapshot | null>(null);

	let settingsError = $state('');
	let healthError = $state('');
	let envError = $state('');

	let settingsLoading = $state(false);
	let healthLoading = $state(false);
	let envLoading = $state(false);

	let savingModels = $state(false);
	let savingTuning = $state(false);
	let saveModelsError = $state('');
	let saveTuningError = $state('');
	let saveModelsSuccess = $state(false);
	let saveTuningSuccess = $state(false);

	// ── Draft values ─────────────────────────────────────────────────────────────

	let draftChatModel = $state('');
	let draftTextGenModel = $state('');
	let draftImageGenModel = $state('');
	let draftSseKeepalive = $state('');
	let draftPollSeconds = $state('');

	function syncDraftsFromSettings() {
		if (!settings) return;
		draftChatModel = settings.runtime.chat_model;
		draftTextGenModel = settings.runtime.text_gen_model;
		draftImageGenModel = settings.runtime.image_gen_model;
		draftSseKeepalive = String(settings.runtime.sse_keepalive_seconds);
		draftPollSeconds = String(settings.runtime.job_status_poll_seconds);
	}

	$effect(() => {
		if (settings) syncDraftsFromSettings();
	});

	// ── Load helpers ──────────────────────────────────────────────────────────────

	async function loadSettings() {
		settingsLoading = true;
		settingsError = '';
		try {
			settings = await makeClient().getSettings();
		} catch (err) {
			settingsError = err instanceof Error ? err.message : 'Failed to load settings';
		} finally {
			settingsLoading = false;
		}
	}

	async function loadHealth() {
		healthLoading = true;
		healthError = '';
		try {
			health = await makeClient().getHealth();
		} catch (err) {
			healthError = err instanceof Error ? err.message : 'Failed to load health';
		} finally {
			healthLoading = false;
		}
	}

	async function loadEnv() {
		envLoading = true;
		envError = '';
		try {
			env = await makeClient().getEnv();
		} catch (err) {
			envError = err instanceof Error ? err.message : 'Failed to load environment';
		} finally {
			envLoading = false;
		}
	}

	async function loadAll() {
		await Promise.all([loadSettings(), loadHealth(), loadEnv()]);
	}

	// Auto-load on mount if token already present (e.g. from sessionStorage)
	$effect(() => {
		if (token && !settings && !health && !env) {
			loadAll();
		}
	});

	// ── Save handlers ─────────────────────────────────────────────────────────────

	async function saveModels() {
		savingModels = true;
		saveModelsError = '';
		saveModelsSuccess = false;
		try {
			settings = await makeClient().updateSettings({
				chat_model: draftChatModel,
				text_gen_model: draftTextGenModel,
				image_gen_model: draftImageGenModel,
			});
			saveModelsSuccess = true;
			setTimeout(() => (saveModelsSuccess = false), 3000);
		} catch (err) {
			saveModelsError = err instanceof Error ? err.message : 'Failed to save';
		} finally {
			savingModels = false;
		}
	}

	async function saveTuning() {
		savingTuning = true;
		saveTuningError = '';
		saveTuningSuccess = false;
		try {
			settings = await makeClient().updateSettings({
				sse_keepalive_seconds: parseFloat(draftSseKeepalive),
				job_status_poll_seconds: parseFloat(draftPollSeconds),
			});
			saveTuningSuccess = true;
			setTimeout(() => (saveTuningSuccess = false), 3000);
		} catch (err) {
			saveTuningError = err instanceof Error ? err.message : 'Failed to save';
		} finally {
			savingTuning = false;
		}
	}

	// ── UI helpers ────────────────────────────────────────────────────────────────

	const panelCard = surfaceVariants({ tone: 'panel', radius: 'panel', padding: 'none', emphasis: 'soft' });

	type ComponentStatus = 'ok' | 'degraded' | 'error';

	function statusColor(status: ComponentStatus | string) {
		if (status === 'ok') return 'text-emerald-600 dark:text-emerald-400';
		if (status === 'degraded') return 'text-amber-600 dark:text-amber-400';
		return 'text-red-600 dark:text-red-400';
	}

	function statusBadgeVariant(status: ComponentStatus | string): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (status === 'ok') return 'default';
		if (status === 'degraded') return 'secondary';
		return 'destructive';
	}
</script>

<svelte:head>
	<title>Admin Panel · Acheulit</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- ── Login Screen ─────────────────────────────────────────────────── -->
	{#if !token}
		<div class="flex min-h-screen items-center justify-center px-4">
			<div class="w-full max-w-sm">
				<div class="mb-8 text-center">
					<div class="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
						<ShieldCheck class="size-6 text-primary" />
					</div>
					<h1 class="text-2xl font-bold tracking-tight">Admin Panel</h1>
					<p class={cn(supportingCopyClass, 'mt-1')}>Enter your admin password to continue</p>
				</div>

				<Card.Root class={panelCard}>
					<Card.Content class="p-6">
						<form onsubmit={handleLogin} class="space-y-4">
							<div class="space-y-2">
								<Label for="admin-password">Password</Label>
								<Input
									id="admin-password"
									type="password"
									placeholder="Admin password"
									bind:value={password}
									autocomplete="current-password"
									required
								/>
							</div>

							{#if loginError}
								<Alert.Root variant="destructive">
									<CircleAlert class="size-4" />
									<Alert.Description>{loginError}</Alert.Description>
								</Alert.Root>
							{/if}

							<Button type="submit" class="w-full" disabled={loginLoading}>
								{#if loginLoading}
									<Loader2 class="mr-2 size-4 animate-spin" />
									Signing in…
								{:else}
									Sign in
								{/if}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			</div>
		</div>

	<!-- ── Dashboard ───────────────────────────────────────────────────── -->
	{:else}
		<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

			<!-- Header -->
			<div class="mb-8 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
						<Settings class="size-5 text-primary" />
					</div>
					<div>
						<h1 class="text-xl font-bold tracking-tight">Admin Panel</h1>
						<p class={cn(metricLabelClass, 'text-xs')}>Acheulit backend &amp; frontend controls</p>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" onclick={loadAll} disabled={settingsLoading || healthLoading || envLoading}>
						<RefreshCw class={cn('mr-1.5 size-3.5', (settingsLoading || healthLoading || envLoading) && 'animate-spin')} />
						Refresh
					</Button>
					<Button variant="ghost" size="sm" onclick={handleLogout}>
						<LogOut class="mr-1.5 size-3.5" />
						Logout
					</Button>
				</div>
			</div>

			<!-- Tabs -->
			<Tabs.Root value="models">
				<Tabs.List class="mb-6">
					<Tabs.Trigger value="models">
						<MessageSquare class="mr-1.5 size-3.5" />
						Models
					</Tabs.Trigger>
					<Tabs.Trigger value="health">
						<Activity class="mr-1.5 size-3.5" />
						Health
					</Tabs.Trigger>
					<Tabs.Trigger value="env">
						<Cpu class="mr-1.5 size-3.5" />
						Environment
					</Tabs.Trigger>
					<Tabs.Trigger value="tuning">
						<Zap class="mr-1.5 size-3.5" />
						Server Tuning
					</Tabs.Trigger>
				</Tabs.List>

				<!-- ── Models Tab ──────────────────────────────────────────── -->
				<Tabs.Content value="models">
					<Card.Root class={panelCard}>
						<Card.Header class="px-6 pt-6 pb-4">
							<Card.Title class="flex items-center gap-2 text-base">
								<MessageSquare class="size-4 text-primary" />
								AI Model Configuration
							</Card.Title>
							<Card.Description>
								Select which models are used for chat, text generation, and image generation.
								Changes take effect immediately for new requests.
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-6 px-6 pb-6">
							{#if settingsLoading}
								<div class="flex items-center gap-2 text-muted-foreground">
									<Loader2 class="size-4 animate-spin" />
									<span class="text-sm">Loading settings…</span>
								</div>
							{:else if settingsError}
								<Alert.Root variant="destructive">
									<CircleAlert class="size-4" />
									<Alert.Description>{settingsError}</Alert.Description>
								</Alert.Root>
							{:else if settings}
								<div class="grid gap-6 sm:grid-cols-2">
									<!-- Chat model -->
									<div class="space-y-2">
										<Label for="chat-model">Chat / Agent model</Label>
										<div class="relative">
											<select
												id="chat-model"
												bind:value={draftChatModel}
												class="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
											>
												{#each settings.available_text_models as model}
													<option value={model}>{model}</option>
												{/each}
											</select>
											<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
										</div>
										<p class={cn(supportingCopyClass, 'text-xs')}>
											Used by the conversational agent
										</p>
									</div>

									<!-- Text gen model -->
									<div class="space-y-2">
										<Label for="text-gen-model">Text generation model</Label>
										<div class="relative">
											<select
												id="text-gen-model"
												bind:value={draftTextGenModel}
												class="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
											>
												{#each settings.available_text_models as model}
													<option value={model}>{model}</option>
												{/each}
											</select>
											<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
										</div>
										<p class={cn(supportingCopyClass, 'text-xs')}>
											Used for standalone text generation tools
										</p>
									</div>

									<!-- Image gen model -->
									<div class="space-y-2">
										<Label for="image-gen-model" class="flex items-center gap-1.5">
											<Image class="size-3.5" /> Image generation model
										</Label>
										<div class="relative">
											<select
												id="image-gen-model"
												bind:value={draftImageGenModel}
												class="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
											>
												{#each Object.entries(settings.available_image_models) as [alias, modelId]}
													<option value={alias}>{alias} — {modelId}</option>
												{/each}
											</select>
											<ChevronDown class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
										</div>
										<p class={cn(supportingCopyClass, 'text-xs')}>
											Used for image generation and editing tools
										</p>
									</div>
								</div>

								{#if saveModelsError}
									<Alert.Root variant="destructive">
										<AlertTriangle class="size-4" />
										<Alert.Description>{saveModelsError}</Alert.Description>
									</Alert.Root>
								{/if}

								{#if saveModelsSuccess}
									<Alert.Root>
										<CheckCircle2 class="size-4" />
										<Alert.Description>Model settings saved successfully.</Alert.Description>
									</Alert.Root>
								{/if}

								<div class="flex justify-end">
									<Button onclick={saveModels} disabled={savingModels}>
										{#if savingModels}
											<Loader2 class="mr-2 size-4 animate-spin" />
											Saving…
										{:else}
											Save model settings
										{/if}
									</Button>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</Tabs.Content>

				<!-- ── Health Tab ──────────────────────────────────────────── -->
				<Tabs.Content value="health">
					<Card.Root class={panelCard}>
						<Card.Header class="px-6 pt-6 pb-4">
							<Card.Title class="flex items-center gap-2 text-base">
								<Activity class="size-4 text-primary" />
								System Health
							</Card.Title>
							<Card.Description>
								Live status of all backend components and external integrations.
							</Card.Description>
						</Card.Header>
						<Card.Content class="px-6 pb-6">
							{#if healthLoading}
								<div class="flex items-center gap-2 text-muted-foreground">
									<Loader2 class="size-4 animate-spin" />
									<span class="text-sm">Checking health…</span>
								</div>
							{:else if healthError}
								<Alert.Root variant="destructive">
									<CircleAlert class="size-4" />
									<Alert.Description>{healthError}</Alert.Description>
								</Alert.Root>
							{:else if health}
								<!-- Overall status banner -->
								<div class="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
									{#if health.status === 'ok'}
										<CheckCircle2 class="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
									{:else if health.status === 'degraded'}
										<AlertTriangle class="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
									{:else}
										<XCircle class="size-5 shrink-0 text-red-600 dark:text-red-400" />
									{/if}
									<div>
										<p class="text-sm font-medium capitalize">Overall: {health.status}</p>
										<p class={cn(supportingCopyClass, 'text-xs')}>
											{health.platform} · Python {health.python_version}
										</p>
									</div>
									<Badge class="ml-auto" variant={statusBadgeVariant(health.status)}>
										{health.status.toUpperCase()}
									</Badge>
								</div>

								<!-- Component list -->
								<div class="space-y-3">
									{#each Object.entries(health.components) as [name, component]}
										<div class="flex items-center justify-between rounded-md border border-border px-4 py-3">
											<div>
												<p class="text-sm font-medium capitalize">{name.replace(/_/g, ' ')}</p>
												{#each Object.entries(component).filter(([k]) => k !== 'status') as [key, val]}
													<p class={cn(supportingCopyClass, 'text-xs')}>
														{key}: {String(val)}
													</p>
												{/each}
											</div>
											<Badge variant={statusBadgeVariant(component.status)}>
												{component.status}
											</Badge>
										</div>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</Tabs.Content>

				<!-- ── Environment Tab ─────────────────────────────────────── -->
				<Tabs.Content value="env">
					<Card.Root class={panelCard}>
						<Card.Header class="px-6 pt-6 pb-4">
							<Card.Title class="flex items-center gap-2 text-base">
								<Cpu class="size-4 text-primary" />
								Environment Snapshot
							</Card.Title>
							<Card.Description>
								Read-only view of active configuration values. Sensitive secrets are never exposed.
							</Card.Description>
						</Card.Header>
						<Card.Content class="px-6 pb-6">
							{#if envLoading}
								<div class="flex items-center gap-2 text-muted-foreground">
									<Loader2 class="size-4 animate-spin" />
									<span class="text-sm">Loading environment…</span>
								</div>
							{:else if envError}
								<Alert.Root variant="destructive">
									<CircleAlert class="size-4" />
									<Alert.Description>{envError}</Alert.Description>
								</Alert.Root>
							{:else if env}
								<div class="overflow-hidden rounded-md border border-border">
									<table class="w-full text-sm">
										<thead>
											<tr class="border-b border-border bg-muted/40">
												<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Key</th>
												<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Value</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-border">
											{#each Object.entries(env).filter(([k]) => k !== 'providers_configured') as [key, val]}
												<tr class="hover:bg-muted/20">
													<td class="px-4 py-2.5 font-mono text-xs text-muted-foreground">{key}</td>
													<td class="px-4 py-2.5 font-mono text-xs">{String(val)}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>

								{#if env.providers_configured && Object.keys(env.providers_configured).length > 0}
									<div class="mt-4">
										<p class={cn(metricLabelClass, 'mb-2 text-xs')}>Providers configured</p>
										<div class="flex flex-wrap gap-2">
											{#each Object.entries(env.providers_configured) as [provider, configured]}
												<Badge variant={configured ? 'default' : 'outline'}>
													{configured ? '✓' : '✗'} {provider}
												</Badge>
											{/each}
										</div>
									</div>
								{/if}
							{/if}
						</Card.Content>
					</Card.Root>
				</Tabs.Content>

				<!-- ── Server Tuning Tab ───────────────────────────────────── -->
				<Tabs.Content value="tuning">
					<Card.Root class={panelCard}>
						<Card.Header class="px-6 pt-6 pb-4">
							<Card.Title class="flex items-center gap-2 text-base">
								<Zap class="size-4 text-primary" />
								Server Tuning
							</Card.Title>
							<Card.Description>
								Adjust real-time connection and polling parameters without restarting the server.
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-6 px-6 pb-6">
							{#if settingsLoading}
								<div class="flex items-center gap-2 text-muted-foreground">
									<Loader2 class="size-4 animate-spin" />
									<span class="text-sm">Loading settings…</span>
								</div>
							{:else if settingsError}
								<Alert.Root variant="destructive">
									<CircleAlert class="size-4" />
									<Alert.Description>{settingsError}</Alert.Description>
								</Alert.Root>
							{:else if settings}
								<div class="grid gap-6 sm:grid-cols-2">
									<div class="space-y-2">
										<Label for="sse-keepalive">SSE keepalive interval (seconds)</Label>
										<Input
											id="sse-keepalive"
											type="number"
											min="0.1"
											step="0.1"
											bind:value={draftSseKeepalive}
										/>
										<p class={cn(supportingCopyClass, 'text-xs')}>
											How often a heartbeat ping is sent on SSE connections. Lower = faster
											disconnect detection.
										</p>
									</div>

									<div class="space-y-2">
										<Label for="poll-seconds">Job status poll interval (seconds)</Label>
										<Input
											id="poll-seconds"
											type="number"
											min="0.1"
											step="0.1"
											bind:value={draftPollSeconds}
										/>
										<p class={cn(supportingCopyClass, 'text-xs')}>
											How frequently the frontend polls for async job results.
										</p>
									</div>
								</div>

								{#if saveTuningError}
									<Alert.Root variant="destructive">
										<AlertTriangle class="size-4" />
										<Alert.Description>{saveTuningError}</Alert.Description>
									</Alert.Root>
								{/if}

								{#if saveTuningSuccess}
									<Alert.Root>
										<CheckCircle2 class="size-4" />
										<Alert.Description>Tuning settings saved successfully.</Alert.Description>
									</Alert.Root>
								{/if}

								<div class="flex justify-end">
									<Button onclick={saveTuning} disabled={savingTuning}>
										{#if savingTuning}
											<Loader2 class="mr-2 size-4 animate-spin" />
											Saving…
										{:else}
											Save tuning settings
										{/if}
									</Button>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				</Tabs.Content>
			</Tabs.Root>
		</div>
	{/if}
</div>
