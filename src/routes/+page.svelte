<script lang="ts">
	import { apiBaseUrl } from '$lib/config';
</script>

<svelte:head>
	<title>Workspace Frontend</title>
	<meta
		name="description"
		content="Minimal SvelteKit frontend scaffold for the Workspace multimodal content studio."
	/>
</svelte:head>

<section class="hero">
	<p class="eyebrow">SvelteKit Frontend</p>
	<h1>Workspace Content Studio</h1>
	<p class="copy">
		This is the standalone frontend repository for the studio web app. It is intentionally minimal so we
		can grow it around the FastAPI backend without dragging demo-only Gradio assumptions into the UI.
	</p>

	<div class="card-grid">
		<article class="card">
			<h2>Backend Target</h2>
			<p>{apiBaseUrl}</p>
		</article>

		<article class="card">
			<h2>Current Scope</h2>
			<p>Authentication, project selection, sessions, and AI capability pages will be added here next.</p>
		</article>
	</div>
</section>

<style>
	:global(body) {
		margin: 0;
		font-family:
			'Segoe UI',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
		background:
			radial-gradient(circle at top, rgba(43, 91, 153, 0.18), transparent 35%),
			linear-gradient(180deg, #f5f7fb 0%, #eef2f8 100%);
		color: #142033;
	}

	.hero {
		max-width: 56rem;
		margin: 0 auto;
		padding: 6rem 1.5rem 4rem;
	}

	.eyebrow {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #47617f;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.5rem, 6vw, 4.75rem);
		line-height: 0.98;
	}

	.copy {
		max-width: 44rem;
		margin: 1.25rem 0 0;
		font-size: 1.05rem;
		line-height: 1.7;
		color: #384b65;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
		margin-top: 2rem;
	}

	.card {
		padding: 1.1rem 1.2rem;
		border: 1px solid rgba(39, 63, 94, 0.12);
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(8px);
		box-shadow: 0 14px 40px rgba(23, 36, 56, 0.07);
	}

	.card h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}

	.card p {
		margin: 0;
		line-height: 1.6;
		color: #40536d;
		word-break: break-word;
	}
</style>
