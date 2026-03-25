<script lang="ts">
	import { auth } from "$lib/auth";
	import {
		listAssetVersions,
		listProjectAssets,
		uploadProjectAsset,
		type AssetVersion,
		type ProjectAsset,
	} from "$lib/api/projects";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { agentPanelState } from "$lib/stores/agent-panel.svelte";
	import { projectStore } from "$lib/stores/project.svelte";
	import { workspaceSearchStore } from "$lib/stores/workspace-search.svelte";
	import {
		Clock3,
		ExternalLink,
		File as FileIcon,
		FileText,
		FolderKanban,
		FolderOpen,
		FolderPlus,
		Folders,
		Image,
		MessagesSquare,
		Mic,
		Play,
		RefreshCw,
		Sparkles,
		Upload,
	} from "@lucide/svelte";

	type AssetKind = "image" | "video" | "audio" | "document" | "other";

	type FolderEntry = {
		key: string;
		label: string;
		path: string | null;
		count: number;
		depth: number;
	};

	type FilterEntry = {
		key: string;
		label: string;
		count: number;
	};

	const ALL_FOLDERS_KEY = "__all__";
	const ROOT_FOLDER_KEY = "__root__";

	let accessToken = $state("");
	let assets = $state<ProjectAsset[]>([]);
	let assetVersions = $state<AssetVersion[]>([]);
	let selectedAssetId = $state<string | null>(null);
	let libraryLoading = $state(false);
	let versionsLoading = $state(false);
	let uploading = $state(false);
	let libraryError = $state("");
	let versionsError = $state("");
	let folderDraft = $state("");
	let activeFolder = $state(ALL_FOLDERS_KEY);
	let activeType = $state("all");
	let activeSource = $state("all");
	let fileInput = $state<HTMLInputElement | null>(null);
	let libraryLoadedForProjectId = $state<string | null>(null);

	const currentProject = $derived(projectStore.currentProject);
	const recentSessions = $derived(projectStore.sessions.slice(0, 4));
	const workspaceStatus = $derived(projectStore.status);
	const searchQuery = $derived(workspaceSearchStore.query.trim().toLowerCase());

	$effect(() => {
		return auth.session.subscribe((session) => {
			accessToken = session?.access_token ?? "";
		});
	});

	$effect(() => {
		if (!currentProject?.id || !accessToken) {
			assets = [];
			assetVersions = [];
			selectedAssetId = null;
			libraryError = "";
			versionsError = "";
			libraryLoadedForProjectId = null;
		}
	});

	$effect(() => {
		const projectId = currentProject?.id;
		if (!projectId || !accessToken || workspaceStatus !== "ready") return;
		if (libraryLoadedForProjectId === projectId) return;

		libraryLoadedForProjectId = projectId;
		void refreshLibrary();
	});

	const sortedAssets = $derived.by(() =>
		[...assets].sort((left, right) => {
			const leftTimestamp = Date.parse(left.updated_at ?? left.created_at ?? "");
			const rightTimestamp = Date.parse(right.updated_at ?? right.created_at ?? "");
			return rightTimestamp - leftTimestamp;
		}),
	);

	const folderEntries = $derived.by(() => {
		let rootCount = 0;
		const counts = new Map<string, number>();

		for (const asset of sortedAssets) {
			const folder = getAssetFolder(asset);
			if (!folder) {
				rootCount += 1;
				continue;
			}

			counts.set(folder, (counts.get(folder) ?? 0) + 1);
		}

		const dynamicEntries = [...counts.entries()]
			.sort((left, right) => left[0].localeCompare(right[0]))
			.map(([folder, count]) => ({
				key: folder,
				label: folder.split("/").at(-1) ?? folder,
				path: folder,
				count,
				depth: Math.max(folder.split("/").length - 1, 0),
			}));

		return [
			{
				key: ALL_FOLDERS_KEY,
				label: "All assets",
				path: null,
				count: sortedAssets.length,
				depth: 0,
			},
			{
				key: ROOT_FOLDER_KEY,
				label: "Library root",
				path: "",
				count: rootCount,
				depth: 0,
			},
			...dynamicEntries,
		] satisfies FolderEntry[];
	});

	$effect(() => {
		if (folderEntries.some((entry) => entry.key === activeFolder)) return;
		activeFolder = ALL_FOLDERS_KEY;
	});

	const typeEntries = $derived.by(() => {
		const counts = new Map<string, number>([
			["image", 0],
			["video", 0],
			["audio", 0],
			["document", 0],
			["other", 0],
		]);

		for (const asset of sortedAssets) {
			const kind = getAssetKind(asset);
			counts.set(kind, (counts.get(kind) ?? 0) + 1);
		}

		return [
			{ key: "all", label: "All types", count: sortedAssets.length },
			{ key: "image", label: "Images", count: counts.get("image") ?? 0 },
			{ key: "video", label: "Videos", count: counts.get("video") ?? 0 },
			{ key: "audio", label: "Audio", count: counts.get("audio") ?? 0 },
			{ key: "document", label: "Docs", count: counts.get("document") ?? 0 },
			{ key: "other", label: "Other", count: counts.get("other") ?? 0 },
		] satisfies FilterEntry[];
	});

	const sourceEntries = $derived.by(() => {
		const counts = new Map<string, number>();

		for (const asset of sortedAssets) {
			const source = getAssetSource(asset);
			counts.set(source, (counts.get(source) ?? 0) + 1);
		}

		const orderedSources = ["upload", "instagram", "youtube", "x"];
		const dynamicEntries = [...counts.entries()]
			.filter(([source]) => !orderedSources.includes(source))
			.sort((left, right) => left[0].localeCompare(right[0]))
			.map(([source, count]) => ({
				key: source,
				label: humanizeSource(source),
				count,
			}));

		const primaryEntries = orderedSources.map((source) => ({
			key: source,
			label: humanizeSource(source),
			count: counts.get(source) ?? 0,
		}));

		return [
			{ key: "all", label: "All sources", count: sortedAssets.length },
			...primaryEntries,
			...dynamicEntries,
		].filter((entry, index) => index === 0 || entry.count > 0) satisfies FilterEntry[];
	});

	const visibleAssets = $derived.by(() =>
		sortedAssets.filter((asset) => {
			const folder = getAssetFolder(asset);
			const kind = getAssetKind(asset);
			const source = getAssetSource(asset);

			if (activeFolder === ROOT_FOLDER_KEY && folder) return false;
			if (
				activeFolder !== ALL_FOLDERS_KEY &&
				activeFolder !== ROOT_FOLDER_KEY &&
				folder !== activeFolder
			) {
				return false;
			}
			if (activeType !== "all" && kind !== activeType) return false;
			if (activeSource !== "all" && source !== activeSource) return false;
			if (searchQuery && !matchesQuery(asset, searchQuery)) return false;
			return true;
		}),
	);

	$effect(() => {
		if (!visibleAssets.length) {
			selectedAssetId = null;
			return;
		}

		if (selectedAssetId && visibleAssets.some((asset) => asset.id === selectedAssetId)) return;
		selectedAssetId = visibleAssets[0]?.id ?? null;
	});

	const selectedAsset = $derived(
		visibleAssets.find((asset) => asset.id === selectedAssetId) ??
			sortedAssets.find((asset) => asset.id === selectedAssetId) ??
			null,
	);

	const totalFolderCount = $derived(
		folderEntries.filter((entry) => entry.key !== ALL_FOLDERS_KEY && entry.key !== ROOT_FOLDER_KEY)
			.length,
	);

	const previewableCount = $derived(
		sortedAssets.filter((asset) => {
			const kind = getAssetKind(asset);
			return getPreviewUrl(asset) && (kind === "image" || kind === "video" || kind === "audio");
		}).length,
	);

	const activeFolderLabel = $derived(
		folderEntries.find((entry) => entry.key === activeFolder)?.path ??
			(activeFolder === ROOT_FOLDER_KEY ? "library root" : "all folders"),
	);

	const uploadTargetFolder = $derived(
		normalizeFolderInput(folderDraft) ??
			(activeFolder !== ALL_FOLDERS_KEY && activeFolder !== ROOT_FOLDER_KEY
				? activeFolder
				: undefined),
	);

	$effect(() => {
		const projectId = currentProject?.id;
		const assetId = selectedAsset?.id;

		if (!projectId || !assetId || !accessToken || workspaceStatus !== "ready") {
			assetVersions = [];
			versionsError = "";
			return;
		}

		let cancelled = false;
		versionsLoading = true;
		versionsError = "";

		void listAssetVersions(projectId, assetId, accessToken)
			.then((versions) => {
				if (cancelled) return;
				assetVersions = versions;
			})
			.catch((error) => {
				if (cancelled) return;
				const normalized = projectStore.reportRuntimeError(
					error,
					"The preview metadata could not be loaded.",
				);
				versionsError = normalized.userMessage;
				assetVersions = [];
			})
			.finally(() => {
				if (!cancelled) versionsLoading = false;
			});

		return () => {
			cancelled = true;
		};
	});

	function getMetadataString(metadata: Record<string, unknown>, key: string): string | null {
		const value = metadata[key];
		return typeof value === "string" && value.trim() ? value.trim() : null;
	}

	function getPreviewUrl(asset: ProjectAsset): string | null {
		return getMetadataString(asset.metadata, "signed_url");
	}

	function getVersionPreviewUrl(version: AssetVersion): string | null {
		return getMetadataString(version.metadata, "signed_url");
	}

	function getAssetFolder(asset: ProjectAsset): string {
		const metadataFolder = getMetadataString(asset.metadata, "folder");
		if (metadataFolder) return metadataFolder;
		if (!asset.library_path) return "";

		const marker = "/library/";
		const markerIndex = asset.library_path.indexOf(marker);
		if (markerIndex === -1) return "";

		const relativePath = asset.library_path.slice(markerIndex + marker.length);
		const segments = relativePath.split("/").filter(Boolean);
		segments.pop();
		return segments.join("/");
	}

	function getAssetSource(asset: ProjectAsset): string {
		return getMetadataString(asset.metadata, "source")?.toLowerCase() ?? "upload";
	}

	function getAssetKind(asset: ProjectAsset): AssetKind {
		const mimeType = (asset.mime_type ?? "").toLowerCase();
		const assetType = asset.asset_type.toLowerCase();

		if (mimeType.startsWith("image/") || assetType.includes("image")) return "image";
		if (mimeType.startsWith("video/") || assetType.includes("video")) return "video";
		if (mimeType.startsWith("audio/") || assetType.includes("audio")) return "audio";
		if (
			mimeType.startsWith("text/") ||
			mimeType.includes("pdf") ||
			mimeType.includes("json") ||
			mimeType.includes("document") ||
			mimeType.includes("sheet") ||
			assetType.includes("text") ||
			assetType.includes("document")
		) {
			return "document";
		}

		return "other";
	}

	function getAssetKindLabel(kind: AssetKind): string {
		switch (kind) {
			case "image":
				return "Image";
			case "video":
				return "Video";
			case "audio":
				return "Audio";
			case "document":
				return "Document";
			default:
				return "File";
		}
	}

	function getAssetKindBadgeClass(kind: AssetKind): string {
		switch (kind) {
			case "image":
				return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300";
			case "video":
				return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300";
			case "audio":
				return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300";
			case "document":
				return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
			default:
				return "border-border bg-muted/40 text-muted-foreground";
		}
	}

	function getAssetKindIcon(kind: AssetKind) {
		switch (kind) {
			case "image":
				return Image;
			case "video":
				return Play;
			case "audio":
				return Mic;
			case "document":
				return FileText;
			default:
				return FileIcon;
		}
	}

	function matchesQuery(asset: ProjectAsset, query: string): boolean {
		const haystack = [
			asset.display_name,
			asset.asset_type,
			asset.mime_type ?? "",
			getAssetFolder(asset),
			getAssetSource(asset),
		]
			.join(" ")
			.toLowerCase();

		return haystack.includes(query);
	}

	function humanizeSource(source: string): string {
		switch (source) {
			case "upload":
				return "Upload";
			case "instagram":
				return "Instagram";
			case "youtube":
				return "YouTube";
			case "x":
				return "X";
			default:
				return source.charAt(0).toUpperCase() + source.slice(1);
		}
	}

	function normalizeFolderInput(value: string): string | undefined {
		const normalized = value.trim().replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
		return normalized || undefined;
	}

	function inferAssetType(file: globalThis.File): string {
		if (file.type.startsWith("image/")) return "image";
		if (file.type.startsWith("video/")) return "video";
		if (file.type.startsWith("audio/")) return "audio";
		if (
			file.type.startsWith("text/") ||
			file.type.includes("pdf") ||
			file.type.includes("json") ||
			file.type.includes("document")
		) {
			return "document";
		}

		return "binary";
	}

	function formatBytes(bytes: number | null | undefined): string {
		if (!bytes || bytes <= 0) return "Unknown size";
		const units = ["B", "KB", "MB", "GB"];
		let value = bytes;
		let index = 0;

		while (value >= 1024 && index < units.length - 1) {
			value /= 1024;
			index += 1;
		}

		return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
	}

	function formatDate(iso: string | null | undefined): string {
		if (!iso) return "Unknown date";
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return "Unknown date";
		return date.toLocaleString(undefined, {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	}

	function openRecentSession(sessionId: string) {
		const session = projectStore.sessions.find((entry) => entry.id === sessionId);
		if (!session) return;
		projectStore.currentSession = session;
		agentPanelState.open();
	}

	async function refreshLibrary(options: { focusAssetId?: string } = {}): Promise<void> {
		const projectId = currentProject?.id;
		if (!projectId || !accessToken) return;

		libraryLoading = true;
		libraryError = "";

		try {
			const nextAssets = await listProjectAssets(projectId, accessToken);
			assets = nextAssets;

			const preferredId = options.focusAssetId ?? selectedAssetId;
			if (preferredId && nextAssets.some((asset) => asset.id === preferredId)) {
				selectedAssetId = preferredId;
			} else {
				selectedAssetId = nextAssets[0]?.id ?? null;
			}
		} catch (error) {
			const normalized = projectStore.reportRuntimeError(
				error,
				"The project library could not be loaded.",
			);
			libraryError = normalized.userMessage;
		} finally {
			libraryLoading = false;
		}
	}

	async function handleUploadSelection(event: Event): Promise<void> {
		const projectId = currentProject?.id;
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		input.value = "";

		if (!projectId || !accessToken || !files.length) return;

		uploading = true;
		libraryError = "";

		try {
			let lastUploadedAssetId: string | null = null;
			for (const file of files) {
				const response = await uploadProjectAsset(projectId, file, accessToken, {
					assetType: inferAssetType(file),
					displayName: file.name,
					folder: uploadTargetFolder,
					source: "upload",
				});
				lastUploadedAssetId = response.asset.id;
			}

			await refreshLibrary({ focusAssetId: lastUploadedAssetId ?? undefined });
		} catch (error) {
			const normalized = projectStore.reportRuntimeError(
				error,
				"The selected files could not be uploaded to the library.",
			);
			libraryError = normalized.userMessage;
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Projects - Workspace</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<section class="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
		<Card.Root class="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/35 shadow-sm">
			<Card.Content class="flex h-full flex-col gap-6 p-6 sm:p-7">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div class="space-y-3">
						<Badge
							variant="outline"
							class="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
						>
							Project library
						</Badge>
						<div class="space-y-2">
							<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
								{currentProject?.name ?? "Workspace library"}
							</h1>
							<p class="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
								Keep uploads, generated assets, and reference material in one project-scoped
								library. The header search now filters this page across file names, folder
								paths, sources, and asset types.
							</p>
						</div>
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<input
							bind:this={fileInput}
							type="file"
							multiple
							class="hidden"
							onchange={handleUploadSelection}
						/>
						<Button
							class="gap-2 rounded-full px-4"
							disabled={workspaceStatus !== "ready" || uploading}
							onclick={() => fileInput?.click()}
						>
							<Upload class="size-4" />
							{uploading ? "Uploading..." : "Upload assets"}
						</Button>
						<Button
							variant="outline"
							class="gap-2 rounded-full px-4"
							onclick={() => agentPanelState.open()}
						>
							<Sparkles class="size-4" />
							Open Agent
						</Button>
					</div>
				</div>

				<div class="grid gap-3 md:grid-cols-3">
					<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Assets
						</p>
						<p class="mt-3 text-3xl font-semibold tracking-tight">{sortedAssets.length}</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">
							All project uploads and generated files stay grouped here.
						</p>
					</div>
					<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Folders
						</p>
						<p class="mt-3 text-3xl font-semibold tracking-tight">{totalFolderCount}</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">
							Folder paths mirror the backend library structure for cleaner retrieval.
						</p>
					</div>
					<div class="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-sm">
						<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
							Preview-ready
						</p>
						<p class="mt-3 text-3xl font-semibold tracking-tight">{previewableCount}</p>
						<p class="mt-1 text-sm leading-6 text-muted-foreground">
							Images, videos, and audio files now get signed preview links from the API.
						</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border/70 shadow-sm">
			<Card.Header>
				<Card.Title>Library notes</Card.Title>
				<Card.Description>
					Aligned with the current FastAPI asset model and storage path policy.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="rounded-2xl border border-border/70 bg-muted/25 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Storage path
					</p>
					<p class="mt-2 text-sm font-medium leading-6">
						<code>users/&#123;user_id&#125;/projects/&#123;project_id&#125;/library/...</code>
					</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						Folder paths entered here now flow into backend storage instead of staying flat.
					</p>
				</div>

				<div class="rounded-2xl border border-border/70 bg-muted/25 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Header search
					</p>
					<p class="mt-2 text-sm font-medium leading-6">
						{workspaceSearchStore.query
							? `Filtering by “${workspaceSearchStore.query}”`
							: "Ready to filter assets from the top search bar"}
					</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						Search checks display names, folder names, MIME type, and import source in one pass.
					</p>
				</div>

				<div class="rounded-2xl border border-border/70 bg-muted/25 p-4">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Upload target
					</p>
					<p class="mt-2 text-sm font-medium leading-6">
						{uploadTargetFolder ?? "library root"}
					</p>
					<p class="mt-1 text-sm leading-6 text-muted-foreground">
						New uploads follow the typed folder path, or the folder currently selected in the rail.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</section>

	<section id="library" class="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
		<Card.Root class="border-border/70 shadow-sm">
			<Card.Header>
				<Card.Title>Folder structure</Card.Title>
				<Card.Description>Browse root files, nested folders, and source-specific slices.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-5">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						<Folders class="size-3.5" />
						Folders
					</div>
					<div class="space-y-1">
						{#each folderEntries as entry (entry.key)}
							<button
								type="button"
								class={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
									activeFolder === entry.key
										? "border-primary/40 bg-primary/8 text-foreground shadow-sm"
										: "border-transparent bg-muted/25 text-muted-foreground hover:border-border/70 hover:bg-muted/45 hover:text-foreground"
								}`}
								style={`padding-left: ${0.75 + entry.depth * 0.8}rem;`}
								onclick={() => {
									activeFolder = entry.key;
								}}
							>
								<div class="flex min-w-0 items-center gap-2">
									{#if entry.key === ALL_FOLDERS_KEY}
										<FolderKanban class="size-4 shrink-0" />
									{:else if entry.key === ROOT_FOLDER_KEY}
										<FolderOpen class="size-4 shrink-0" />
									{:else}
										<FolderPlus class="size-4 shrink-0" />
									{/if}
									<span class="truncate">{entry.label}</span>
								</div>
								<span class="text-xs">{entry.count}</span>
							</button>
						{/each}
					</div>
				</div>

				<div class="space-y-2">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Type filters
					</p>
					<div class="flex flex-wrap gap-2">
						{#each typeEntries as entry (entry.key)}
							<button
								type="button"
								class={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
									activeType === entry.key
										? "border-primary/40 bg-primary/8 text-foreground"
										: "border-border/70 bg-background text-muted-foreground hover:text-foreground"
								}`}
								onclick={() => {
									activeType = entry.key;
								}}
							>
								{entry.label} · {entry.count}
							</button>
						{/each}
					</div>
				</div>

				<div class="space-y-2">
					<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
						Sources
					</p>
					<div class="flex flex-wrap gap-2">
						{#each sourceEntries as entry (entry.key)}
							<button
								type="button"
								class={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
									activeSource === entry.key
										? "border-primary/40 bg-primary/8 text-foreground"
										: "border-border/70 bg-background text-muted-foreground hover:text-foreground"
								}`}
								onclick={() => {
									activeSource = entry.key;
								}}
							>
								{entry.label} · {entry.count}
							</button>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="border-border/70 shadow-sm">
			<Card.Header class="gap-4 border-b pb-4">
				<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
					<div class="space-y-1">
						<Card.Title>Asset browser</Card.Title>
						<Card.Description>
							{visibleAssets.length} result{visibleAssets.length === 1 ? "" : "s"} shown in {activeFolderLabel}.
						</Card.Description>
					</div>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							class="gap-2 rounded-xl"
							onclick={() => refreshLibrary()}
							disabled={libraryLoading || workspaceStatus !== "ready"}
						>
							<RefreshCw class={`size-3.5 ${libraryLoading ? "animate-spin" : ""}`} />
							Refresh
						</Button>
					</div>
				</div>

				<div class="flex flex-col gap-3 md:flex-row md:items-center">
					<div class="flex-1 space-y-2">
						<label class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" for="library-folder-input">
							Folder path
						</label>
						<Input
							id="library-folder-input"
							bind:value={folderDraft}
							placeholder="campaigns/spring-launch"
							class="h-10 rounded-xl"
						/>
					</div>
					<div class="flex items-end gap-2">
						<Button
							class="gap-2 rounded-xl"
							disabled={workspaceStatus !== "ready" || uploading}
							onclick={() => fileInput?.click()}
						>
							<Upload class="size-4" />
							{uploading ? "Uploading..." : "Add files"}
						</Button>
					</div>
				</div>
			</Card.Header>

			<Card.Content class="p-5">
				{#if libraryError}
					<div class="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
						<p class="font-medium">Library sync failed</p>
						<p class="mt-1 leading-6">{libraryError}</p>
					</div>
				{:else if libraryLoading && !sortedAssets.length}
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each Array.from({ length: 6 }) as _, index (index)}
							<div class="overflow-hidden rounded-3xl border border-border/70 bg-muted/25 p-3">
								<div class="aspect-[4/3] animate-pulse rounded-2xl bg-muted"></div>
								<div class="mt-3 space-y-2">
									<div class="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
									<div class="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
								</div>
							</div>
						{/each}
					</div>
				{:else if !visibleAssets.length}
					<div class="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
						<div class="flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
							<FolderOpen class="size-6" />
						</div>
						<h2 class="mt-4 text-lg font-semibold tracking-tight">No assets match this view</h2>
						<p class="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
							Try a different folder, clear the header search, or upload fresh assets into
							{uploadTargetFolder ?? "the library root"}.
						</p>
						<div class="mt-5 flex flex-wrap justify-center gap-2">
							<Button
								class="gap-2 rounded-full px-4"
								disabled={workspaceStatus !== "ready" || uploading}
								onclick={() => fileInput?.click()}
							>
								<Upload class="size-4" />
								Upload assets
							</Button>
							<Button
								variant="outline"
								class="gap-2 rounded-full px-4"
								onclick={() => {
									activeFolder = ALL_FOLDERS_KEY;
									activeSource = "all";
									activeType = "all";
									workspaceSearchStore.clear();
								}}
							>
								Reset filters
							</Button>
						</div>
					</div>
				{:else}
					<div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
						{#each visibleAssets as asset (asset.id)}
							{@const assetKind = getAssetKind(asset)}
							{@const AssetIcon = getAssetKindIcon(assetKind)}
							{@const assetPreviewUrl = getPreviewUrl(asset)}
							<button
								type="button"
								class={`group overflow-hidden rounded-3xl border bg-background text-left shadow-sm transition hover:-translate-y-[1px] hover:border-primary/35 hover:bg-muted/30 ${
									selectedAsset?.id === asset.id
										? "border-primary/40 ring-1 ring-primary/20"
										: "border-border/70"
								}`}
								onclick={() => {
									selectedAssetId = asset.id;
								}}
							>
								<div class="aspect-[4/3] border-b border-border/60 bg-muted/25 p-3">
									{#if assetKind === "image" && assetPreviewUrl}
										<img
											src={assetPreviewUrl}
											alt={asset.display_name}
											class="h-full w-full rounded-2xl object-cover"
										/>
									{:else if assetKind === "video" && assetPreviewUrl}
										<video
											src={assetPreviewUrl}
											class="h-full w-full rounded-2xl object-cover"
											muted
											playsinline
											preload="metadata"
										></video>
									{:else}
										<div class="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/70 text-center">
											<AssetIcon class="size-8 text-muted-foreground" />
											<p class="mt-2 text-xs font-medium text-muted-foreground">
												{getAssetKindLabel(assetKind)}
											</p>
										</div>
									{/if}
								</div>
								<div class="space-y-3 p-4">
									<div class="flex flex-wrap items-center gap-2">
										<Badge variant="outline" class={getAssetKindBadgeClass(assetKind)}>
											{getAssetKindLabel(assetKind)}
										</Badge>
										<Badge variant="outline" class="rounded-full border-border/70 bg-background/80">
											{humanizeSource(getAssetSource(asset))}
										</Badge>
									</div>
									<div class="space-y-1.5">
										<p class="truncate text-sm font-semibold">{asset.display_name}</p>
										<p class="truncate text-xs text-muted-foreground">
											{getAssetFolder(asset) || "Library root"}
										</p>
									</div>
									<div class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
										<span class="truncate">{asset.mime_type ?? asset.asset_type}</span>
										<span>{formatDate(asset.updated_at ?? asset.created_at)}</span>
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<div class="flex flex-col gap-4">
			<Card.Root class="border-border/70 shadow-sm">
				<Card.Header>
					<Card.Title>Preview</Card.Title>
					<Card.Description>
						Inspect the selected asset, confirm folder placement, and reuse it in chat.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if selectedAsset}
						{@const selectedAssetKind = getAssetKind(selectedAsset)}
						{@const selectedAssetPreviewUrl = getPreviewUrl(selectedAsset)}
						{@const selectedAssetSource = getAssetSource(selectedAsset)}
						{@const SelectedAssetIcon = getAssetKindIcon(selectedAssetKind)}
						<div class="overflow-hidden rounded-3xl border border-border/70 bg-muted/25 p-3">
							{#if selectedAssetKind === "image" && selectedAssetPreviewUrl}
								<img
									src={selectedAssetPreviewUrl}
									alt={selectedAsset.display_name}
									class="aspect-[4/3] w-full rounded-2xl object-cover"
								/>
							{:else if selectedAssetKind === "video" && selectedAssetPreviewUrl}
								<video
									src={selectedAssetPreviewUrl}
									muted
									playsinline
									preload="metadata"
									class="aspect-[4/3] w-full rounded-2xl bg-black object-contain"
								></video>
							{:else if selectedAssetKind === "audio" && selectedAssetPreviewUrl}
								<div class="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-background px-5 text-center">
									<Mic class="size-8 text-muted-foreground" />
									<p class="mt-3 text-sm font-medium">{selectedAsset.display_name}</p>
									<audio controls class="mt-4 w-full">
										<source src={selectedAssetPreviewUrl} />
									</audio>
								</div>
							{:else}
								<div class="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl bg-background text-center">
									<SelectedAssetIcon class="size-8 text-muted-foreground" />
									<p class="mt-3 text-sm font-medium">{selectedAsset.display_name}</p>
									<p class="mt-1 max-w-[16rem] text-xs leading-5 text-muted-foreground">
										Preview is limited for this asset type, but the signed file link is still
										available below.
									</p>
								</div>
							{/if}
						</div>

						<div class="space-y-3">
							<div class="flex flex-wrap gap-2">
								<Badge variant="outline" class={getAssetKindBadgeClass(selectedAssetKind)}>
									{getAssetKindLabel(selectedAssetKind)}
								</Badge>
								<Badge variant="outline" class="rounded-full border-border/70 bg-background/80">
									{humanizeSource(selectedAssetSource)}
								</Badge>
							</div>
							<div>
								<p class="text-base font-semibold">{selectedAsset.display_name}</p>
								<p class="mt-1 text-sm leading-6 text-muted-foreground">
									{getAssetFolder(selectedAsset) || "Library root"}
								</p>
							</div>
							<div class="grid gap-3 text-sm sm:grid-cols-2">
								<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
									<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
										File type
									</p>
									<p class="mt-2 font-medium">{selectedAsset.mime_type ?? selectedAsset.asset_type}</p>
								</div>
								<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
									<p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
										Updated
									</p>
									<p class="mt-2 font-medium">
										{formatDate(selectedAsset.updated_at ?? selectedAsset.created_at)}
									</p>
								</div>
							</div>
						</div>

						<div class="flex flex-wrap gap-2">
							<Button class="gap-2 rounded-xl" onclick={() => agentPanelState.open()}>
								<Sparkles class="size-4" />
								Ask in chat
							</Button>
							{#if selectedAssetPreviewUrl}
								<a
									href={selectedAssetPreviewUrl}
									target="_blank"
									rel="noreferrer"
									class="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm font-medium shadow-xs transition hover:bg-accent hover:text-accent-foreground"
								>
									<ExternalLink class="size-4" />
									Open file
								</a>
							{/if}
						</div>
					{:else}
						<div class="rounded-3xl border border-dashed bg-muted/20 px-5 py-10 text-center">
							<p class="text-sm font-medium">Choose an asset to preview it here.</p>
							<p class="mt-2 text-sm leading-6 text-muted-foreground">
								The right rail will show signed previews, MIME details, and version history.
							</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-border/70 shadow-sm">
				<Card.Header>
					<Card.Title>Versions</Card.Title>
					<Card.Description>Latest stored revisions for the current library item.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if versionsError}
						<div class="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">
							{versionsError}
						</div>
					{:else if versionsLoading}
						<div class="space-y-2">
							{#each Array.from({ length: 3 }) as _, index (index)}
								<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
									<div class="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
									<div class="mt-2 h-3 w-2/3 animate-pulse rounded bg-muted"></div>
								</div>
							{/each}
						</div>
					{:else if !assetVersions.length}
						<div class="rounded-2xl border border-dashed bg-muted/20 px-4 py-6 text-sm leading-6 text-muted-foreground">
							Version history appears here after an asset is selected.
						</div>
					{:else}
						<div class="space-y-2">
							{#each assetVersions as version (version.id)}
								<div class="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-medium">
												{version.version_label ?? "Latest version"}
											</p>
											<p class="mt-1 text-xs leading-5 text-muted-foreground">
												{formatBytes(version.size_bytes)} · {formatDate(version.created_at)}
											</p>
										</div>
										{#if getVersionPreviewUrl(version)}
											<a
												href={getVersionPreviewUrl(version) ?? "#"}
												target="_blank"
												rel="noreferrer"
												class="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition hover:text-foreground"
											>
												<ExternalLink class="size-3.5" />
											</a>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root class="border-border/70 shadow-sm">
				<Card.Header>
					<Card.Title>Recent sessions</Card.Title>
					<Card.Description>Jump from the library into the latest project-aware chats.</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-2">
					{#if !recentSessions.length}
						<div class="rounded-2xl border border-dashed bg-muted/20 px-4 py-6 text-sm leading-6 text-muted-foreground">
							Open the agent to start the first session for this project.
						</div>
					{:else}
						{#each recentSessions as session (session.id)}
							<button
								type="button"
								class="flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3 text-left shadow-sm transition hover:border-primary/35 hover:bg-muted/30"
								onclick={() => openRecentSession(session.id)}
							>
								<div class="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<MessagesSquare class="size-4" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{session.title ?? "Untitled chat"}</p>
									<p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
										<Clock3 class="size-3.5" />
										{formatDate(session.created_at)}
									</p>
								</div>
							</button>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</section>
</div>
