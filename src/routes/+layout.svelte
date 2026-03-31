<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { QueryClient } from '@tanstack/query-core';
	import Navbar from '$lib/components/Navbar.svelte';

	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: 60_000 } }
	});

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	<Navbar />
	<main class="container mx-auto max-w-7xl px-4 py-6">
		{@render children()}
	</main>
</QueryClientProvider>
