<script lang="ts">
	import './layout.css';
	import { auth } from '$lib/auth';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		void auth.init();
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" sizes="any" href="/favicon.ico" />
	<link rel="shortcut icon" href="/favicon.ico" />
</svelte:head>
{@render children()}
