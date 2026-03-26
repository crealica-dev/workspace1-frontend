<script lang="ts">
	import './layout.css';
	import { auth } from '$lib/auth';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		void auth.init();
	});

	$effect(() => {
		themeStore.apply();
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" sizes="any" href="/favicon.ico" />
	<link rel="shortcut icon" href="/favicon.ico" />
</svelte:head>
{@render children()}
